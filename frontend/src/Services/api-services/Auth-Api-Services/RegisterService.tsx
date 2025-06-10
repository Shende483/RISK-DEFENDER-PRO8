import BaseService from '../../api-base/axios-base-service';

import type { CreateUserDto } from '../../interface-types-services/AuthTypes';


export default class AuthService {
  public static setAccessToken(authData: { accessToken: string; appUser: string; userId: string }) {
    localStorage.setItem('appUser', JSON.stringify(authData.appUser));
    localStorage.setItem('accessToken', authData.accessToken);
    localStorage.setItem('userId', authData.userId);
  }

  public static getAppUser() {
    return JSON.parse(localStorage.getItem('appUser') as string);
  }

  public static getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  public static getUserId() {
    return localStorage.getItem('userId');
  }

  static async sendOtpEmail(email: string) {
    return BaseService.post<{ message: string }>('auth/register/verify-email', { email });
  }

  static async sendOtpMobile(mobile: string) {
    return BaseService.post<{ message: string }>('auth/register/verify-mobile', { mobile });
  }

  static async verifyOtpEmail(email: string, otp: string) {
    return BaseService.post<{ message: string }>('auth/register/verify-otp-email', { email, otp });
  }

  static async verifyOtpMobile(mobile: string, otp: string) {
    return BaseService.post<{ message: string }>('auth/register/verify-otp-mobile', {
      mobile,
      otp,
    });
  }

  static async register(createUserDto: CreateUserDto) {
    return BaseService.post<{ message: string }>('auth/register', createUserDto);
  }

  static logout() {
    localStorage.clear();
    return true;
  }
}
