
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const isActive = (path: string) => {
  return route.path.startsWith(path)
}

// localStorage에서 유저 정보 가져오기
const userInfo = computed(() => {
  const raw = localStorage.getItem('userInfo')
  return raw ? JSON.parse(raw) : null
})
</script>


<template>
  <aside class="sidebar">
    <!-- 상단 로고 영역 -->
    <div class="logo-area">
      <img
        src="@/assets/main-logo.png"
        alt="관리자"
        class="profile-image"
      />
      <h3 class="logo-text">JPAS 관리시스템</h3>
    </div>
    <!-- 메뉴 영역 -->
    <ul class="menu">
      <li :class="{ active: isActive('/employees') }">
        <router-link to="/employees">직원관리</router-link>
      </li>
      <li :class="{ active: isActive('/departments') }">
        <router-link to="/departments">부서관리</router-link>
      </li>
      <li :class="{ active: isActive('/commonCodes') }">
        <router-link to="/commonCodes">공통코드관리</router-link>
      </li>
    </ul>
  </aside>
</template>


<style scoped>
.sidebar {
  width: 220px;
  background: #1f2937;
  color: white;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/* 로고 영역 */
.logo-area {
  display: flex;
  align-items: center;        /* 이미지 + 텍스트 수직 중앙정렬 */
  gap: 12px;                  /* 이미지와 텍스트 간격 */
  margin-bottom: 32px;
}

/* 동그란 이미지 */
.profile-image {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #4f46e5;
}

/* 텍스트 로고 */
.logo-text {
  font-size: 16px;
  font-weight: bold;
  font-family: 'Courier New', Courier, monospace;
  white-space: nowrap;        /* 줄바꿈 방지 (사이드바 좁을 때 유용) */
}

/* 메뉴 */
.menu {
  list-style: none;
  padding: 0;
  margin-top: 20px
}

.menu li {
  margin-bottom: 8px;
}

.menu a {
  display: block;
  padding: 10px;
  color: white;
  text-decoration: none;
  border-radius: 4px;
}

.menu li.active a {
  background: #4f46e5;
}

</style>

