
<script setup>
import { useRouter } from 'vue-router';
const router = useRouter()

const goLogin = () => {
  router.push('/login')
}
</script>

<template>
  <div class="argon-layout">

    <!-- Navbar -->
    <header class="navbar">
      <div class="logo">ABSENCE</div>

      <div class="menu">
        <a>소개</a>
        <a>기능</a>
        <a>문의</a>
      </div>

      <button class="login-btn" @click="goLogin">
        로그인
      </button>
    </header>

    <!-- 페이지 -->
    <router-view />

    <!-- Footer -->
    <footer class="footer">
      © 2026 ABSENCE ERP SYSTEM
    </footer>

  </div>
</template>

<style scoped>
.argon-layout {
  font-family: 'Open Sans', sans-serif;
}

/* Navbar */
.navbar {
  position: fixed;
  top: 0;
  width: 100%;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  z-index: 1000;
}

.logo {
  font-weight: 700;
  font-size: 20px;
  color: #5e72e4;
}

.menu {
  display: flex;
  gap: 30px;
}

.menu a {
  cursor: pointer;
  color: #32325d;
}

.login-btn {
  padding: 8px 16px;
  border-radius: 20px;
  background: #5e72e4;
  color: white;
  border: none;
}

/* Footer */
.footer {
  text-align: center;
  padding: 40px;
  color: #8898aa;
}
</style>