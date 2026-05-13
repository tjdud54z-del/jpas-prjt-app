import { http } from '@/api/common/http'

/**
 * ===============================
 * API prefix 상수
 * ===============================
 * - READ_ONLY_API : 조회(Query) 전용 API (MyBatis)
 * - JPA_API       : 상태 변경(CUD)용 API (JPA 사용)
 */
const READ_ONLY_API = '/api/query/cmmnCd'
const JPA_API = '/api/jpa/cmmnCd'

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
  updatedAt: string // 수정일시
  updatedUserId: number // 수정유저
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
 * 공통코드 검색 조회 API
 * ===============================
 * POST /api/query/cmmnCd/search/CmmnCdList
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
 * POST /api/query/cmmnCd/search/CmmnCdDtlList
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
