<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

export interface Option {
  label: string
  value: string | number
}

type SelectSize = 'sm' | 'md' | 'lg'

interface Props {
  modelValue: string | number | ''
  label?: string
  options: Option[]
  placeholder?: string
  disabled?: boolean

  /** Input처럼 사이즈 */
  size?: SelectSize

  /** invalid 스타일 */
  invalid?: boolean

  /** spacing (label 없을 때만 쓰고 싶으면 공통 form-field에서 처리해도 됨) */
  mb?: number

  /** width (ex: 300 -> 300px, '100%' -> 그대로) */
  width?: number | string

  /** placeholder(전체) 옵션을 리스트에도 표시할지 */
  includeEmptyOption?: boolean

  /** 선택값 지우기 버튼 */
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '전체',
  disabled: false,
  size: 'md',
  invalid: false,
  mb: 12,
  width: '100%',
  includeEmptyOption: true,
  clearable: false
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | number | ''): void
  (e: 'change', v: string | number | ''): void
  (e: 'open'): void
  (e: 'close'): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const open = ref(false)
const highlighted = ref(-1)

/** trigger 위치 기반 panel 스타일(teleport라 body로 붙음) */
const panelStyle = ref<Record<string, string>>({})

const widthCss = computed(() => {
  if (props.width === undefined || props.width === null) return '100%'
  return typeof props.width === 'number' ? `${props.width}px` : props.width
})

const triggerClass = computed(() => ['sd-trigger', `sd-${props.size}`, props.invalid ? 'is-invalid' : '', props.disabled ? 'is-disabled' : '', open.value ? 'is-open' : ''])

const items = computed(() => {
  const base = props.options ?? []
  if (!props.includeEmptyOption) return base
  // placeholder를 옵션처럼 넣되 value는 '' 로 통일
  return [{ label: props.placeholder ?? '전체', value: '' as const }, ...base]
})

const selectedLabel = computed(() => {
  const v = props.modelValue
  if (v === '' || v === null || v === undefined) return props.placeholder
  const found = props.options.find((o) => o.value === v)
  return found?.label ?? String(v)
})

function setValue(v: string | number | '') {
  emit('update:modelValue', v)
  emit('change', v)
}

function openPanel() {
  if (props.disabled) return
  if (open.value) return
  open.value = true
  emit('open')
  nextTick(() => {
    updatePanelPosition()
    // 현재 선택값 기준 하이라이트
    const idx = items.value.findIndex((it) => it.value === props.modelValue)
    highlighted.value = idx >= 0 ? idx : 0
    scrollHighlightedIntoView()
  })
}

function closePanel() {
  if (!open.value) return
  open.value = false
  emit('close')
  highlighted.value = -1
}

function togglePanel() {
  if (open.value) closePanel()
  else openPanel()
}

function updatePanelPosition() {
  const el = triggerRef.value
  if (!el) return
  const r = el.getBoundingClientRect()

  // viewport 기준 fixed로 배치 (스크롤에도 안정적)
  panelStyle.value = {
    position: 'fixed',
    top: `${r.bottom + 6}px`,
    left: `${r.left}px`,
    width: `${r.width}px`,
    zIndex: '9999'
  }
}

function onDocPointerDown(e: PointerEvent) {
  if (!open.value) return
  const t = e.target as Node
  const root = rootRef.value
  const panel = panelRef.value
  if (root && root.contains(t)) return
  if (panel && panel.contains(t)) return
  closePanel()
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return

  if (!open.value) {
    // 닫혀있을 때: Enter/Space/ArrowDown -> 열기
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      openPanel()
    }
    return
  }

  // 열려있을 때
  if (e.key === 'Escape') {
    e.preventDefault()
    closePanel()
    triggerRef.value?.focus()
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    highlighted.value = Math.min(items.value.length - 1, highlighted.value + 1)
    scrollHighlightedIntoView()
    return
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    highlighted.value = Math.max(0, highlighted.value - 1)
    scrollHighlightedIntoView()
    return
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    const it = items.value[highlighted.value]
    if (it) setValue(it.value as any)
    closePanel()
    triggerRef.value?.focus()
    return
  }

  // Tab은 기본 포커스 이동 허용하되 닫기
  if (e.key === 'Tab') {
    closePanel()
  }
}

function scrollHighlightedIntoView() {
  nextTick(() => {
    const panel = panelRef.value
    if (!panel) return
    const el = panel.querySelector<HTMLElement>('.sd-item.is-highlight')
    if (!el) return

    const panelRect = panel.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()

    if (elRect.top < panelRect.top) {
      panel.scrollTop -= panelRect.top - elRect.top + 8
    } else if (elRect.bottom > panelRect.bottom) {
      panel.scrollTop += elRect.bottom - panelRect.bottom + 8
    }
  })
}

