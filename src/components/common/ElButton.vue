
<script setup lang="ts">
import { computed } from 'vue';

type ButtonType = 'primary' | 'secondary' | 'danger' | 'success'
type ButtonSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    type?: ButtonType
    size?: ButtonSize
    disabled?: boolean

    /** 버튼 텍스트 */
    label?: string
  }>(),
  {
    type: 'primary',
    size: 'md',
    disabled: false,
    label: ''
  }
)

const emit = defineEmits<{
  (e: 'click'): void
}>()

const buttonClass = computed(() => [
  'btn',
  `btn-${props.type}`,
  `btn-${props.size}`
])
</script>

<template>
  <button
    :class="buttonClass"
    :disabled="disabled"
    @click="emit('click')">
    <!-- label 우선, 없으면 slot -->
    <span v-if="label">{{ label }}</span>
    <slot v-else />
  </button>
</template>

<style scoped>
.btn-sm {
  height: 30px;
  padding: 4px 10px;
  font-size: 12px;
  line-height: 1.2;
  border-radius: 6px;
}

.btn-md {
  height: 34px;
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

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
