
<script setup lang="ts">
import { onMounted, onUnmounted, computed } from 'vue'

type ModalSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    size?: ModalSize
    closeOnEsc?: boolean
    closeOnEnter?: boolean
  }>(),
  {
    size: 'md',
    closeOnEsc: true,
    closeOnEnter: false,
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'enter'): void
}>()

const sizeClass = computed(() => {
  return {
    sm: 'modal-sm',
    md: 'modal-md',
    lg: 'modal-lg',
  }[props.size]
})

const handleKeydown = (e: KeyboardEvent) => {
  if (props.closeOnEsc && e.key === 'Escape') emit('close')
  if (props.closeOnEnter && e.key === 'Enter') emit('enter')
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade-scale" appear>
      <div class="modal-backdrop" @click.self="emit('close')">
        <div class="modal-container" :class="sizeClass">

          <div v-if="$slots.header" class="modal-header">
            <slot name="header"></slot>
          </div>

          <div class="modal-body">
            <slot></slot>
          </div>

          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer"></slot>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* =============================
   Backdrop
============================= */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;

  /* 살짝 유리 느낌 */
  backdrop-filter: blur(2px);
}

/* =============================
   Container
============================= */
.modal-container {
  display: flex;
  flex-direction: column;

  background: #ffffff;
  border-radius: 16px;
  max-height: 90vh;
  overflow: hidden;

  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.28),
    0 8px 16px rgba(0, 0, 0, 0.18);
}

/* =============================
   Size
============================= */
.modal-sm { width: 420px; }
.modal-md { width: 640px; }
.modal-lg { width: 900px; }

/* =============================
   Header
============================= */
.modal-header {
  padding: 18px 22px;
  font-size: 18px;
  font-weight: 600;
  color: #111827;

  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* =============================
   Body
============================= */
.modal-body {
  padding: 1px;
  overflow-y: auto;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.6;
}

/* =============================
   Footer
============================= */
.modal-footer {
  padding: 14px 22px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;

  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

/* =============================
   Animation (유지)
============================= */
.modal-fade-scale-enter-active,
.modal-fade-scale-leave-active {
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-scale-enter-from,
.modal-fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.92);
}
</style>