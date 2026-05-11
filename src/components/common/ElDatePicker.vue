<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

type DateSize = 'sm' | 'md' | 'lg'

interface Props {
  modelValue: string | ''
  label?: string
  placeholder?: string
  disabled?: boolean
  min?: string // YYYY-MM-DD
  max?: string // YYYY-MM-DD

  size?: DateSize
  invalid?: boolean
  clearable?: boolean

  /** ✅ 옵션1: 연/월 드롭다운 표시 */
  showMonthYearSelect?: boolean

  /** min/max 없을 때 연도 범위(현재년도 기준 ± range) */
  yearRange?: number

  mb?: number
  width?: number | string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '날짜 선택',
  disabled: false,
  size: 'md',
  invalid: false,
  clearable: false,
  showMonthYearSelect: false,
  yearRange: 10,
  mb: 12,
  width: '100%'
})

const emit = defineEmits<{
  (e: 'update:modelValue', v: string | ''): void
  (e: 'change', v: string | ''): void
  (e: 'open'): void
  (e: 'close'): void
}>()

/* ---------------- utils (timezone-safe) ---------------- */
const pad2 = (n: number) => String(n).padStart(2, '0')

function formatYMD(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function parseYMD(s?: string): Date | null {
  if (!s) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const y = Number(m[1])
  const mm = Number(m[2]) - 1
  const dd = Number(m[3])
  const d = new Date(y, mm, dd)
  if (d.getFullYear() !== y || d.getMonth() !== mm || d.getDate() !== dd) return null
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1)
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfMonth(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0)
  x.setHours(0, 0, 0, 0)
  return x
}
function addDays(d: Date, days: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  x.setHours(0, 0, 0, 0)
  return x
}
function addMonths(d: Date, months: number) {
  const x = new Date(d)
  const day = x.getDate()
  x.setDate(1)
  x.setMonth(x.getMonth() + months)
  const last = endOfMonth(x).getDate()
  x.setDate(Math.min(day, last))
  x.setHours(0, 0, 0, 0)
  return x
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}
function isOutOfRange(d: Date, minD: Date | null, maxD: Date | null) {
  const t = d.getTime()
  if (minD && t < minD.getTime()) return true
  if (maxD && t > maxD.getTime()) return true
  return false
}
function clampToRange(d: Date, minD: Date | null, maxD: Date | null) {
  const t = d.getTime()
  if (minD && t < minD.getTime()) return new Date(minD)
  if (maxD && t > maxD.getTime()) return new Date(maxD)
  return d
}

/* ---------------- refs/state ---------------- */
const rootRef = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLElement | null>(null)
const panelEl = ref<HTMLElement | null>(null)

const open = ref(false)
const panelStyle = ref<Record<string, string>>({})

const minDate = computed(() => parseYMD(props.min))
const maxDate = computed(() => parseYMD(props.max))
const selectedDate = computed(() => parseYMD(props.modelValue))

// 현재 달력에 표시 중인 월 (1일 기준)
const viewMonth = ref<Date>(startOfMonth(selectedDate.value ?? new Date()))
// 키보드/hover 포커스용 날짜
const focusedDate = ref<Date>(selectedDate.value ?? new Date())

watch(
  () => props.modelValue,
  () => {
    const sel = selectedDate.value
    if (sel) {
      viewMonth.value = startOfMonth(sel)
      focusedDate.value = sel
    }
  }
)

const widthCss = computed(() => {
  if (props.width === undefined || props.width === null) return '100%'
  return typeof props.width === 'number' ? `${props.width}px` : props.width
})

const triggerClass = computed(() => ['dp-wrap', `dp-${props.size}`, open.value ? 'is-open' : '', props.invalid ? 'is-invalid' : '', props.disabled ? 'is-disabled' : ''])

const displayText = computed(() => (props.modelValue ? props.modelValue : props.placeholder))

/* ---------------- ✅ Year/Month options (Option1) ---------------- */
const yearOptions = computed(() => {
  const minY = minDate.value?.getFullYear()
  const maxY = maxDate.value?.getFullYear()

  const nowY = new Date().getFullYear()
  const from = minY ?? nowY - props.yearRange
  const to = maxY ?? nowY + props.yearRange

  const list: number[] = []
  for (let y = from; y <= to; y++) list.push(y)
  return list
})

const monthOptions = computed(() => Array.from({ length: 12 }, (_, i) => i + 1))

const selectedYear = computed(() => viewMonth.value.getFullYear())
const selectedMonth = computed(() => viewMonth.value.getMonth() + 1)

