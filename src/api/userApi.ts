import { http } from '@/api/common/http'

/**
 * ===============================
 * API prefix 상수
 * ===============================
 * - READ_ONLY_API : 조회(Query) 전용 API (MyBatis)
 * - JPA_API       : 상태 변경(CUD)용 API (JPA 사용)
 */
const READ_ONLY_API = '/api/query'
const JPA_API = '/api/jpa'

/**
 * ===============================
 * 유저정보 결과(user) DTO
 * ===============================
 * - 조회 API에서 내려주는 유저 정보 구조
 */
export interface User {
  userId: number // 유저아이디(PK)
  userNo: string // 유저번호(UK)
  name: string // 유저명
  addressMain: string // 부서코드
  addressSub: string // 직급코드
  activeYn: 'Y' | 'N' // 재직여부
}

/**
 * ===============================
 * 유저정보 파라미터(User) DTO
 * ===============================
 */
export interface CommonParams {
  userNo: string // 유저번호(UK)
  password: string // 비밀번호
  name: string // 유저명
  email: string // 이메일
  addressMain: string // 부서코드
  addressSub: string // 직급코드
  birthDate: string // 입사일
  activeYn: 'Y' | 'N' // 재직여부
}

/**
 * ===============================
 * 유저정보 검색조건(UserSearchParam) DTO
 * ===============================
 * - 유저 검색 화면에서 사용하는 입력 파라미터
 * - optional(?) 처리하여 미입력 값 허용됨
 */
export interface UserSearchParam {
  userNo?: string
  name?: string
  activeYn?: '' | 'Y' | 'N'
}

/**
 * ===============================
 * 유저 전체 조회 API
 * ===============================
 * GET /api/query/users
 */
export function fetchUsers() {
  return http.get<User[]>(`${READ_ONLY_API}/users`)
}

/**
 * ===============================
 * 유저 단건 조회 API
 * ===============================
 * GET /api/query/users/{id}
 *
 * @param id 유저 ID
 */
export function fetchUser(id: number) {
  return http.get<User>(`${READ_ONLY_API}/users/${id}`)
}

/**
 * ===============================
 * 유저 검색 조회 API
 * ===============================
 * POST /api/query/users/search
 *
 * @param param 검색 조건 (사번, 이름, 재직여부)
 */
export function fetchUsersByCondition(param: UserSearchParam) {
  return http.post<User[]>(`${READ_ONLY_API}/users/search`, param)
}

/**
 * ===============================
 * 유저 저장
 * ===============================
 * POST /api/query/users/search
 *
 * @param params 공통파라미터
 */
export function createUser(params: CommonParams) {
  return http.post<number>(`${JPA_API}/users`, params)
}

/**
 * ===============================
 * 유저 수정
 * ===============================
 * POST /api/query/users/search
 *
 * @param params 공통파라미터
 */
export function updateUser(params: CommonParams) {
  return http.put<void>(`${JPA_API}/users`, params)
}

/**
 * ===============================
 * 유저 삭제 (다건)
 * ===============================
 * POST /api/query/users/search
 *
 * @param userIds 사번 리스트
 */
export function deleteUsers(userIds: number[]) {
  return http.delete<void>(`${JPA_API}/users`, {
    data: { userIds }
  })
}

/**
 * ===============================
 * 유저 일괄 퇴사 처리 API
 * ===============================
 * PUT /api/jpa/users/retire
 *
 * @param userIds 퇴사 처리할 유저 ID 목록
 */
export function retireUsers(userIds: number[]) {
  return http.put<void>(`${JPA_API}/users/retire`, {
    userIds
  })
}

/**
 * ===============================
 * 유저 일괄 복직 처리 API
 * ===============================
 * PUT /api/jpa/users/restore
 *
 * @param userIds 복직 처리할 유저 ID 목록
 */
export function restoreUsers(userIds: number[]) {
  return http.put<void>(`${JPA_API}/users/restore`, {
    userIds
  })
}
