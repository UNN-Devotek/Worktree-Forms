export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
  message?: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  avatar: string | null;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: number;
}