<template>
  <div v-if="isLoading" class="loading-bar"></div>
</template>

<script setup lang="ts">
import { useLoadingStore } from '@/store/loadingStore'
import { storeToRefs } from 'pinia'

const loadingStore = useLoadingStore()
const { isLoading } = storeToRefs(loadingStore)
</script>

<style scoped>
.loading-bar {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  width: 100%;
  background: linear-gradient(
    90deg,
    #4f46e5 0%,
    #6366f1 50%,
    #4f46e5 100%
  );
  animation: loading 1.2s linear infinite;
  z-index: 9999;
}

@keyframes loading {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
