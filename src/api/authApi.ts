import { http } from '@/api/common/http'

export interface LoginRequest {
  employeeNo: string
  password: string
}

export interface LoginResponse {
  userInfo: any
  tokenType: string   // "Bearer"
  accessToken: string
  expiresInSeconds: number // 1800 (30분)
}

export const loginApi = (payload: LoginRequest) => {
  return http.post<LoginResponse>('/api/auth/login', payload)
}
