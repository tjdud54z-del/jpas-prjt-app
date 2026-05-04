<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:open', v: boolean): void;
}>();

const close = () => {
  emit('update:open', false);
};

// ESC 키로 닫기
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    close();
  }
};

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>

<template>
  <teleport to="body">
    <div v-if="open" class="dm-modal__overlay" @click.self="close">
      <div class="dm-modal">
        <!-- 닫기 버튼 -->
        <button class="dm-modal__close" @click="close">✕</button>

        <!-- 실제 내용 -->
        <slot />
      </div>
    </div>
  </teleport>
</template>

<style scoped>
.dm-modal__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
}

.dm-modal {
  position: relative;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: dm-popup 0.18s ease-out;
}

/* DM 패널과 자연스럽게 맞도록 */
.dm-modal :deep(.dm) {
  box-shadow: none;
  border-radius: 14px;
}

.dm-modal__close {
  position: absolute;
  top: 8px;
  right: 10px;
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
}

.dm-modal__close:hover {
  color: #111827;
}

@keyframes dm-popup {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
