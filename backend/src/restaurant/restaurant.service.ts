import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRestaurantDto, CreateTableDto, UpdateTableStatusDto, OnboardRestaurantDto } from './dto/restaurant.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import * as bcrypt from 'bcrypt';

@Injectable()
export class RestaurantService {
  constructor(
    private prisma: PrismaService,
    private realtime: RealtimeGateway,
  ) {}

  // Restaurant Operations
  async createRestaurant(dto: CreateRestaurantDto) {
    return this.prisma.restaurant.create({
      data: dto,
    });
  }

  /**
   * Super-Admin-only flow: creates a brand new restaurant AND its first
   * OWNER account together, atomically. This is the only supported way to
   * bring a new restaurant onto the platform — nothing about role or
   * restaurant assignment is ever taken from an unauthenticated caller.
   */
  async onboardRestaurant(dto: OnboardRestaurantDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.ownerEmail } });
    if (existingUser) {
      throw new BadRequestException('A user with this owner email already exists');
    }

    let ownerRole = await this.prisma.role.findUnique({ where: { name: 'OWNER' } });
    if (!ownerRole) {
      ownerRole = await this.prisma.role.create({ data: { name: 'OWNER', description: 'Restaurant owner/admin' } });
    }

    const hashedPassword = await bcrypt.hash(dto.ownerPassword, 10);

    return this.prisma.$transaction(async (tx) => {
      const restaurant = await tx.restaurant.create({
        data: {
          name: dto.name,
          address: dto.address,
          phone: dto.phone,
          gstNumber: dto.gstNumber,
          status: 'ACTIVE',
        },
      });

      const ownerUser = await tx.user.create({
        data: {
          email: dto.ownerEmail,
          password: hashedPassword,
          name: dto.ownerName,
          roleId: ownerRole.id,
        },
      });

      await tx.staff.create({
        data: {
          userId: ownerUser.id,
          restaurantId: restaurant.id,
          phone: dto.ownerPhone || dto.phone,
          salary: 0,
          status: 'ACTIVE',
        },
      });

      return {
        restaurant,
        owner: { id: ownerUser.id, email: ownerUser.email, name: ownerUser.name },
      };
    });
  }

  async findAllRestaurants() {
    return this.prisma.restaurant.findMany({
      include: {
        _count: {
          select: { staff: true, tables: true, orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneRestaurant(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: {
        tables: true,
        menuCategories: true,
      },
    });
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    return restaurant;
  }

  async updateRestaurant(id: string, dto: CreateRestaurantDto) {
    return this.prisma.restaurant.update({
      where: { id },
      data: dto,
    });
  }

  async updateRestaurantStatus(id: string, status: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return this.prisma.restaurant.update({
      where: { id },
      data: { status },
    });
  }

  async deleteRestaurant(id: string) {
    return this.prisma.restaurant.delete({
      where: { id },
    });
  }

  // Table Operations
  async createTable(dto: CreateTableDto) {
    return this.prisma.table.create({
      data: {
        number: dto.number,
        capacity: dto.capacity,
        status: dto.status || 'AVAILABLE',
        restaurantId: dto.restaurantId,
        qrCode: `TABLE_QR_${dto.number}_${Date.now()}`,
      },
    });
  }

  async findTablesByRestaurant(restaurantId: string) {
    return this.prisma.table.findMany({
      where: { restaurantId },
      orderBy: { number: 'asc' },
    });
  }

  async updateTableStatus(id: string, status: string) {
    const table = await this.prisma.table.update({
      where: { id },
      data: { status },
    });
    this.realtime.sendTableUpdate(table);
    return table;
  }

  async deleteTable(id: string) {
    return this.prisma.table.delete({
      where: { id },
    });
  }
}
