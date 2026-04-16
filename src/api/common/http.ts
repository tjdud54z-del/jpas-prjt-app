import axios from 'axios'
import router from '@/router'
import { useAlert } from '@/composables/useAlert'
import { useLoadingStore } from '@/store/loadingStore'


/**
 * ===============================
 * axios 인스턴스
 * ===============================
 * - baseURL: 백엔드 서버 주소
 * - headers: 기본 Content-Type 설정
 */
export const http = axios.create({
  baseURL: 'http://localhost:8080', // 프로젝트에 맞게 유지
  headers: { 'Content-Type': 'application/json' },
})


/**
 * ===============================
 * 로딩 깜빡임 방지용 pending 카운터
 * ===============================
 * - 동시에 여러 API 요청이 발생할 때
 *   요청마다 start/end를 단순 호출하면 로딩이 깜빡이거나
 *   먼저 끝난 요청이 로딩을 꺼버리는 문제가 생김
 *
 * - pending:
 *   현재 진행 중인 요청 수를 카운팅
 *   0 -> 1이 되는 순간에만 로딩 ON
 *   1 -> 0이 되는 순간에만 로딩 OFF
 */
let pending = 0

/**
 * ===============================
 * 로딩 시작
 * ===============================
 * - pending이 0일 때만 실제 로딩 ON
 * - 이후 pending 증가
 */
const startLoading = () => {
  const loadingStore = useLoadingStore()
  if (pending === 0) loadingStore.start()
  pending++
}


/**
 * ===============================
 * 로딩 종료
 * ===============================
 * - pending 감소 (최소 0 보장)
 * - pending이 0이 되면 실제 로딩 OFF
 */
const endLoading = () => {
  const loadingStore = useLoadingStore()
  pending = Math.max(0, pending - 1)
  if (pending === 0) loadingStore.end()
}


/**
 * ===============================
 * 인증 만료 처리 중복 방지 플래그
 * ===============================
 * - 401/403 등이 연속으로 여러 요청에서 동시에 발생하면
 *   알림/라우팅/스토리지 정리가 여러 번 반복될 수 있음
 * - handlingAuthError로 "한 번만" 처리하도록 잠금
 */
let handlingAuthError = false


/**
 * ===============================
 * 토큰/인증 정보 정리 함수
 * ===============================
 * - 보안/기능 측면에서 '필요한 것만 삭제'가 권장
 * - 현재는 localStorage 전체 clear()로 되어 있음
 *   (다른 설정값까지 지워질 수 있어 주의)
 */
const clearAuth = () => {
  // 토큰만 제거
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  // 전체 localStorage 제거
  // localStorage.clear()
}


/**
 * ===============================
 * Request 인터셉터
 * ===============================
 * - 모든 요청 시작 시 로딩 ON
 * - localStorage의 accessToken이 있으면 Authorization 헤더에 첨부
 */
http.interceptors.request.use(
  (config) => {
    startLoading()

    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (err) => {
    endLoading()
    return Promise.reject(err)
  }
)


/**
 * ===============================
 * Response 인터셉터
 * ===============================
 * - 응답 성공: 로딩 OFF 후 응답 반환
 * - 응답 실패: 로딩 OFF 후 만료 처리(401/403 등) 수행
 */
http.interceptors.response.use(
  (res) => {
    endLoading()
    return res
  },
  async (err) => {
    endLoading()

    // axios 에러 객체에서 status/body 안전하게 추출
    const status = err?.response?.status
    const data = err?.response?.data
    const message = data?.message
    const code = data?.code

    /**
     * ===============================
     * 토큰 만료 판단 로직
     * ===============================
     * - 백엔드에 따라 만료를 401 또는 403으로 내려주는 케이스가 있음
     * - body.code / body.message 로 만료를 주는 케이스 대비
     * - message 문자열에 expired/만료 포함 여부로도 대응
     */
    const isExpired =
      status === 401 ||
      status === 403 ||
      code === 'TOKEN_EXPIRED' ||
      message === 'TOKEN_EXPIRED' ||
      /expired|만료/i.test(message ?? '')

      
    /**
     * ===============================
     * 만료 처리(중복 방지)
     * ===============================
     * - 동시에 여러 요청이 만료로 실패해도
     *   handlingAuthError가 false일 때 딱 1번만 처리
     *
     */
    if (isExpired && !handlingAuthError) {
      handlingAuthError = true
      try {
        clearAuth()

        const { openAlert } = useAlert()
        await openAlert('로그인이 만료되었습니다.다시 로그인해주세요.')

        if (router.currentRoute.value.path !== '/login') {
          await router.replace('/login')
        }
      } finally {
        handlingAuthError = false
      }
    }

    return Promise.reject(err)
  }
)
