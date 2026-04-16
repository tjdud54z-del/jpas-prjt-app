
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ElButton from '@/components/common/ElButton.vue'
import ElInputText from '@/components/common/ElInputText.vue'
import { loginApi } from '@/api/authApi'
import { useAlert } from '@/composables/useAlert'

const router = useRouter()
const { openAlert } = useAlert()

const employeeNo = ref('')
const password = ref('')

const loading = ref(false)

const login = async () => {
  if (!employeeNo.value?.trim() || !password.value) {
    console.log('체크함..')
    await openAlert('사번/비밀번호를 입력하세요.')
    return
  }

  try {
    loading.value = true

    const { data } = await loginApi({
      employeeNo: employeeNo.value.trim(),
      password: password.value,
    })

    // 토큰 저장 -> localStorage
    localStorage.setItem('accessToken', data.accessToken)
    localStorage.setItem('tokenType', data.tokenType)
    localStorage.setItem('expiresInSeconds', String(data.expiresInSeconds))
    localStorage.setItem('userInfo', JSON.stringify(data.userInfo))
    localStorage.setItem('loginAt', String(Date.now())) // 만료 체크용(선택)

    await openAlert('로그인되었습니다.')

    router.push('/employees')
  } catch (e: any) {
    console.error(e)
    await openAlert('로그인 실패하였습니다. 사번 또는 비밀번호를 확인하세요.')
  } finally {
    loading.value = false
  }
}

const onkeydownHandler = async (event: { key: string }) => {
  if (event.key === 'Enter') {
    login()
  }
}
</script>

<template>
  <div class="login">
    <img
      src="@/assets/main-logo.png"
      alt="관리자"
      class="profile-image" />
    <h2>로그인 페이지</h2>
    <ElInputText
      v-model="employeeNo"
      :width="300"
      placeholder="사번을 입력하세요." />
    <ElInputText
      v-model="password"
      type="password"
      :width="300"
      @keydown="onkeydownHandler"
      placeholder="비밀번호를 입력하세요." />
    <ElButton 
      type="primary" 
      :disabled="loading" 
      @click="login">
      로그인
    </ElButton>
  </div>
</template>

<style scoped>
.login {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.profile-image {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #4f46e5;
}
</style>
