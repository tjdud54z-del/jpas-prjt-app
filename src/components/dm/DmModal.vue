<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void
}>()

const close = () => {
  emit('update:open', false)
}

// ESC 키로 닫기
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <teleport to="body">
    <!-- 위치/레이아웃만 담당 -->
    <div v-if="open" class="dm-float">
      <slot />
    </div>
  </teleport>
</template>

<style scoped>
.dm-float {
  position: fixed;
  right: 20px;
  bottom: 20px;

  width: 380px;
  height: 560px;

  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);

  z-index: 9000;
  display: flex;
  flex-direction: column;

  animation: dm-enter 0.25s ease-out;
}

/* 모바일 대응 */
@media (max-width: 600px) {
  .dm-float {
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
}
</style>
