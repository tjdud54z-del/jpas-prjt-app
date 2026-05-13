
<script setup lang="ts">
import { TabulatorFull as Tabulator } from 'tabulator-tables'
import 'tabulator-tables/dist/css/tabulator.min.css'
import { computed, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue'

type RowData = Record<string, any>

interface Props {
  data: RowData[]
  columns: any[]
  options?: Record<string, any>
  selectable?: boolean
  indexField?: string
  height?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  options: () => ({}),
  selectable: false,
  indexField: 'id',
})

const emit = defineEmits<{
  (e: 'selection-change', rows: RowData[]): void
  (e: 'ready', table: any): void
  (e: 'cell-edited', payload: { row: RowData; field: string; value: any; oldValue?: any }): void
  (e: 'row-click', payload: { row: any; event: MouseEvent }): void
}>()

const tableEl = ref<HTMLElement | null>(null)
const table = ref<any>(null)

const mergedOptions = computed(() => {
  const base: Record<string, any> = {
    data: props.data,
    columns: props.columns,
    reactiveData: true,        // 유지
    layout: 'fitColumns',
    index: props.indexField,
    selectableRows: props.selectable ? true : false,
  }

  if (props.height) base.height = props.height
  return { ...base, ...props.options }
})

const init = () => {
  if (!tableEl.value) return

  table.value = new Tabulator(tableEl.value, mergedOptions.value)

  table.value.on('rowSelectionChanged', (data: RowData[]) => {
    emit('selection-change', data)
  })

  table.value.on('cellEdited', (cell: any) => {
    emit('cell-edited', {
      row: cell.getRow().getData(),
      field: cell.getField(),
      value: cell.getValue(),
      oldValue: cell.getOldValue?.(),
    })
  })

  table.value.on('rowClick', (e: MouseEvent, row: any) => {
    const target = e.target as HTMLElement
    if (target.closest('.tabulator-editing')) return
    emit('row-click', { row, event: e })
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
 * FIX #1
 * - deep watch 제거
 * - 배열 "참조가 바뀌었을 때만" replaceData 실행
 * - Tabulator addRow/delete 중에 replaceData가 끼어드는 레이스 방지
 */
watch(
  () => props.data,
  (val, oldVal) => {
    if (!table.value) return
    if (val === oldVal) return
    table.value.replaceData(toRaw(val))
  },
  { deep: false }
)

/** columns 변경 시 재초기화 */
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