function setViewByYearMonth(y: number, m: number) {
  // focused의 "일"을 유지하려고 시도하되, 해당 월 말일로 clamp
  const day = focusedDate.value?.getDate?.() ?? 1
  const base = new Date(y, m - 1, 1)
  base.setHours(0, 0, 0, 0)
  const last = endOfMonth(base).getDate()
  const next = new Date(y, m - 1, Math.min(day, last))
  next.setHours(0, 0, 0, 0)

  const clamped = clampToRange(next, minDate.value, maxDate.value)
  focusedDate.value = clamped
  viewMonth.value = startOfMonth(clamped)
}

function onYearChange(e: Event) {
  const y = Number((e.target as HTMLSelectElement).value)
  setViewByYearMonth(y, selectedMonth.value)
}
function onMonthChange(e: Event) {
  const m = Number((e.target as HTMLSelectElement).value)
  setViewByYearMonth(selectedYear.value, m)
}

/* ---------------- calendar grid (Slim) ---------------- */
const weekDays = ['일', '월', '화', '수', '목', '금', '토']

type Cell = {
  key: string
  date: Date | null
  label: string
  disabled: boolean
  isToday: boolean
  isSelected: boolean
  isFocused: boolean
}

const cells = computed<Cell[]>(() => {
  const monthStart = startOfMonth(viewMonth.value)
  const monthEnd = endOfMonth(viewMonth.value)

  const lead = monthStart.getDay()
  const totalDays = monthEnd.getDate()

  const sel = selectedDate.value
  const focus = focusedDate.value

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const list: Cell[] = []

  // leading blanks
  for (let i = 0; i < lead; i++) {
    list.push({
      key: `b-${i}`,
      date: null,
      label: '',
      disabled: true,
      isToday: false,
      isSelected: false,
      isFocused: false
    })
  }

  // days
  for (let d = 1; d <= totalDays; d++) {
    const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), d)
    date.setHours(0, 0, 0, 0)
    const out = isOutOfRange(date, minDate.value, maxDate.value)

    list.push({
      key: formatYMD(date),
      date,
      label: String(d),
      disabled: props.disabled || out,
      isToday: isSameDay(date, today),
      isSelected: !!sel && isSameDay(date, sel),
      isFocused: !!focus && isSameDay(date, focus)
    })
  }

  // trailing blanks (마지막 주까지만)
  while (list.length % 7 !== 0) {
    const idx = list.length
    list.push({
      key: `t-${idx}`,
      date: null,
      label: '',
      disabled: true,
      isToday: false,
      isSelected: false,
      isFocused: false
    })
  }

  return list
})

const monthTitle = computed(() => `${viewMonth.value.getFullYear()}년 ${viewMonth.value.getMonth() + 1}월`)

/* ---------------- open/close + position (auto flip) ---------------- */
function updatePanelPosition() {
  const el = triggerEl.value
  if (!el) return

  const r = el.getBoundingClientRect()
  const desiredWidth = Math.max(r.width, 280)

  panelStyle.value = {
    position: 'fixed',
    left: `${r.left}px`,
    top: `${r.bottom + 6}px`,
    width: `${desiredWidth}px`,
    zIndex: '9999'
  }

  nextTick(() => {
    const panel = panelEl.value
    if (!panel) return
    const pr = panel.getBoundingClientRect()
    const overflowBottom = pr.bottom > window.innerHeight - 8
    const overflowRight = pr.right > window.innerWidth - 8

    if (overflowBottom) {
      const top = Math.max(8, r.top - 6 - pr.height)
      panelStyle.value.top = `${top}px`
    }
    if (overflowRight) {
      const left = Math.max(8, window.innerWidth - 8 - desiredWidth)
      panelStyle.value.left = `${left}px`
    }
  })
}

function openPanel() {
  if (props.disabled || open.value) return
  open.value = true
  emit('open')

  const base = selectedDate.value ?? new Date()
  const clamped = clampToRange(base, minDate.value, maxDate.value)
  focusedDate.value = clamped
  viewMonth.value = startOfMonth(clamped)

  nextTick(updatePanelPosition)
}

function closePanel() {
  if (!open.value) return
  open.value = false
  emit('close')
}

function togglePanel() {
  open.value ? closePanel() : openPanel()
}

