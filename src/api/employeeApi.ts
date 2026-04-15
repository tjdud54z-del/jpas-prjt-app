import { http } from '@/api/common/http'

const READ_ONLY_API = '/api/query'
const JPA_API = '/api/jpa'

/** 직원 output 인터페이스 */
export interface Employee {
  employeeId: number
  employeeNo: string
  name: string
  departmentCode: string
  departmentName: string
  positionCode: string
  positionName: string
  activeYn: 'Y' | 'N'
}

/** 직원 input 인터페이스 */
export interface EmployeeSearchParam {
  employeeNo?: string
  name?: string
  activeYn?: '' | 'Y' | 'N'
}

/** GET (전체조회) */
export function fetchEmployees() {
  return http.get<Employee[]>(`${READ_ONLY_API}/employees`)
}

/** GET (단건조회) */
export function fetchEmployee(id: number) {
  return http.get<Employee>(`${READ_ONLY_API}/employees/${id}`)
}

/** POST (검색조건 조회) */
export function fetchEmployeesByCondition(param: EmployeeSearchParam) {
  return http.post<Employee[]>(`${READ_ONLY_API}/employees/search`, param)
}


/** PUT (직원 일괄 퇴사 처리) */
export function retireEmployees(employeeIds: number[]) {
  return http.put<void>(`${JPA_API}/employees/retire`, employeeIds)
}

/** PUT (직원 일괄 복직 처리) */
export function restoreEmployees(employeeIds: number[]) {
  return http.put<void>(`${JPA_API}/employees/restore`, employeeIds)
}

