<template>
  <div v-if="isLoading" class="overlay">
    <img
      src="@/assets/loadingBar2-96.gif"
      alt="loading"
      class="spinner"
    />
  </div>
</template>

<script setup lang="ts">
import { useLoadingStore } from '@/store/loadingStore'
import { storeToRefs } from 'pinia'

const loadingStore = useLoadingStore()
const { isLoading } = storeToRefs(loadingStore)
</script>

<style scoped>
/* 전체 화면 어둡게 덮기 */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

/* 로딩 이미지 */
.spinner {
  width: 64px;
  height: 64px;
}
</style>
