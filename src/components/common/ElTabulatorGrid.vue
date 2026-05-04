<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed, toRaw } from 'vue'
import { TabulatorFull as Tabulator } from 'tabulator-tables' // Vue3 예시에서 TabulatorFull 사용

type RowData = Record<string, any>

interface Props {
  /** 표시할 데이터 */
  data: RowData[]
  /** Tabulator columns 설정 */
  columns: any[]
  /** Tabulator options 추가(필요한 것만 덮어쓰기) */
  options?: Record<string, any>
  /** row 선택 기능 사용 여부 */
  selectable?: boolean
  /** unique key field (선택/업데이트/행 구분용) */
  indexField?: string
  /** height 지정 시 Virtual DOM 활성화(성능/스크롤 유지에 도움) */
  height?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({}),
  selectable: false,
  indexField: 'id',
})

const emit = defineEmits<{
  /** 선택된 row data 배열 */
  (e: 'selection-change', rows: RowData[]): void
  /** tabulator instance 외부에서 쓰고 싶을 때 */
  (e: 'ready', table: any): void
}>()

const tableEl = ref<HTMLElement | null>(null)
const table = ref<any>(null)

const mergedOptions = computed(() => {
  const base: Record<string, any> = {
    data: props.data,
    columns: props.columns,
    reactiveData: true,
    layout: 'fitColumns',
    index: props.indexField,
    selectableRows: props.selectable ? true : false, // 핵심: 다중 선택 허용
    // selectableRowsRangeMode: 'click', //  // 쉬프트 범위 선택 방식 (문서에 range mode 언급)
  }

  if (props.height) base.height = props.height

  return { ...base, ...props.options }
})

const init = () => {
  if (!tableEl.value) return
  table.value = new Tabulator(tableEl.value, mergedOptions.value) // Tabulator 생성 방식

  // 선택 이벤트 (Tabulator는 rowSelectionChanged 콜백 패턴이 흔함)
  table.value.on('rowSelectionChanged', (data: RowData[]) => {
    emit('selection-change', data)
  })

  emit('ready', table.value)
}

const destroy = () => {
  if (table.value) {
    table.value.destroy()
    table.value = null
  }
}

onMounted(() => init())

onBeforeUnmount(() => destroy())

/**
 * data 변경 반영
 * reactiveData:true면 push/splice 등의 변경은 자동 반영되지만,
 * "통째로 새 배열로 교체"되는 케이스는 setData/replaceData가 더 확실합니다.
 * Tabulator는 setData/replaceData 등으로 데이터 교체가 가능
 */
watch(
  () => props.data,
  (val) => {
    if (!table.value) return
    table.value.replaceData(toRaw(val)) // 스크롤/정렬 유지에 유리한 replaceData
  },
  { deep: true }
)

/** columns 변경 시 재초기화(컬럼 구조 변경은 destroy/init가 안전) */
watch(
  () => props.columns,
  () => {
    if (!table.value) return
    destroy()
    init()
  },
  { deep: true }
)
</script>

<template>
  <div ref="tableEl" class="tabulator-wrap"></div>
</template>

<style scoped>
.tabulator-wrap {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  box-sizing: border-box;
}
</style>