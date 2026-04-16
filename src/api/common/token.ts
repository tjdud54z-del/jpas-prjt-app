/**
 * ===============================
 * JWT payload 디코딩 함수
 * ===============================
 * - JWT 구조: header.payload.signature
 * - payload 부분(Base64)을 디코딩하여 JSON 객체로 변환
 * - 실패 시(null) 반환
 */
export function decodeJwt(token: string): any | null {
  try {
    const payload = token.split('.')[1]
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

/**
 * ===============================
 * accessToken 남은 만료 시간(ms) 계산
 * ===============================
 * - localStorage에 저장된 accessToken 기준
 * - JWT payload.exp 값을 사용
 * - exp는 "초 단위"이므로 ms로 변환 필요
 */
export function getTokenExpireRemain(): number {
  const token = localStorage.getItem('accessToken')
  if (!token) return 0

  const payload = decodeJwt(token)
  if (!payload?.exp) return 0

  return payload.exp * 1000 - Date.now() // exp는 초 단위
}