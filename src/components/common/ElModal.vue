
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
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ✅ backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* ✅ container */
.modal-container {
  background: #ffffff;
  border-radius: 14px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.25),
    0 4px 12px rgba(0, 0, 0, 0.15);
}

/* ✅ size */
.modal-sm { width: 420px; }
.modal-md { width: 640px; }
.modal-lg { width: 900px; }

/* ✅ 애니메이션 */
.modal-fade-scale-enter-active,
.modal-fade-scale-leave-active {
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-fade-scale-enter-from,
.modal-fade-scale-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
