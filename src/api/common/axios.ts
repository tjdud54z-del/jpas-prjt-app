
import axios from 'axios'
import { useLoadingStore } from '@/store/loadingStore'

/**
 * ===============================
 * axios 인스턴스 생성
 * ===============================
 * - baseURL: 백엔드 서버 주소 
 * - headers: 기본 Content-Type 설정
 */
const instance = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * ===============================
 * 요청(Request) 인터셉터 (테스트용)
 * ===============================
 * - 모든 API 요청 전에 로딩 시작
 */
// instance.interceptors.request.use(async config => {
//   const loadingStore = useLoadingStore()
//   loadingStore.start()
//   await new Promise(r => setTimeout(r, 600)) 
//   return config
// })


/**
 * ===============================
 * 요청(Request) 인터셉터
 * ===============================
 * - 모든 API 요청 전에 로딩 시작
 */
instance.interceptors.request.use(config => {
  const loadingStore = useLoadingStore()
  loadingStore.start()
  // await new Promise(r => setTimeout(r, 600)) 
  return config
})

/**
 * ===============================
 * 응답(Response) 인터셉터
 * ===============================
 * - 응답 성공/실패와 관계없이 로딩 종료
 */
instance.interceptors.response.use(
  response => {
    const loadingStore = useLoadingStore()
    loadingStore.end()
    return response
  },
  error => {
    const loadingStore = useLoadingStore()
    loadingStore.end()
    return Promise.reject(error)
  }
)

export default instance
