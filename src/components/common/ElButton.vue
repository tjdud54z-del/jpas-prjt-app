<script setup lang="ts">
import { computed } from 'vue'

type ButtonType = 'primary' | 'secondary' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    type?: ButtonType
    size?: ButtonSize
    disabled?: boolean
  }>(),
  {
    type: 'primary',
    size: 'md',
    disabled: false
  }
)

const emit = defineEmits<{
  (e: 'click'): void
}>()

const buttonClass = computed(() => ['btn', `btn-${props.type}`, `btn-${props.size}`])
</script>

<template>
  <button :class="buttonClass" :disabled="disabled" @click="emit('click')">
    <slot />
  </button>
</template>

<style scoped>
/* 
  기본 색상/스타일은 common.css의 .btn / .btn-primary 등 사용
  여기서는 "사이즈"만 책임짐
*/

.btn-sm {
  height: 30px;
  padding: 4px 10px;
  font-size: 12px;
  line-height: 1.2;
  border-radius: 6px;
}

.btn-md {
  height: 34px; /* Input / Select / DatePicker와 통일 */
  padding: 6px 14px;
  font-size: 14px;
  line-height: 1.3;
  border-radius: 6px;
}

.btn-lg {
  height: 38px;
  padding: 8px 18px;
  font-size: 16px;
  line-height: 1.4;
  border-radius: 8px;
}

/* disabled 보정 (common.css에 있어도 안전) */
button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
