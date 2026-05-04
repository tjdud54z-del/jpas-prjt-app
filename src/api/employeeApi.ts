import { http } from '@/api/common/http';

/**
 * ===============================
 * API prefix 상수
 * ===============================
 * - READ_ONLY_API : 조회(Query) 전용 API (MyBatis)
 * - JPA_API       : 상태 변경(CUD)용 API (JPA 사용)
 */
const READ_ONLY_API = '/api/query';
const JPA_API = '/api/jpa';

/**
 * ===============================
 * 직원정보 결과(Employee) DTO
 * ===============================
 * - 조회 API에서 내려주는 직원 정보 구조
 */
export interface Employee {
  userId: number; // 직원아이디(PK)
  userNo: string; // 직원번호(UK)
  name: string; // 직원명
  departmentCode: string; // 부서코드
  departmentName: string; // 부서명
  positionCode: string; // 직급코드
  positionName: string; // 직급명
  activeYn: 'Y' | 'N'; // 재직여부
}

/**
 * ===============================
 * 직원정보 파라미터(Employee) DTO
 * ===============================
 */
export interface CommonParams {
  userNo: string; // 직원번호(UK)
  password: string; // 비밀번호
  name: string; // 직원명
  email: string; // 이메일
  departmentCode: string; // 부서코드
  positionCode: string; // 직급코드
  hireDate: string; // 입사일
  activeYn: 'Y' | 'N'; // 재직여부
}

/**
 * ===============================
 * 직원정보 검색조건(EmployeeSearchParam) DTO
 * ===============================
 * - 직원 검색 화면에서 사용하는 입력 파라미터
 * - optional(?) 처리하여 미입력 값 허용됨
 */
export interface EmployeeSearchParam {
  userNo?: string;
  name?: string;
  activeYn?: '' | 'Y' | 'N';
}

/**
 * ===============================
 * 직원 전체 조회 API
 * ===============================
 * GET /api/query/employees
 */
export function fetchEmployees() {
  return http.get<Employee[]>(`${READ_ONLY_API}/employees`);
}

/**
 * ===============================
 * 직원 단건 조회 API
 * ===============================
 * GET /api/query/employees/{id}
 *
 * @param id 직원 ID
 */
export function fetchEmployee(id: number) {
  return http.get<Employee>(`${READ_ONLY_API}/employees/${id}`);
}

/**
 * ===============================
 * 직원 검색 조회 API
 * ===============================
 * POST /api/query/employees/search
 *
 * @param param 검색 조건 (사번, 이름, 재직여부)
 */
export function fetchEmployeesByCondition(param: EmployeeSearchParam) {
  return http.post<Employee[]>(`${READ_ONLY_API}/employees/search`, param);
}

/**
 * ===============================
 * 직원 저장
 * ===============================
 * POST /api/query/employees/search
 *
 * @param params 공통파라미터
 */
export function createEmployee(params: CommonParams) {
  return http.post<number>(`${JPA_API}/employees`, params);
}

/**
 * ===============================
 * 직원 수정
 * ===============================
 * POST /api/query/employees/search
 *
 * @param params 공통파라미터
 */
export function updateEmployee(params: CommonParams) {
  return http.put<void>(`${JPA_API}/employees`, params);
}

/**
 * ===============================
 * 직원 삭제 (다건)
 * ===============================
 * POST /api/query/employees/search
 *
 * @param userIds 사번 리스트
 */
export function deleteEmployees(userIds: number[]) {
  return http.delete<void>(`${JPA_API}/employees`, {
    data: { userIds }
  });
}

/**
 * ===============================
 * 직원 일괄 퇴사 처리 API
 * ===============================
 * PUT /api/jpa/employees/retire
 *
 * @param userIds 퇴사 처리할 직원 ID 목록
 */
export function retireEmployees(userIds: number[]) {
  return http.put<void>(`${JPA_API}/employees/retire`, {
    userIds
  });
}

/**
 * ===============================
 * 직원 일괄 복직 처리 API
 * ===============================
 * PUT /api/jpa/employees/restore
 *
 * @param userIds 복직 처리할 직원 ID 목록
 */
export function restoreEmployees(userIds: number[]) {
  return http.put<void>(`${JPA_API}/employees/restore`, {
    userIds
  });
}
