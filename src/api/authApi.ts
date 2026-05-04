import { http } from '@/api/common/http';

/**
 * ===============================
 * 로그인 요청 DTO
 * ===============================
 * - userNo : 사번 (또는 로그인 ID)
 * - password   : 비밀번호
 */
export interface LoginRequest {
  userNo: string;
  password: string;
}

/**
 * ===============================
 * 로그인 응답 DTO
 * ===============================
 * - userInfo          : 로그인 사용자 정보
 * - tokenType         : 토큰 타입 (보통 "Bearer")
 * - accessToken       : JWT 액세스 토큰
 * - expiresInSeconds  : 토큰 만료 시간(초 단위)
 */
export interface LoginResponse {
  userInfo: any;
  tokenType: string; // "Bearer"
  accessToken: string;
  expiresInSeconds: number; // 1800 (30분)
}

/**
 * ===============================
 * 로그인 API
 * ===============================
 * - POST /api/auth/login
 * - LoginRequest 를 body로 전달
 * - 성공 시 LoginResponse 반환
 *
 * @param payload 로그인 요청 정보 (사번, 비밀번호)
 * @returns Axios Promise<LoginResponse>
 */
export const loginApi = (payload: LoginRequest) => {
  return http.post<LoginResponse>('/api/auth/login', payload);
};
