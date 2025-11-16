import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '../prisma/prisma.service';

interface OTPData {
  code: string;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private otpStore = new Map<string, OTPData>();

  constructor(
    private mailerService: MailerService,
    private prisma: PrismaService,
  ) {}

  /**
   * Generate 6-digit OTP code
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP email
   */
  async sendOTP(email: string): Promise<Date> {
    try {
      const code = this.generateOTP();
      const createdAt = new Date();
      const expiresAt = new Date(Date.now() + 180 * 1000); // 3 minutes

      // Store OTP in memory
      this.otpStore.set(email, { code, createdAt, expiresAt });

      // Auto delete after 3 minutes
      setTimeout(() => {
        this.otpStore.delete(email);
        this.logger.log(`OTP expired and deleted for ${email}`);
      }, 180 * 1000);

      // Send email
      await this.mailerService.sendMail({
        to: email,
        subject: `Mã OTP xác thực - 4KidStudy`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .otp-box { background: white; padding: 30px; text-align: center; margin: 20px 0; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .otp-code { font-size: 36px; font-weight: bold; color: #10b981; letter-spacing: 8px; }
              .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 5px; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0;">🎓 4KidStudy</h1>
                <p style="margin: 10px 0 0 0;">Xác thực Email</p>
              </div>
              <div class="content">
                <p>Xin chào,</p>
                <p>Bạn đang thực hiện xác thực email trên hệ thống 4KidStudy.</p>
                <p>Mã OTP của bạn là:</p>
                
                <div class="otp-box">
                  <div class="otp-code">${code}</div>
                </div>

                <div class="warning">
                  <strong>⚠️ Lưu ý quan trọng:</strong>
                  <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                    <li>Mã này có hiệu lực trong <strong>3 phút</strong></li>
                    <li>Không chia sẻ mã này với bất kỳ ai</li>
                    <li>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email</li>
                  </ul>
                </div>

                <p>Trân trọng,<br><strong>Đội ngũ 4KidStudy</strong></p>
              </div>
              <div class="footer">
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                <p>© 2025 4KidStudy. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      this.logger.log(`OTP sent to ${email}`);
      return expiresAt;
    } catch (error) {
      this.logger.error(`Failed to send OTP: ${error.message}`);
      throw new BadRequestException(
        'Không thể gửi email OTP. Vui lòng thử lại',
      );
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(email: string, code: string): Promise<boolean> {
    const otpData = this.otpStore.get(email);

    if (!otpData) {
      throw new BadRequestException('Mã OTP không tồn tại hoặc đã hết hạn');
    }

    const now = new Date();
    const timeElapsed = (now.getTime() - otpData.createdAt.getTime()) / 1000; // seconds

    // Check if 3 minutes (180 seconds) have passed since creation
    if (timeElapsed > 180) {
      this.otpStore.delete(email);
      throw new BadRequestException(
        `Mã OTP đã hết hạn (đã qua ${Math.floor(timeElapsed)} giây)`,
      );
    }

    // Verify code
    if (otpData.code !== code) {
      throw new BadRequestException('Mã OTP không chính xác');
    }

    // Delete OTP after successful verification
    this.otpStore.delete(email);

    // Update user isVerified status
    try {
      await this.prisma.user.update({
        where: { email },
        data: { isVerified: true },
      });
      this.logger.log(
        `User ${email} verified successfully (after ${Math.floor(timeElapsed)}s)`,
      );
    } catch (error) {
      this.logger.error(`Failed to update user verification status: ${error}`);
      throw new BadRequestException(
        'Xác thực thành công nhưng không thể cập nhật trạng thái',
      );
    }

    return true;
  }

  /**
   * Get OTP store size (for monitoring)
   */
  getOTPStoreSize(): number {
    return this.otpStore.size;
  }
}
