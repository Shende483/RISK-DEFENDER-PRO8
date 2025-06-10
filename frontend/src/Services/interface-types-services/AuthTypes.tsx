export interface RegisterData {
  name: string;
  email: string;
  mobileNumber: string;
  password: string;
}

export interface sendOtp {
  email: string;
}

export interface verifyOtp {
  email: string;
  otp: string;
}

export interface CreateUserDto {
  name: string;
  lastName: string;
  email: string;
  countryCode: string;
  mobile: string;
  password: string;
}

// types/login.types.ts

export interface LoginUserDto {
  email?: string;
  mobile?: string;
  password: string;
  otp?: string;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
  status: string;
  statusCode: number;
}

// types/forgotpass.types.ts

export interface ForgetPasswordDto {
  email?: string;
  mobile?: string;
  password: string;
}
