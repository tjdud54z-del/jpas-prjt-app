
import axios from 'axios'
import { useLoadingStore } from '@/store/loadingStore'

const instance = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json'
  }
})

// 테스트용
// instance.interceptors.request.use(async config => {
//   const loadingStore = useLoadingStore()
//   loadingStore.start()
//   await new Promise(r => setTimeout(r, 600)) 
//   return config
// })
instance.interceptors.request.use(config => {
  const loadingStore = useLoadingStore()
  loadingStore.start()
  return config
})

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
