import { useAlert } from '@/composables/useAlert';
import router from '@/router';
import { useLoadingStore } from '@/store/loadingStore';
import axios from 'axios';

export const http = axios.create({
  baseURL: 'http://localhost:8080',
  headers: { 'Content-Type': 'application/json' }
});

let pending = 0;
const startLoading = () => {
  const loadingStore = useLoadingStore();
  if (pending === 0) loadingStore.start();
  pending++;
};
const endLoading = () => {
  const loadingStore = useLoadingStore();
  pending = Math.max(0, pending - 1);
  if (pending === 0) loadingStore.end();
};

let handlingAuthError = false;

const clearAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

http.interceptors.request.use(
  (config) => {
    startLoading();

    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (err) => {
    endLoading();
    return Promise.reject(err);
  }
);

http.interceptors.response.use(
  (res) => {
    endLoading();
    return res;
  },
  async (err) => {
    endLoading();

    const status = err?.response?.status;
    const data = err?.response?.data;
    const message = data?.message;
    const code = data?.code;

    // 어떤 요청에서 에러가 났는지 확인
    const reqUrl: string = String(err?.config?.url ?? '');
    const isLoginRequest = /\/auth\/login\b/i.test(reqUrl) || /\/login\b/i.test(reqUrl) || /\/signin\b/i.test(reqUrl);

    // 토큰이 "있는 요청"에서만 만료로 판단 (로그인 실패 401과 구분)
    const hasAccessToken = !!localStorage.getItem('accessToken');
    const hadAuthHeader = !!err?.config?.headers?.Authorization;
    const canBeExpired = hasAccessToken && hadAuthHeader && !isLoginRequest;

    const isExpired = canBeExpired && (status === 401 || status === 403 || code === 'TOKEN_EXPIRED' || message === 'TOKEN_EXPIRED' || /expired|만료/i.test(message ?? ''));

    if (isExpired && !handlingAuthError) {
      handlingAuthError = true;
      try {
        clearAuth();

        // 만료 처리를 여기서 했다는 표시 (화면에서 중복 알림 방지용)
        (err as any).__handledByAuthInterceptor = true;

        // 이미 /login 페이지면 굳이 만료 알림/리다이렉트 반복하지 않음
        if (router.currentRoute.value.path !== '/login') {
          const { openAlert } = useAlert();
          await openAlert('로그인이 만료되었습니다. 다시 로그인해주세요.');
          await router.replace('/login');
        }
      } finally {
        handlingAuthError = false;
      }
    }

    return Promise.reject(err);
  }
);