function onDocPointerDown(e: PointerEvent) {
  if (!open.value) return
  const t = e.target as Node
  if (rootRef.value?.contains(t)) return
  if (panelEl.value?.contains(t)) return
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

/* ---------------- actions ---------------- */
function setValue(v: string | '') {
  emit('update:modelValue', v)
  emit('change', v)
}

function pickDate(d: Date) {
  if (isOutOfRange(d, minDate.value, maxDate.value)) return
  setValue(formatYMD(d))
  closePanel()
  triggerEl.value?.focus()
}

function pickToday() {
  const t = new Date()
  t.setHours(0, 0, 0, 0)
  const clamped = clampToRange(t, minDate.value, maxDate.value)
  if (!isOutOfRange(clamped, minDate.value, maxDate.value)) pickDate(clamped)
}

function clearValue(e?: MouseEvent) {
  e?.stopPropagation()
  if (props.disabled) return
  setValue('')
  closePanel()
  triggerEl.value?.focus()
}

function goPrevMonth() {
  // ✅ 연/월 셀렉터가 켜져도 동일 동작
  viewMonth.value = startOfMonth(addMonths(viewMonth.value, -1))
}
function goNextMonth() {
  viewMonth.value = startOfMonth(addMonths(viewMonth.value, 1))
}

function onCellHover(d: Date) {
  focusedDate.value = d
}

/* ---------------- keyboard ---------------- */
function moveFocus(days: number) {
  const next = addDays(focusedDate.value, days)
  const clamped = clampToRange(next, minDate.value, maxDate.value)
  focusedDate.value = clamped
  if (clamped.getFullYear() !== viewMonth.value.getFullYear() || clamped.getMonth() !== viewMonth.value.getMonth()) {
    viewMonth.value = startOfMonth(clamped)
  }
}

function onKeydown(e: KeyboardEvent) {
  if (props.disabled) return

  if (!open.value) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      openPanel()
    }
    return
  }

  switch (e.key) {
    case 'Escape':
      e.preventDefault()
      closePanel()
      triggerEl.value?.focus()
      return
    case 'ArrowLeft':
      e.preventDefault()
      moveFocus(-1)
      return
    case 'ArrowRight':
      e.preventDefault()
      moveFocus(1)
      return
    case 'ArrowUp':
      e.preventDefault()
      moveFocus(-7)
      return
    case 'ArrowDown':
      e.preventDefault()
      moveFocus(7)
      return
    case 'PageUp':
      e.preventDefault()
      focusedDate.value = clampToRange(addMonths(focusedDate.value, -1), minDate.value, maxDate.value)
      viewMonth.value = startOfMonth(focusedDate.value)
      return
    case 'PageDown':
      e.preventDefault()
      focusedDate.value = clampToRange(addMonths(focusedDate.value, 1), minDate.value, maxDate.value)
      viewMonth.value = startOfMonth(focusedDate.value)
      return
    case 'Home':
      e.preventDefault()
      focusedDate.value = clampToRange(startOfMonth(viewMonth.value), minDate.value, maxDate.value)
      return
    case 'End':
      e.preventDefault()
      focusedDate.value = clampToRange(endOfMonth(viewMonth.value), minDate.value, maxDate.value)
      return
    case 'Enter':
      e.preventDefault()
      pickDate(focusedDate.value)
      return
    case 'Tab':
      closePanel()
      return
  }
}
</script>

