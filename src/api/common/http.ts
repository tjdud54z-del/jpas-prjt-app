
import axios from 'axios'
import router from '@/router'
import { useAlert } from '@/composables/useAlert'
import { useLoadingStore } from '@/store/loadingStore'

export const http = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
})

// 요청 카운트 (로딩 깜빡임 방지)
let pending = 0
const startLoading = () => {
  const loadingStore = useLoadingStore()
  if (pending === 0) loadingStore.start()
  pending++
}
const endLoading = () => {
  const loadingStore = useLoadingStore()
  pending = Math.max(0, pending - 1)
  if (pending === 0) loadingStore.end()
}

// Request interceptor
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

// Response interceptor
http.interceptors.response.use(
  (res) => {
    endLoading()
    return res
  },
  async (err) => {
    endLoading()

    if (err?.response?.status === 401) {
      // 토큰 정리
      localStorage.clear()

      // alert 표시 후 이동
      const { openAlert } = useAlert()
      await openAlert('로그인이 만료되었습니다.\n다시 로그인해주세요.')

      // alert 닫힌 뒤 이동
      router.push('/login')
    }

    return Promise.reject(err)
  }
)
