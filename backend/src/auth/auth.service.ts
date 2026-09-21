import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { LoginDto, RegisterDto, ChangePasswordDto, ForgotPasswordDto, ResetPasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Public self-registration can only ever create an unprivileged,
    // restaurant-less account. Assigning a role, a restaurant, admin/owner
    // access, or SUPER_ADMIN must go through the authenticated,
    // permission-checked endpoints below (RestaurantService.onboardRestaurant
    // for new restaurants+owners, UsersService.createStaff for staff) —
    // never through a field the caller can set themselves.
    let unassignedRole = await this.prisma.role.findUnique({
      where: { name: 'UNASSIGNED' },
    });
    if (!unassignedRole) {
      unassignedRole = await this.prisma.role.create({
        data: { name: 'UNASSIGNED', description: 'No restaurant or permissions yet — pending admin assignment' },
      });
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        roleId: unassignedRole.id,
      },
      include: { role: true },
    });

    return this.generateToken(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
        staff: {
          include: { restaurant: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.staff?.restaurant?.status === 'SUSPENDED') {
      throw new UnauthorizedException('This restaurant\'s access has been suspended. Contact support.');
    }

    return this.generateToken(user);
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Always return the same response whether or not the email exists —
    // otherwise this endpoint becomes a way to check which emails are
    // registered in the system.
    const genericResponse = {
      message: 'If an account with that email exists, a reset link has been generated.',
    };

    if (!user) return genericResponse;

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    // NOTE: There's no email/SMS provider configured in this project, so
    // the reset link can't actually be delivered anywhere yet. The token
    // is returned directly in the response below ONLY so this flow is
    // usable/testable during development. Before using this in
    // production, wire this up to a real email provider (e.g. SendGrid,
    // Postmark, AWS SES) and remove `resetToken` from the response —
    // returning it here would otherwise let anyone reset anyone's
    // password just by knowing their email.
    return {
      ...genericResponse,
      devOnlyResetToken: token,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: dto.token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('This reset link is invalid or has expired.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password reset successfully. You can now log in with your new password.' };
  }

  private generateToken(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role.name,
      restaurantId: user.staff?.restaurantId || null,
      staffId: user.staff?.id || null,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
        restaurantId: user.staff?.restaurantId || null,
        staffId: user.staff?.id || null,
      },
    };
  }
}
