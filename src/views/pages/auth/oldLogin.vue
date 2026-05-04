<script setup lang="ts">
import { loginApi } from '@/api/authApi';
import ElButton from '@/components/common/ElButton.vue';
import ElInputText from '@/components/common/ElInputText.vue';
import { useAlert } from '@/composables/useAlert';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const { openAlert } = useAlert();

const userNo = ref('');
const password = ref('');

const loading = ref(false);

const login = async () => {
  if (!userNo.value?.trim() || !password.value) {
    console.log('체크함..');
    await openAlert('사번/비밀번호를 입력하세요.');
    return;
  }

  try {
    loading.value = true;

    const { data } = await loginApi({
      userNo: userNo.value.trim(),
      password: password.value
    });

    // 토큰 저장 -> localStorage
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('tokenType', data.tokenType);
    localStorage.setItem('expiresInSeconds', String(data.expiresInSeconds));
    localStorage.setItem('userInfo', JSON.stringify(data.userInfo));
    localStorage.setItem('loginAt', String(Date.now())); // 만료 체크용(선택)

    await openAlert('로그인되었습니다.');

    router.push({ name: 'dashboard' });
  } catch (e: any) {
    console.error(e);
    await openAlert('로그인 실패하였습니다. 사번 또는 비밀번호를 확인하세요.');
  } finally {
    loading.value = false;
  }
};

const onkeydownHandler = async (event: { key: string }) => {
  if (event.key === 'Enter') {
    login();
  }
};
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-form">
        <div class="login-header">
          <img src="@/assets/main-logo.png" alt="관리자" class="profile-image" />
          <h2 class="title">로그인</h2>
        </div>
        <ElInputText v-model="userNo" :mb="4" placeholder="사번을 입력하세요." />
        <ElInputText v-model="password" type="password" :mb="0" @keydown="onkeydownHandler" placeholder="비밀번호를 입력하세요." />
        <ElButton type="primary" :disabled="loading" @click="login"> 로그인 </ElButton>
        <!-- <Button label="Sign In" class="w-full" @click="login"> 로그인 </Button> -->
      </div>
      <div class="login-image">
        <img src="@/assets/main-logo.png" alt="logo" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 전체 */
.login-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f3f4f6;
}

/* 카드 */
.login-card {
  display: flex;
  width: 760px;
  height: 420px;
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.12),
    0 6px 16px rgba(0, 0, 0, 0.08);
}

/* =====================
   왼쪽 폼
===================== */
.login-form {
  width: 50%;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
}

/* 로고 + 타이틀 한 줄 */
.login-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  justify-content: center; /* ⬅ 가로 중앙 */
  align-self: center; /* ⬅ 부모 flex(column) 기준 중앙 */
}

/* 동그라미 유지 핵심 */
.profile-image {
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #4f46e5;
}

/* 타이틀 */
.title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
}

/* =====================
   오른쪽 이미지
===================== */
.login-image {
  width: 50%;
  background: linear-gradient(135deg, #4f46e5, #6366f1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-image img {
  width: 200px;
  height: 150px;
  opacity: 0.9;
}

/* =====================
   반응형
===================== */
@media (max-width: 768px) {
  .login-card {
    flex-direction: column;
    width: 90%;
    height: auto;
  }

  .login-form,
  .login-image {
    width: 100%;
  }

  .login-image {
    padding: 32px 0;
  }
}
</style>