function onSelectClick(it: Option) {
  if (props.disabled) return
  setValue(it.value as any)
  closePanel()
  triggerRef.value?.focus()
}

function onClear(e: MouseEvent) {
  e.stopPropagation()
  if (props.disabled) return
  setValue('')
  // 열려있으면 유지해도 되지만, UX상 닫는게 깔끔
  closePanel()
}

function onWindowChange() {
  if (!open.value) return
  updatePanelPosition()
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown, true)
  window.addEventListener('resize', onWindowChange)
  window.addEventListener('scroll', onWindowChange, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown, true)
  window.removeEventListener('resize', onWindowChange)
  window.removeEventListener('scroll', onWindowChange, true)
})

watch(
  () => props.modelValue,
  () => {
    if (open.value) {
      const idx = items.value.findIndex((it) => it.value === props.modelValue)
      highlighted.value = idx >= 0 ? idx : 0
      scrollHighlightedIntoView()
    }
  }
)
</script>

<template>
  <div class="form-field" ref="rootRef" :style="{ width: widthCss, marginBottom: label ? undefined : `${mb}px` }">
    <label v-if="label">{{ label }}</label>

    <div ref="triggerRef" class="sd-wrap" :class="triggerClass" role="combobox" :aria-expanded="open ? 'true' : 'false'" :aria-disabled="disabled ? 'true' : 'false'" tabindex="0" @click="togglePanel" @keydown="onKeydown">
      <span class="sd-value" :class="{ 'is-placeholder': modelValue === '' }">
        {{ selectedLabel }}
      </span>

      <button v-if="clearable && !disabled && modelValue !== ''" class="sd-clear" type="button" aria-label="clear" @click="onClear">×</button>

      <span class="sd-caret" aria-hidden="true"></span>
    </div>

    <!-- dropdown -->
    <teleport to="body">
      <transition name="sd-fade">
        <div v-if="open" ref="panelRef" class="sd-panel" :style="panelStyle" @keydown="onKeydown">
          <ul class="sd-list" role="listbox">
            <li
              v-for="(it, idx) in items"
              :key="String(it.value) + '-' + idx"
              class="sd-item"
              :class="{
                'is-selected': it.value === modelValue,
                'is-highlight': idx === highlighted
              }"
              role="option"
              :aria-selected="it.value === modelValue ? 'true' : 'false'"
              @mouseenter="highlighted = idx"
              @mousedown.prevent
              @click="onSelectClick(it as any)">
              <span class="sd-item-label">{{ it.label }}</span>
              <span v-if="it.value === modelValue" class="sd-check">✓</span>
            </li>
          </ul>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style scoped>
/* Trigger */
.sd-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  width: 100%;

  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  user-select: none;
  box-sizing: border-box;

  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    background 0.2s;
}

.sd-wrap:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.sd-wrap.is-open {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}

.sd-wrap.is-invalid {
  border-color: #ef4444;
}

.sd-wrap.is-disabled {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.8;
}

/* Size (Input.vue랑 맞추는 느낌) */
.sd-sm {
  padding: 4px 10px;
  font-size: 12px;
  line-height: 1.2;
  min-height: 30px;
}
.sd-md {
  padding: 6px 10px;
  font-size: 14px;
  line-height: 1.3;
  min-height: 34px;
}
.sd-lg {
  padding: 8px 12px;
  font-size: 16px;
  line-height: 1.4;
  min-height: 38px;
}

.sd-value {
  flex: 1;
  min-width: 0;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sd-value.is-placeholder {
  color: #6b7280;
}

/* caret */
.sd-caret {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #6b7280;
  margin-left: 6px;
}

/* clear button */
.sd-clear {
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
}
.sd-clear:hover {
  color: #111827;
}

/* Panel (둥글둥글 + 그림자) */
.sd-panel {
  max-height: 260px;
  overflow: auto;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px; /* 드롭다운 둥글게 */
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12); /* 그림자 */
  padding: 6px; /* 바깥 여백으로 더 "둥글게" 느낌 */
}

.sd-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sd-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  padding: 10px 10px;
  border-radius: 10px; /* 아이템도 둥글게 */
  cursor: pointer;
  color: #111827;

  transition:
    background 0.15s,
    color 0.15s;
}

.sd-item:hover,
.sd-item.is-highlight {
  background: #f3f4f6;
}

.sd-item.is-selected {
  background: rgba(99, 102, 241, 0.12);
  color: #3730a3;
}

.sd-check {
  font-weight: 700;
}

/* transition */
.sd-fade-enter-active,
.sd-fade-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}
.sd-fade-enter-from,
.sd-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
