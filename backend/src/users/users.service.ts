import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStaffDto, ClockInDto, ClockOutDto, CreateRoleDto, CreateStaffDto } from './dto/users.dto';
import * as bcrypt from 'bcrypt';

const PRIVILEGED_ROLES = ['SUPER_ADMIN', 'OWNER'];

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: {
          select: { name: true },
        },
        staff: true,
        createdAt: true,
      },
    });
  }

  async findAllRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: true,
      },
    });
  }

  async createRole(dto: CreateRoleDto) {
    // Find all requested permissions
    const permissions = await this.prisma.permission.findMany({
      where: {
        name: { in: dto.permissionNames },
      },
    });

    return this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        permissions: {
          connect: permissions.map((p) => ({ id: p.id })),
        },
      },
      include: {
        permissions: true,
      },
    });
  }

  /**
   * Creates a staff account within a restaurant. The caller's own role
   * decides which restaurant this staff belongs to:
   *  - OWNER: always their own restaurant (never trusts a client-supplied
   *    restaurantId — an Owner could otherwise plant an account in a
   *    restaurant that isn't theirs).
   *  - SUPER_ADMIN: must explicitly supply a restaurantId.
   * Neither can create another OWNER or SUPER_ADMIN through this endpoint —
   * those only come from RestaurantService.onboardRestaurant and the
   * one-time super-admin seed script, respectively.
   */
  async createStaff(
    dto: CreateStaffDto,
    caller: { role: string; restaurantId: string | null },
  ) {
    if (PRIVILEGED_ROLES.includes(dto.roleName.toUpperCase())) {
      throw new ForbiddenException('Cannot assign an OWNER or SUPER_ADMIN role through this endpoint');
    }

    let targetRestaurantId: string;
    if (caller.role === 'SUPER_ADMIN') {
      if (!dto.restaurantId) {
        throw new BadRequestException('restaurantId is required when a Super Admin creates staff');
      }
      targetRestaurantId = dto.restaurantId;
    } else {
      // OWNER (or any other staff-management role in future) — force their
      // own restaurant regardless of what the request body says.
      if (!caller.restaurantId) {
        throw new ForbiddenException('You are not associated with a restaurant');
      }
      targetRestaurantId = caller.restaurantId;
    }

    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: targetRestaurantId } });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new BadRequestException('A user with this email already exists');
    }

    let role = await this.prisma.role.findUnique({ where: { name: dto.roleName.toUpperCase() } });
    if (!role) {
      role = await this.prisma.role.create({ data: { name: dto.roleName.toUpperCase() } });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        roleId: role.id,
      },
    });

    const staff = await this.prisma.staff.create({
      data: {
        userId: user.id,
        restaurantId: targetRestaurantId,
        phone: dto.phone,
        salary: dto.salary || 0,
        status: 'ACTIVE',
      },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
      },
    });

    return staff;
  }

  // Staff endpoints
  async findAllStaffByRestaurant(restaurantId: string) {
    return this.prisma.staff.findMany({
      where: { restaurantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async updateStaff(id: string, dto: UpdateStaffDto) {
    return this.prisma.staff.update({
      where: { id },
      data: {
        phone: dto.phone,
        salary: dto.salary,
        status: dto.status,
      },
      include: {
        user: true,
      },
    });
  }

  async deleteStaff(id: string) {
    const staff = await this.prisma.staff.findUnique({ where: { id } });
    if (!staff) throw new NotFoundException('Staff not found');
    
    // Delete user (which cascades to staff)
    return this.prisma.user.delete({
      where: { id: staff.userId },
    });
  }

  // Attendance Endpoints
  async clockIn(staffId: string, dto: ClockInDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already clocked in today
    const existing = await this.prisma.attendance.findFirst({
      where: {
        staffId,
        date: today,
      },
    });

    if (existing) {
      throw new BadRequestException('Staff member already clocked in today');
    }

    return this.prisma.attendance.create({
      data: {
        staffId,
        date: today,
        clockIn: new Date(dto.clockInTime),
        status: dto.status,
      },
    });
  }

  async clockOut(staffId: string, dto: ClockOutDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findFirst({
      where: {
        staffId,
        date: today,
      },
    });

    if (!existing) {
      throw new NotFoundException('No clock-in record found for today');
    }

    return this.prisma.attendance.update({
      where: { id: existing.id },
      data: {
        clockOut: new Date(dto.clockOutTime),
      },
    });
  }

  async getAttendanceHistory(staffId: string) {
    return this.prisma.attendance.findMany({
      where: { staffId },
      orderBy: { date: 'desc' },
    });
  }

  async getTodayAttendanceSummary(restaurantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.prisma.attendance.findMany({
      where: {
        staff: { restaurantId },
        date: today,
      },
      include: {
        staff: {
          include: {
            user: {
              select: { name: true, role: true },
            },
          },
        },
      },
    });

    return attendance;
  }
}
