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
  user: User;
  // Tokens are delivered as httpOnly cookies, not in response body
}

export interface ErrorResponse {
  success: false;
  error: string;
  code: number;
}