<template>
  <div class="form-field" ref="rootRef" :style="{ width: widthCss, marginBottom: label ? undefined : `${mb}px` }">
    <label v-if="label">{{ label }}</label>

    <div ref="triggerEl" :class="triggerClass" role="combobox" :aria-expanded="open ? 'true' : 'false'" :aria-disabled="disabled ? 'true' : 'false'" tabindex="0" @click="togglePanel" @keydown="onKeydown">
      <span class="dp-value" :class="{ 'is-placeholder': !modelValue }">
        {{ displayText }}
      </span>

      <button v-if="clearable && !disabled && modelValue" class="dp-clear" type="button" aria-label="clear" @click="clearValue">×</button>

      <span class="dp-caret" aria-hidden="true"></span>
    </div>

    <teleport to="body">
      <transition name="dp-fade">
        <div v-if="open" ref="panelEl" class="dp-panel" :style="panelStyle" @keydown="onKeydown">
          <div class="dp-head">
            <button class="dp-nav" type="button" @mousedown.prevent @click="goPrevMonth" aria-label="prev">‹</button>

            <!-- ✅ 옵션1: 연/월 셀렉터 -->
            <template v-if="showMonthYearSelect">
              <div class="dp-ym">
                <select class="dp-ym-select" :value="selectedYear" @change="onYearChange">
                  <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}년</option>
                </select>

                <select class="dp-ym-select" :value="selectedMonth" @change="onMonthChange">
                  <option v-for="m in monthOptions" :key="m" :value="m">{{ m }}월</option>
                </select>
              </div>
            </template>

            <!-- 기본: 타이틀 -->
            <div v-else class="dp-title">{{ monthTitle }}</div>

            <button class="dp-nav" type="button" @mousedown.prevent @click="goNextMonth" aria-label="next">›</button>
          </div>

          <div class="dp-week">
            <div v-for="w in weekDays" :key="w" class="dp-weekday">{{ w }}</div>
          </div>

          <div class="dp-grid">
            <button
              v-for="c in cells"
              :key="c.key"
              class="dp-cell"
              :class="{
                'is-today': c.isToday,
                'is-selected': c.isSelected,
                'is-focused': c.isFocused,
                'is-empty': !c.date
              }"
              type="button"
              :disabled="c.disabled || !c.date"
              @mousedown.prevent
              @mouseenter="c.date && onCellHover(c.date)"
              @click="c.date && pickDate(c.date)">
              {{ c.label }}
            </button>
          </div>

          <div class="dp-foot">
            <button class="dp-action" type="button" @mousedown.prevent @click="pickToday">오늘</button>
            <button v-if="clearable" class="dp-action" type="button" @mousedown.prevent @click="clearValue">초기화</button>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<style scoped>
/* Trigger */
.dp-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;

  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  user-select: none;

  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    background 0.2s;
}
.dp-wrap:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}
.dp-wrap.is-open {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
}
.dp-wrap.is-invalid {
  border-color: #ef4444;
}
.dp-wrap.is-disabled {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.85;
}

/* Size */
.dp-sm {
  padding: 4px 10px;
  font-size: 12px;
  line-height: 1.2;
  min-height: 30px;
}
.dp-md {
  padding: 6px 10px;
  font-size: 14px;
  line-height: 1.3;
  min-height: 34px;
}
.dp-lg {
  padding: 8px 12px;
  font-size: 16px;
  line-height: 1.4;
  min-height: 38px;
}

.dp-value {
  flex: 1;
  min-width: 0;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dp-value.is-placeholder {
  color: #6b7280;
}

/* caret */
.dp-caret {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid #6b7280;
  margin-left: 6px;
}

/* clear */
.dp-clear {
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 0 2px;
}
.dp-clear:hover {
  color: #111827;
}

/* Panel (Slim) */
.dp-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  padding: 8px;
  box-sizing: border-box;
}

/* header compact */
.dp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 6px;
}

.dp-title {
  font-weight: 700;
  color: #111827;
  font-size: 13px;
}

.dp-nav {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  cursor: pointer;
}
.dp-nav:hover {
  background: #f3f4f7;
}

/* ✅ Year/Month select group */
.dp-ym {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dp-ym-select {
  height: 28px;
  padding: 0 8px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #fff;
  font-size: 12px;
  color: #111827;
  outline: none;
}
.dp-ym-select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
}

/* weekday compact */
.dp-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  margin-bottom: 4px;
}
.dp-weekday {
  text-align: center;
  font-size: 12px;
  color: #6b7280;
  padding: 2px 0;
}

/* grid compact */
.dp-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.dp-cell {
  height: 28px;
  border-radius: 8px;
  border: none;
  background: #fff;
  cursor: pointer;
  color: #111827;
  font-size: 13px;
  transition:
    background 0.12s,
    color 0.12s,
    box-shadow 0.12s;
}
.dp-cell.is-empty {
  background: transparent;
  cursor: default;
}
.dp-cell:hover:not(:disabled) {
  background: #f3f4f6;
}
.dp-cell:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
.dp-cell.is-today:not(.is-selected) {
  box-shadow: inset 0 0 0 1px rgba(99, 102, 241, 0.45);
}
.dp-cell.is-focused:not(.is-selected):not(:disabled) {
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.18);
}
.dp-cell.is-selected {
  background: rgba(99, 102, 241, 0.16);
  color: #3730a3;
  font-weight: 700;
}

/* footer compact */
.dp-foot {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  margin-top: 6px;
}
.dp-action {
  border: 1px solid #e5e7eb;
  background: #fff;
  border-radius: 10px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 12px;
}
.dp-action:hover {
  background: #f3f4f6;
}

/* transition */
.dp-fade-enter-active,
.dp-fade-leave-active {
  transition:
    opacity 0.12s ease,
    transform 0.12s ease;
}
.dp-fade-enter-from,
.dp-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
