import { http } from '@/api/common/http'

/**
 * ===============================
 * API prefix 상수
 * ===============================
 * - READ_ONLY_API : 조회(Query) 전용 API (MyBatis)
 * - JPA_API       : 상태 변경(CUD)용 API (JPA 사용)
 */
const READ_ONLY_API = '/api/query/cmmnCd'
const JPA_API = '/api/jpa'

/**
 * ===============================
 * 코드 결과(CmmnCd) DTO
 * ===============================
 * - 조회 API에서 내려주는 유저 정보 구조
 */
export interface CmmnCd {
  commonCode: string // 공톹코드
  commonCodeName: string // 공통코드명
  commonCodeDtl: string // 서브코드
  commonCodeDtlName: string // 서브코드명
  activeYn: string // 사용여부
  sortOrder: number // 순서
  description: string // 설명
  attr1: string // 속성1
  attr2: string // 속성2
  attr3: string // 속성3
  attr4: string // 속성4
  attr5: string // 속성5
  attr6: string // 속성6
  attr7: string // 속성7
  attr8: string // 속성8
  attr9: string // 속성9
  attr0: string // 속성10
  createdAt: string // 생성일시
  createdUserId: number // 생성유저
  createdUserName: string // 생서유저명
  updatedAt: string // 수정일시
  updatedUserId: number // 수정유저
  updatedUserName: string // 수정유저명
  value: string // 공통코드 selectbox용
  lavel: string // 공통코드명 selectbox용
}

/**
 * ===============================
 * 코드 파라미터(CmmnCd) DTO
 * ===============================
 */
export interface CommonParams {
  commonCode?: string // 공통코드
  commonCodeName?: string // 공통코드명
  commonCodeDtl?: string // 서브코드
  commonCodeDtlName?: string // 서브코드명
}

/**
 * ===============================
 * 공통코드 저장(JPA) DTO
 * ===============================
 */
export interface CmmnCdDto {
  crudType: 'I' | 'U' | 'D'
  commonCode: string
  commonCodeName?: string
  activeYn?: string
  sortOrder?: number
  description?: string
  attr1?: string
  attr2?: string
  attr3?: string
  attr4?: string
  attr5?: string
  attr6?: string
  attr7?: string
  attr8?: string
  attr9?: string
  attr10?: string
  createdUserId?: number
  updatedUserId?: number
}

/**
 * ===============================
 * 서브공통코드 저장 (CUD, JPA)
 * ===============================
 */
export interface CmmnCdDtl {
  crudType: 'I' | 'U' | 'D'
  commonCode: string
  commonCodeDtl: string
  commonCodeDtlName?: string
  activeYn?: string
  sortOrder?: number
  description?: string
  attr1?: string
  attr2?: string
  attr3?: string
  attr4?: string
  attr5?: string
  attr6?: string
  attr7?: string
  attr8?: string
  attr9?: string
  attr10?: string
  createdUserId?: number
  updatedUserId?: number
}

/**
 * ===============================
 * 공통코드 검색 조회 API
 * ===============================
 * POST /api/query/cmmnCd/CmmnCdList
 *
 * @param param 공통 CommonParams
 */
export function fetchCmmnCdByCondition(
  param: CommonParams
) {
  return http.post<CmmnCd[]>(
    `${READ_ONLY_API}/cmmnCdList`,
    param
  )
}

/**
 * ===============================
 * 서브코드 검색 조회 API
 * ===============================
 * POST /api/query/cmmnCd/CmmnCdDtlList
 *
 * @param param 공통 CommonParams
 */
export function fetchCmmnCdDtlByCondition(
  param: CommonParams
) {
  return http.post<CmmnCd[]>(
    `${READ_ONLY_API}/cmmnCdDtlList`,
    param
  )
}

/**
 * ===============================
 * selectbox 옵션을 검색 조회 API
 * ===============================
 * POST /api/query/cmmnCd/selectOption
 *
 * @param param 공통 CommonParams
 */
export function fetchCmmnCdSelectOptionByCondition(
  param: CommonParams
) {
  return http.post<CmmnCd[]>(
    `${READ_ONLY_API}/selectOption`,
    param
  )
}

/**
 * ===============================
 * 공통코드 저장 (CUD, JPA)
 * ===============================
 * POST /api/jpa/cmmnCd/batch
 *
 * @param payload CmmnCdDto[]
 */
export function saveCommonCodes(payload: CmmnCdDto[]) {
  return http.post<void>(`${JPA_API}/cmmnCd/batch`, payload)
}

/**
 * ===============================
 * 서브코드 저장 (CUD, JPA)
 * ===============================
 * POST /api/jpa/cmmnCd/batch
 *
 * @param payload CmmnCdDto[]
 */
export function saveCommonCodeDtls(payload: CmmnCdDtl[]) {
  return http.post<void>(
    `${JPA_API}/cmmnCdDtl/batch`,
    payload
  )
}
