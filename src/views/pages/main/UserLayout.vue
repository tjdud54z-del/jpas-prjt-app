
<script setup>
import { useRouter } from 'vue-router';
const router = useRouter()

const goLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="user-layout">

    <header class="navbar">
      <div class="logo">My Service</div>
      <div>
        <button @click="goLogin">로그인</button>
      </div>
    </header>

    <router-view />

  </div>
</template>

<style scoped>

/* namespace */
.argon-layout {
  min-height: 100vh;
}

/* 기본 navbar */
.navbar {
  display: flex;
  justify-content: space-between;
  padding: 20px;
}
</style>

