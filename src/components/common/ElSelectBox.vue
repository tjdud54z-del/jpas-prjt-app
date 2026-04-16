<script setup lang="ts">
import { computed } from 'vue'

interface Option {
  label: string
  value: string | number
}

interface Props {
  modelValue: string | number | ''
  label?: string
  options: Option[]
  placeholder?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '선택',
  disabled: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | ''): void
}>()

const value = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v),
})
</script>

<template>
  <div class="form-field">
    <label v-if="label">{{ label }}</label>

    <select
      class="el-select"
      v-model="value"
      :disabled="disabled"
    >
      <option value="">{{ placeholder }}</option>

      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.el-select {
  height: 40px;
  padding: 0 12px;
  font-size: 14px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: white;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.el-select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.el-select:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.7;
}
</style>