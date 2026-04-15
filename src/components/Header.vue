<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { http } from '@/api/common/http'
import { useConfirm } from '@/composables/useConfirm'

const router = useRouter()
const { openConfirm } = useConfirm()

// 로그인 사용자 정보
const userInfo = computed(() => {
  const raw = localStorage.getItem('userInfo')
  return raw ? JSON.parse(raw) : null
})

const logout = async () => {
  const ok = await openConfirm('정말 로그아웃 하시겠습니까?')
  if (!ok) return

  localStorage.clear()
  delete http.defaults.headers.common.Authorization
  router.push('/login')
}
</script>


<template>
  <header class="header">
    <!-- 왼쪽 : 로그인 사용자 정보 -->
    <div class="header-left">사용자정보 : 
      <span v-if="userInfo" class="user-name">
        {{ userInfo.name }}
      </span>
      <span v-if="userInfo" class="user-empno">
        ({{ userInfo.employeeNo }})
      </span>
    </div>

    <!-- 가운데 : 안내 문구 -->
    <!-- <div class="header-center">
      <span class="header-main-text">
        공지. 해당 시스템은 최고관리자권한만 접속이 가능합니다.
        일반관리자는 접속시에 기능이 제한됩니다.
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
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

/* 가운데 안내 문구 */
.header-center {
  flex: 1;
  text-align: center;
}

.header-main-text {
  font-family: 'Courier New', Courier, monospace;
  color: rgb(123, 123, 123);
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
</style>
