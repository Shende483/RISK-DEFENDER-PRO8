import BaseService from '../api-base/axios-base-service';

export default class UserExitService extends BaseService {
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

  public static getUserId(): string {
    const userId = localStorage.getItem('userId');
    return userId !== null ? userId : '';
  }

  static async getUserExitAccount(marketTypeId: string, brokerId: string, existing: string) {
    return BaseService.get(
      `user-exit-account/usertrading-detail/?marketTypeId=${marketTypeId}&brokerId=${brokerId}&existing=${existing}`
    );
  }
}
