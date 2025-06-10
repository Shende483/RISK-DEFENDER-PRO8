import type {
  AxiosError,
  AxiosHeaders,
  AxiosInstance,
  AxiosResponse,
  AxiosRequestConfig,
} from 'axios';

import axios from 'axios';

export const API_BASE_URL = `http://${import.meta.env.VITE_BACKEND_IP}:${import.meta.env.VITE_BACKEND_PORT}`;

export interface ApiResponse<T> {
  success: any;
  access_token: any;
  message: string;
  data: T;
  status: string;
  statusCode: number;
  subscriptionId: string;
}

export default class BaseService {
  private static accessToken = localStorage.getItem('accessToken');

  private static userId: string = localStorage.getItem('appUser') || '';

  private static clientIp: string = ''; // Placeholder for IP address

  static header = {
    Authorization: `Bearer ${this.accessToken}`,
    'Accept-Language': 'en',
  };

  private static api: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: this.header,
  });

  // Static initializer block to set up interceptors and fetch IP
  private static initialize() {
    // Add request interceptor to include IP, timestamp, and dynamic token
    this.api.interceptors.request.use(
      (config) => {
        // Fetch the latest access token from localStorage
        const currentToken = localStorage.getItem('accessToken');
        // Log the token for debugging
        console.log('Sending request with token:', currentToken || 'No token found');
        // Update Authorization header for this request
        config.headers.Authorization = `Bearer ${currentToken || ''}`;

        // Generate fresh timestamp for each request
        const timestamp = new Date().toISOString();
        config.headers['X-Request-Timestamp'] = timestamp;
        config.headers['X-Client-Ip'] = this.clientIp;

        // Ensure params exist and add timestamp and IP
        config.params = config.params || {};
        config.params.timestamp = timestamp;
        config.params.clientIp = this.clientIp;

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor to handle token expiration
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        if (
          error.response?.status === 403 &&
          (error.response.data as any)?.message?.includes('jwt expired') &&
          !originalRequest._retry
        ) {
          originalRequest._retry = true; // Prevent infinite retry loops
          console.log('Token expired, attempting to refresh...');

          try {
            // Fetch refresh token from localStorage
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) {
              console.error('No refresh token found');
              return await Promise.reject(new Error('No refresh token available'));
            }

            // Call refresh token endpoint
            const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            // Assuming backend returns new access token in response.data.access_token
            const newAccessToken = refreshResponse.data.access_token;
            if (!newAccessToken) {
              console.error('No new access token received');
              return await Promise.reject(new Error('Failed to refresh token'));
            }

            // Update localStorage with new access token
            localStorage.setItem('accessToken', newAccessToken);
            console.log('Token refreshed, new token:', newAccessToken);

            // Update original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

            // Retry the original request
            return await this.api(originalRequest);
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            return Promise.reject(refreshError);
          }
        }

        console.error('API Response Error:', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        return Promise.reject(error);
      }
    );

    // Fetch client IP
    this.fetchClientIp();
  }

  // Method to fetch client IP
  private static async fetchClientIp() {
    try {
      const response = await axios.get('https://api.ipify.org?format=json');
      this.clientIp = response.data.ip || 'unknown';
    } catch (error) {
      console.error('Failed to fetch client IP:', error);
      this.clientIp = 'unknown'; // Fallback value
    }
  }

  // Call initialize statically
  static {
    this.initialize();
  }

  static getApi() {
    return this.api;
  }

  static getUserId() {
    return this.userId;
  }

  // In BaseService.ts
  protected static async handleRequest<T>(
    request: Promise<AxiosResponse<ApiResponse<T>>>
  ): Promise<ApiResponse<T>> {
    try {
      const response = await request;
      console.log('API Success:', {
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
      if (response.status >= 200 && response.status < 600) {
        return response.data;
      }
      throw new Error(response.data?.message || `Request failed with status ${response.status}`);
    } catch (error: any) {
      const axiosError = error as AxiosError;
      console.error('API Error:', {
        url: axiosError.config?.url,
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message,
      });
      throw error;
    }
  }

  // Add this to BaseService class
  public static async postLogin(url: string, body: object) {
    return this.api
      .post(url, body)
      .then((response) => {
        if (response.status >= 200 && response.status < 600) {
          return response.data; // Return the raw data without further processing
        }
        throw new Error(response.data.message || 'Request failed');
      })
      .catch((error) => {
        const axiosError = error;
        if (axiosError.response) {
          throw new Error(axiosError.response?.data?.message || 'Request failed');
        } else {
          throw new Error('Network error');
        }
      });
  }

  public static post<T>(url: string, body: object) {
    return this.handleRequest<T>(this.api.post(url, body));
  }

  protected static postParam<T>(url: string, reqParam: unknown) {
    return this.handleRequest<T>(this.api.post(url, null, { params: reqParam }));
  }

  protected static async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.handleRequest<T>(this.api.get(url, config));
  }

  protected static getHeaders<T>(url: string, headers: AxiosHeaders) {
    return this.handleRequest<T>(this.api.get(url, { headers }));
  }

  protected static getParam<T>(url: string, reqParam: unknown) {
    return this.handleRequest<T>(this.api.get(url, { params: reqParam }));
  }

  public static put<T>(url: string, body: object) {
    return this.handleRequest<T>(this.api.put(url, body));
  }

  protected static delete<T>(url: string) {
    return this.handleRequest<T>(this.api.delete(url));
  }
}