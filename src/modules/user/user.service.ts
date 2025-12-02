import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { UpdateProfileDto, ChangePasswordDto } from './dto/index';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(isActive?: boolean) {
    const where: Prisma.UserWhereInput = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        dob: true,
        gender: true,
        grade: true,
        isVerified: true,
        xp: true,
        streakDays: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            attempts: true,
            xpLogs: true,
            streakLogs: true,
          },
        },
      },
    });
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        dob: true,
        gender: true,
        grade: true,
        isVerified: true,
        xp: true,
        streakDays: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // Exclude sensitive info like passwordHash
        _count: {
          select: {
            attempts: true,
            xpLogs: true,
            streakLogs: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Normalize nullable values and ensure grade/isVerified are always present
    return {
      ...user,
      avatarUrl: user.avatarUrl || undefined,
      dob: user.dob || undefined,
      grade: user.grade ?? 'GRADE_1',
      isVerified: user.isVerified ?? false,
    };
  }

  async findProfileStatistics(id: number) {
    // Check if user exists
    await this.findById(id);

    // Get learning statistics
    const learningStats = await this.prisma.$transaction(async (tx) => {
      // Get total lesson attempts
      const totalAttempts = await tx.attempt.count({
        where: { userId: id },
      });

      // Get completed lessons
      const completedLessons = await tx.attempt.count({
        where: {
          userId: id,
          isCompleted: true,
        },
      });

      // Get total XP
      const user = await tx.user.findUnique({
        where: { id },
        select: { xp: true, streakDays: true },
      });

      // Get streak information
      const currentStreak = user?.streakDays || 0;

      // Get best day XP
      const bestDay = await tx.streakLog.findFirst({
        where: { userId: id },
        orderBy: { xpEarned: 'desc' },
        select: { day: true, xpEarned: true },
      });

      return {
        totalAttempts,
        completedLessons,
        totalXp: user?.xp || 0,
        currentStreak,
        bestDayXp: bestDay?.xpEarned || 0,
        bestDay: bestDay?.day || null,
      };
    });

    return learningStats;
  }

  async updateStatus(id: number, isActive: boolean) {
    // Ensure user exists
    await this.findById(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        dob: true,
        gender: true,
        grade: true,
        isVerified: true,
        xp: true,
        streakDays: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            attempts: true,
            xpLogs: true,
            streakLogs: true,
          },
        },
      },
    });
    return {
      ...updated,
      avatarUrl: updated.avatarUrl || undefined,
      dob: updated.dob || undefined,
      grade: updated.grade ?? 'GRADE_1',
      isVerified: updated.isVerified ?? false,
    };
  }

  async resetPassword(email: string, newPassword: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng với email này');
    }

    // Check if user is verified
    if (!user.isVerified) {
      throw new BadRequestException('Email chưa được xác thực');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword },
    });

    return {
      success: true,
      message: 'Đặt lại mật khẩu thành công',
    };
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    // Find user by ID
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Không thể xác thực người dùng');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    // Check if new password is same as current password
    const isSamePassword = await bcrypt.compare(
      changePasswordDto.newPassword,
      user.passwordHash,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'Mật khẩu mới không được trùng với mật khẩu hiện tại',
      );
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      saltRounds,
    );

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });

    return {
      success: true,
      message: 'Đổi mật khẩu thành công',
    };
  }

  /**
   * Upload file to Cloudinary
   * Returns the secure URL of the uploaded file
   */
  private async uploadToCloudinary(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'avatars',
          use_filename: true,
          unique_filename: true,
          transformation: [
            { width: 500, height: 500, crop: 'fill', gravity: 'face' },
            { quality: 'auto', fetch_format: 'auto' },
          ],
        },
        (error, result) => {
          if (error) {
            reject(
              new BadRequestException(
                `Cloudinary upload failed: ${error.message}`,
              ),
            );
          } else if (result) {
            resolve(result.secure_url);
          } else {
            reject(
              new BadRequestException('Cloudinary upload failed: No result'),
            );
          }
        },
      );

      const bufferStream = Readable.from(file.buffer);
      bufferStream.pipe(uploadStream);
    });
  }

  async updateProfile(
    id: number,
    updateProfileDto: UpdateProfileDto,
    avatarFile?: Express.Multer.File,
  ) {
    // Ensure user exists
    await this.findById(id);

    // Prepare update data
    const updateData: Prisma.UserUpdateInput = {};

    if (updateProfileDto.name !== undefined) {
      updateData.name = updateProfileDto.name;
    }

    if (updateProfileDto.grade !== undefined) {
      updateData.grade = updateProfileDto.grade;
    }

    if (updateProfileDto.dob !== undefined) {
      updateData.dob = new Date(updateProfileDto.dob);
    }

    if (updateProfileDto.gender !== undefined) {
      updateData.gender = updateProfileDto.gender;
    }

    // Handle avatar upload if file is provided
    if (avatarFile) {
      const avatarUrl = await this.uploadToCloudinary(avatarFile);
      updateData.avatarUrl = avatarUrl;
    } else if (updateProfileDto.avatarUrl !== undefined) {
      updateData.avatarUrl = updateProfileDto.avatarUrl;
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatarUrl: true,
        dob: true,
        gender: true,
        grade: true,
        isVerified: true,
        xp: true,
        streakDays: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            attempts: true,
            xpLogs: true,
            streakLogs: true,
          },
        },
      },
    });

    return {
      ...updated,
      avatarUrl: updated.avatarUrl || undefined,
      dob: updated.dob || undefined,
      grade: updated.grade ?? 'GRADE_1',
      isVerified: updated.isVerified ?? false,
    };
  }
}
