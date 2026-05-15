import { http } from '@/api/common/http'

const READ_ONLY_API = '/api/query/users'
const JPA_API = '/api/jpa/users'

export interface User {
  userId: number
  userNo: string
  name: string
  addressMain: string
  addressSub: string
  activeYn: 'Y' | 'N'
  genderFlag: string
  phoneNumber: string
}

/** 조회용 검색조건 */
export interface UserSearchParam {
  userNo?: string
  name?: string
  activeYn?: '' | 'Y' | 'N'
}

/** Command(등록/수정)용 파라미터: 화면 폼 필드 + profileImagePath까지 포함 */
export interface UserCommandParams {
  userId?: number // update 시 필요(등록 후 profileImagePath 반영할 때도 사용)
  userNo: string
  password: string
  name: string
  email: string
  addressMain: string
  addressSub: string
  birthDate: string
  activeYn: 'Y' | 'N'
  genderFlag?: '' | 'M' | 'W'
  phoneNumber?: string
  userType?: 'U' | 'E'
  profileImagePath?: string | null
}

export function fetchUsers() {
  return http.get<User[]>(`${READ_ONLY_API}`)
}

export function fetchUser(id: number) {
  return http.get<User>(`${READ_ONLY_API}/${id}`)
}

export function fetchUsersByCondition(
  param: UserSearchParam
) {
  return http.post<User[]>(`${READ_ONLY_API}/search`, param)
}

/** ✅ 유저 등록 */
export function createUser(params: UserCommandParams) {
  return http.post<number>(`${JPA_API}`, params)
}

/** ✅ 유저 수정 */
export function updateUser(params: UserCommandParams) {
  return http.put<void>(`${JPA_API}`, params)
}

export function deleteUsers(userIds: number[]) {
  return http.delete<void>(`${JPA_API}`, {
    data: { userIds }
  })
}

export function retireUsers(userIds: number[]) {
  return http.put<void>(`${JPA_API}/retire`, { userIds })
}

export function restoreUsers(userIds: number[]) {
  return http.put<void>(`${JPA_API}/restore`, { userIds })
}

/** ✅ 프로필 이미지 업로드 (multipart + progress) */
export function uploadProfileImage(
  file: File,
  userId: number,
  onProgress?: (percent: number) => void
) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('userId', String(userId))

  return http.post<string>(
    `${JPA_API}/upload-profile`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (evt) => {
        if (!onProgress) return
        const total = evt.total ?? 0
        if (!total) return
        onProgress(Math.round((evt.loaded * 100) / total))
      }
    }
  )
}
