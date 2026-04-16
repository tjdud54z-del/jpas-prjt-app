
<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '@/api/common/http'
import { useConfirm } from '@/composables/useConfirm'
import { getTokenExpireRemain } from '@/api/common/token'

const router = useRouter()
const { openConfirm } = useConfirm()

/** 로그인 사용자 정보 */
const userInfo = computed(() => {
  const raw = localStorage.getItem('userInfo')
  return raw ? JSON.parse(raw) : null
})

/** 남은 세션 시간 (초) */
const remainSeconds = ref(0)
let timer: number | null = null

/** mm:ss 포맷 */
const remainTimeText = computed(() => {
  const sec = Math.max(0, remainSeconds.value)
  const m = String(Math.floor(sec / 60)).padStart(2, '0')
  const s = String(sec % 60).padStart(2, '0')
  return `${m}:${s}`
})

/** 세션 타이머 시작 */
const startSessionTimer = () => {
  const remain = getTokenExpireRemain()
  remainSeconds.value = Math.floor(remain / 1000)

  if (remainSeconds.value <= 0) return

  timer = window.setInterval(() => {
    remainSeconds.value--

    if (remainSeconds.value <= 0) {
      stopSessionTimer()
      forceLogout()
    }
  }, 1000)
}

const stopSessionTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

/** 만료 시 강제 로그아웃 */
const forceLogout = async () => {
  localStorage.clear()
  delete http.defaults.headers.common.Authorization
  await router.replace('/login')
}

/** 수동 로그아웃 */
const logout = async () => {
  const ok = await openConfirm('정말 로그아웃 하시겠습니까?\n(반드시 데이터 저장상태를 확인하세요.)')
  if (!ok) return

  stopSessionTimer()
  localStorage.clear()
  delete http.defaults.headers.common.Authorization
  router.push('/login')
}

onMounted(() => {
  startSessionTimer()
})

onUnmounted(() => {
  stopSessionTimer()
})
</script>



<template>
  <header class="header">
    <!-- 왼쪽 : 로그인 사용자 정보 -->
    <div class="header-left">어서오세요. 
      <span v-if="userInfo" class="user-name" style="color: brown">
        {{ userInfo.name }}
      </span>
      <span v-if="userInfo" class="user-empno">
        ({{ userInfo.employeeNo }})님
      </span>
      <!-- <span
        v-if="remainSeconds > 0"
        class="session-remain">
        ⏳ {{ remainTimeText }}
      </span> -->
    </div>

    <!-- 가운데 : 안내 문구 -->
    <!-- <div class="header-center">
      <span class="header-main-text">
        로그아웃 전, 반드시 데이터를 저장상태를 확인하세요.
      </span>
    </div> -->

    <!-- 오른쪽 : 로그아웃 -->
    <div class="header-right">
      <button class="logout-btn" @click="logout">
        로그아웃
      </button>
    </div>
  </header>
</template>


<style scoped>
.header {
  height: 50px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  border-bottom: 1px solid #e5e7eb;
}

/* 왼쪽 사용자 정보 */
.header-left {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

/* 가운데 안내 문구 */
.header-center {
  flex: 1;
  text-align: right;
}

.header-main-text {
  font-family: 'Courier New', Courier, monospace;
  color: rgb(255, 0, 0);
  font-size: 13px;
}

/* 오른쪽 로그아웃 */
.header-right {
  display: flex;
  align-items: center;
}

.logout-btn {
  padding: 6px 12px;
  font-size: 13px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  background: #ef4444;
  color: white;
}

.logout-btn:hover {
  background: #dc2626;
}

.session-remain {
  margin-left: 10px;
  font-size: 12px;
  font-weight: 600;
  color: #ef4444; /* 빨간색 */
}
</style>
