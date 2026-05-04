<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  modelValue: string | ''
  label?: string
  disabled?: boolean
  min?: string
  max?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | ''): void
}>()

const value = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})
</script>

<template>
  <div class="form-field">
    <label v-if="label">{{ label }}</label>

    <input
      type="date"
      class="el-date"
      v-model="value"
      :disabled="disabled"
      :min="min"
      :max="max"
    />
  </div>
</template>

<style scoped>
.el-date {
  height: 40px;
  padding: 0 12px;
  font-size: 14px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.el-date:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.el-date:disabled {
  background: #f3f4f6;
  opacity: 0.7;
  cursor: not-allowed;
}
</style>