<script setup lang="ts">
import { computed } from 'vue'

type InputType = 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url'
type InputSize = 'sm' | 'md' | 'lg'
type InputVariant = 'primary' | 'secondary' | 'danger' | 'success'

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    type?: InputType
    placeholder?: string
    disabled?: boolean
    readonly?: boolean
    maxlength?: number
    minlength?: number
    autocomplete?: string
    autofocus?: boolean
    name?: string
    id?: string

    /** ✅ label 추가 */
    label?: string

    /** UI 옵션 */
    size?: InputSize
    variant?: InputVariant

    /** 상태 */
    invalid?: boolean

    /** spacing */
    mb?: number

    /** width (ex: 300 -> 300px, '100%' -> 그대로) */
    width?: number | string
  }>(),
  {
    modelValue: '',
    type: 'text',
    placeholder: '',
    disabled: false,
    readonly: false,
    autocomplete: 'off',
    autofocus: false,
    size: 'md',
    variant: 'primary',
    invalid: false,
    mb: 12,
    width: '100%',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'input', value: string): void
  (e: 'change', value: string): void
  (e: 'focus', ev: FocusEvent): void
  (e: 'blur', ev: FocusEvent): void
  (e: 'keydown', ev: KeyboardEvent): void
  (e: 'enter', value: string): void
}>()

const inputClass = computed(() => [
  'input',
  `input-${props.variant}`,
  `input-${props.size}`,
  props.invalid ? 'is-invalid' : '',
  props.disabled ? 'is-disabled' : '',
  props.readonly ? 'is-readonly' : '',
])

const valueAsString = computed(() => String(props.modelValue ?? ''))

const widthCss = computed(() => {
  if (props.width === undefined || props.width === null) return undefined
  return typeof props.width === 'number' ? `${props.width}px` : props.width
})

const inputStyle = computed(() => ({
  width: widthCss.value,
  marginBottom: props.label ? undefined : `${props.mb}px`, // ✅ label 있으면 margin form-field에서 처리
}))

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  emit('update:modelValue', v)
  emit('input', v)
}

function onChange(e: Event) {
  const v = (e.target as HTMLInputElement).value
  emit('change', v)
}

function onKeydown(e: KeyboardEvent) {
  emit('keydown', e)
  if (e.key === 'Enter') {
    emit('enter', valueAsString.value)
  }
}
</script>

<template>
  <div class="form-field">
    <label v-if="label">{{ label }}</label>

    <input
      :id="id"
      :name="name"
      :type="type"
      :class="inputClass"
      :style="inputStyle"
      :value="valueAsString"
      :placeholder="placeholder"
      :disabled="disabled"
      :readonly="readonly"
      :maxlength="maxlength"
      :minlength="minlength"
      :autocomplete="autocomplete"
      :autofocus="autofocus"
      @input="onInput"
      @change="onChange"
      @focus="emit('focus', $event)"
      @blur="emit('blur', $event)"
      @keydown="onKeydown"
    />
  </div>
</template>

<style scoped>
/* ✅ form-grid / ElSelectBox / ElDatePicker와 동일 */
.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.form-field label {
  font-size: 13px;
  font-weight: 500;
  color: #374151;
}

.input {
  display: inline-block;
  box-sizing: border-box;
  border: 1px solid #d0d5dd;
  border-radius: 6px;
  outline: none;
}

.input:focus {
  border-color: #4c7dff;
  box-shadow: 0 0 0 3px rgba(76, 125, 255, 0.15);
}

.input-sm { padding: 6px 8px; font-size: 12px; }
.input-md { padding: 8px 10px; font-size: 14px; }
.input-lg { padding: 10px 12px; font-size: 16px; }

.input-success { border-color: #12b76a; }
.input-danger { border-color: #f04438; }

.is-invalid { border-color: #f04438; }
.is-disabled { background: #f2f4f7; cursor: not-allowed; }
.is-readonly { background: #f9fafb; }
</style>