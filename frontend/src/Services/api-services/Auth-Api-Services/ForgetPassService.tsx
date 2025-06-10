import BaseService from '../../api-base/axios-base-service';

import type { ForgetPasswordDto } from '../../interface-types-services/AuthTypes';

export default class ForgetPasswordService {
  static async sendOtpEmail(email: string) {
    return BaseService.post<{ message: string }>('auth/forget-password/verify-email', { email });
  }

  static async sendOtpMobile(mobile: string) {
    return BaseService.post<{ message: string }>('auth/forget-password/verify-mobile', { mobile });
  }

  static async verifyOtpEmail(email: string, otp: string) {
    return BaseService.post<{ message: string }>('auth/forget-password/verify-otp-email', {
      email,
      otp,
    });
  }

  static async verifyOtpMobile(mobile: string, otp: string) {
    return BaseService.post<{ message: string }>('auth/forget-password/verify-otp-mobile', {
      mobile,
      otp,
    });
  }

  static async resetPassword(forgetPasswordDto: ForgetPasswordDto) {
    return BaseService.post<{ message: string }>('auth/forget-password/update', forgetPasswordDto);
  }
}
