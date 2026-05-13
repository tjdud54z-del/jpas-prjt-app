<script setup lang="ts">
import { fetchCmmnCdByCondition, fetchCmmnCdDtlByCondition } from '@/api/cmmnCdApi'
import ElButton from '@/components/common/ElButton.vue'
import ElInputText from '@/components/common/ElInputText.vue'
import ElTabulatorGrid from '@/components/common/ElTabulatorGrid.vue'
import { useAlert } from '@/composables/useAlert'
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

/** 상태 타입 지정 */
type RowState = 'I' | 'U' | 'D' | null

/** 공통코드 조회 인터페이스 명시 */
interface CommonCode {
  commonCode: string
  commonCodeName: string
  activeYn: 'Y' | 'N'
  sortOrder: number
}

/** 공통 알림창 */
const { openAlert } = useAlert()

/** 공통코드 클릭 셀 강조용 */
const activeCommonCodeKey = ref<string | null>(null)

/** 삭제 동작 중 addRow 방지용 플래그 */
const commonDeleting = ref(false)
const dtlDeleting = ref(false)

/** 단축키로만 편집 열기 위한 플래그 */
const allowEditCommonCode = ref(false)
const allowEditDtlCode = ref(false)

/* ======================
 * 데이터 ref 지정
 * ====================== */
const commonCodes = ref<any[]>([])
const commonCodeDetails = ref<any[]>([])
const selectedCommonCode = ref<CommonCode | null>(null)

const searchForm = ref({
  commonCode: '',
  commonCodeName: '',
})

/* ======================
 * 그리드 테이블 ref
 * ====================== */
const commonTable = ref<any>(null)
const detailTable = ref<any>(null)
const onCommonGridReady = (t: any) => (commonTable.value = t)
const onDtlGridReady = (t: any) => (detailTable.value = t)
const NO_SORT = { headerSort: false }


/* ======================
 * 정규화 function
 * ====================== */
const COMMON_KEYS = [
  'commonCode','commonCodeName','activeYn','sortOrder','description',
  'attr1','attr2','attr3','attr4','attr5','attr6','attr7','attr8','attr9','attr10'
]
const DTL_KEYS = [
  'commonCode','commonCodeDtl','commonCodeDtlName','activeYn','sortOrder','description',
  'attr1','attr2','attr3','attr4','attr5','attr6','attr7','attr8','attr9','attr10'
]

const normalizeValue = (v: any) => {
  if (v === undefined || v === null) return null
  if (typeof v === 'string') {
    const trimmed = v.trim()
    return trimmed === '' ? null : trimmed
  }
  return v
}
const normalizeByKeys = (row: any, keys: string[]) => {
  const out: Record<string, any> = {}
  keys.forEach((k) => (out[k] = normalizeValue(row?.[k])))
  return out
}
const stableStringify = (obj: any) => JSON.stringify(obj, Object.keys(obj).sort())

/* ======================
 * strip meta before sending API
 * ====================== */
const stripMeta = (row: any) => {
  // const { __rowKey, __rowState, __badge, ...rest } = row
  const { ...rest } = row
  return rest
}

/* ======================
 * state maps: COMMON
 * ====================== */
const originalCommonMap = ref(new Map<string, string>())
const insertedCommonMap = ref(new Map<string, any>())
const updatedCommonMap  = ref(new Map<string, any>())
const deletedCommonMap  = ref(new Map<string, any>())

/* ======================
 * state maps: DTL
 * ====================== */
const originalDtlMap = ref(new Map<string, string>())
const insertedDtlMap = ref(new Map<string, any>())
const updatedDtlMap  = ref(new Map<string, any>())
const deletedDtlMap  = ref(new Map<string, any>())

/* ======================
 * safe deselect all (undefined deselect 에러 방지)
 * ====================== */
const safeDeselectAll = (table: any) => {
  if (!table?.getSelectedRows) return
  const selected = table.getSelectedRows() ?? []
  selected.forEach((r: any) => {
    if (typeof r?.deselect === 'function') r.deselect()
    else if (typeof table?.deselectRow === 'function') table.deselectRow(r)
  })
}

/* ======================
 * redraw helper
 *  - Virtual DOM 타이밍 꼬임 방지 위해 "다음 프레임"에 1회 호출
 * ====================== */
const redrawOnce = (table: any) => {
  requestAnimationFrame(() => table?.redraw?.(true))
}

/* ======================
 * helpers
 * ====================== */
const setRowStateByKey = (table: any, rowKey: string, state: RowState) => {
  const r = table?.getRow?.(rowKey)
  if (!r) return
  const d = r.getData()
  r.update({ ...d, __rowState: state })
  r.reformat?.()
}

/* ======================
 * grid options
 * selectableRows: "highlight"
 *  - 행 클릭으로 선택 상태가 바뀌지 않음(checkbox-only)
 * ====================== */
const commonGridOptions = {
  layout: 'fitDataTable',
  selectableRows: 'highlight',
  rowFormatter: (row: any) => {
    const d = row.getData()
    const el = row.getElement()
    el.style.backgroundColor = ''
    el.style.textDecoration = ''
    el.style.opacity = '1'

    const st: RowState = d.__rowState ?? null
    if (st === 'D') {
      el.style.backgroundColor = '#F3F4F6'
      el.style.textDecoration = 'line-through'
      el.style.opacity = '0.75'
    } else if (st === 'I') {
      el.style.backgroundColor = '#DCFCE7'
    } else if (st === 'U') {
      el.style.backgroundColor = '#FEF3C7'
    }
  },
}

const detailGridOptions = {
  layout: 'fitDataTable',
  selectableRows: 'highlight',
  rowFormatter: (row: any) => {
    const d = row.getData()
    const el = row.getElement()
    el.style.backgroundColor = ''
    el.style.textDecoration = ''
    el.style.opacity = '1'

    const st: RowState = d.__rowState ?? null
    if (st === 'D') {
      el.style.backgroundColor = '#F3F4F6'
      el.style.textDecoration = 'line-through'
      el.style.opacity = '0.75'
    } else if (st === 'I') {
      el.style.backgroundColor = '#DCFCE7'
    } else if (st === 'U') {
      el.style.backgroundColor = '#FEF3C7'
    }
  },
}

/* ======================
 * 삭제/복구
 * ====================== */
const markDeleteCommon = async (rowComp: any) => {
  const data = rowComp.getData()
  const key = data.__rowKey
  const st: RowState = data.__rowState ?? null

  // 신규(I) → 테이블 레벨 deleteRow로 실제 제거 (rowComp.delete() 지양)
  if (st === 'I') {
    commonDeleting.value = true
    try {
      // 선택되어 있으면 해당 row만 해제
      if (rowComp?.isSelected?.()) rowComp.deselect?.()

      insertedCommonMap.value.delete(key)
      updatedCommonMap.value.delete(key)
      deletedCommonMap.value.delete(key)

      if (commonTable.value?.deleteRow) {
        await commonTable.value.deleteRow(key)
      } else {
        // fallback (가능하면 타지 않게)
        await rowComp.delete?.()
      }

      // (중요) 외부 data 동기화 (래퍼가 :data watch로 setData 때리는 구조 대비)
      if (commonTable.value?.getData) {
        commonCodes.value = commonTable.value.getData()
      }

      await nextTick()
      redrawOnce(commonTable.value)
    } finally {
      commonDeleting.value = false
    }
    return
  }

  // 기존 → D 마킹
  deletedCommonMap.value.set(key, { ...data, __rowState: 'D' })
  updatedCommonMap.value.delete(key)
  rowComp.update({ ...data, __rowState: 'D' })
  rowComp.reformat?.()
  redrawOnce(commonTable.value)
}

const restoreCommon = (rowComp: any) => {
  const data = rowComp.getData()
  const key = data.__rowKey

  deletedCommonMap.value.delete(key)

  const original = originalCommonMap.value.get(key)
  const current = stableStringify(normalizeByKeys(data, COMMON_KEYS))

  if (original && original === current) {
    updatedCommonMap.value.delete(key)
    rowComp.update({ ...data, __rowState: null })
  } else {
    updatedCommonMap.value.set(key, { ...data, __rowState: 'U' })
    rowComp.update({ ...data, __rowState: 'U' })
  }

  rowComp.reformat?.()
  redrawOnce(commonTable.value)
}

const markDeleteDtl = async (rowComp: any) => {
  const data = rowComp.getData()
  const key = data.__rowKey
  const st: RowState = data.__rowState ?? null

  // 신규(I) → 테이블 레벨 deleteRow로 실제 제거
  if (st === 'I') {
    dtlDeleting.value = true
    try {
      if (rowComp?.isSelected?.()) rowComp.deselect?.()

      insertedDtlMap.value.delete(key)
      updatedDtlMap.value.delete(key)
      deletedDtlMap.value.delete(key)

      if (detailTable.value?.deleteRow) {
        await detailTable.value.deleteRow(key)
      } else {
        await rowComp.delete?.()
      }

      // 외부 data 동기화
      if (detailTable.value?.getData) {
        commonCodeDetails.value = detailTable.value.getData()
      }

      await nextTick()
      redrawOnce(detailTable.value)
    } finally {
      dtlDeleting.value = false
    }
    return
  }

  // 기존 → D 마킹
  deletedDtlMap.value.set(key, { ...data, __rowState: 'D' })
  updatedDtlMap.value.delete(key)
  rowComp.update({ ...data, __rowState: 'D' })
  rowComp.reformat?.()
  redrawOnce(detailTable.value)
}

const restoreDtl = (rowComp: any) => {
  const data = rowComp.getData()
  const key = data.__rowKey

  deletedDtlMap.value.delete(key)

  const original = originalDtlMap.value.get(key)
  const current = stableStringify(normalizeByKeys(data, DTL_KEYS))

  if (original && original === current) {
    updatedDtlMap.value.delete(key)
    rowComp.update({ ...data, __rowState: null })
  } else {
    updatedDtlMap.value.set(key, { ...data, __rowState: 'U' })
    rowComp.update({ ...data, __rowState: 'U' })
  }

  rowComp.reformat?.()
  redrawOnce(detailTable.value)
}

/* ======================
 * 추가 handler : 공통코드
 * ====================== */
const addCommonRow = async () => {
  if (!commonTable.value) return
  if (commonDeleting.value) return

  const key = `NEW_${Date.now()}`
  const newRow: any = {
    __rowKey: key,
    __rowState: 'I',
    commonCode: '',
    commonCodeName: '',
    activeYn: 'Y',
    sortOrder: 0,
    description: null,
    attr1: null, attr2: null, attr3: null, attr4: null, attr5: null,
    attr6: null, attr7: null, attr8: null, attr9: null, attr10: null,
  }

  commonTable.value.addRow(newRow, true).then((rowComp: any) => {
    insertedCommonMap.value.set(key, rowComp.getData())
    rowComp.reformat?.()
    redrawOnce(commonTable.value)
  })
}

/* ======================
 * 추가 handler : 서브코드
 * ====================== */
const addDtlRow = async () => {
  if (!detailTable.value) return
  if (!selectedCommonCode.value?.commonCode) {
    openAlert('먼저 공통코드를 선택해주세요.')
    return
  }
  if (dtlDeleting.value) return

  const key = `NEW_${Date.now()}`
  const newRow: any = {
    __rowKey: key,
    __rowState: 'I',
    commonCode: selectedCommonCode.value.commonCode,
    commonCodeDtl: '',
    commonCodeDtlName: '',
    activeYn: 'Y',
    sortOrder: 0,
    description: null,
    attr1: null, attr2: null, attr3: null, attr4: null, attr5: null,
    attr6: null, attr7: null, attr8: null, attr9: null, attr10: null,
  }

  detailTable.value.addRow(newRow, true).then((rowComp: any) => {
    insertedDtlMap.value.set(key, rowComp.getData())
    rowComp.reformat?.()
    redrawOnce(detailTable.value)
  })
}

/* ======================
 * 체크박스 선택 기반 삭제/복구
 * - 선택 목록이 변하므로 스냅샷 복사 후 처리
 * ====================== */
const deleteSelectedCommon = async () => {
  if (!commonTable.value) return
  const selected = [...(commonTable.value.getSelectedRows?.() ?? [])]
  if (selected.length === 0) {
    await openAlert('삭제할 공통코드를 선택하세요.')
    return
  }

  for (const row of selected) {
    const st: RowState = row.getData().__rowState ?? null
    if (st === 'D') continue
    await markDeleteCommon(row)
  }

  // 끝에서 한 번만 정리
  safeDeselectAll(commonTable.value)

  if (commonTable.value?.getData) {
    commonCodes.value = commonTable.value.getData()
  }

  await nextTick()
  redrawOnce(commonTable.value)
}

const restoreSelectedCommon = async () => {
  if (!commonTable.value) return
  const selected = [...(commonTable.value.getSelectedRows?.() ?? [])]
  if (selected.length === 0) {
    await openAlert('복구할 공통코드를 선택하세요.')
    return
  }

  for (const row of selected) {
    const st: RowState = row.getData().__rowState ?? null
    if (st !== 'D') continue
    restoreCommon(row)
  }

  safeDeselectAll(commonTable.value)

  if (commonTable.value?.getData) {
    commonCodes.value = commonTable.value.getData()
  }

  await nextTick()
  redrawOnce(commonTable.value)
}

const deleteSelectedDtl = async () => {
  if (!detailTable.value) return
  const selected = [...(detailTable.value.getSelectedRows?.() ?? [])]
  if (selected.length === 0) {
    await openAlert('삭제할 서브코드를 선택하세요.')
    return
  }

  for (const row of selected) {
    const st: RowState = row.getData().__rowState ?? null
    if (st === 'D') continue
    await markDeleteDtl(row)
  }

  safeDeselectAll(detailTable.value)

  if (detailTable.value?.getData) {
    commonCodeDetails.value = detailTable.value.getData()
  }

  await nextTick()
  redrawOnce(detailTable.value)
}

const restoreSelectedDtl = async () => {
  if (!detailTable.value) return
  const selected = [...(detailTable.value.getSelectedRows?.() ?? [])]
  if (selected.length === 0) {
    await openAlert('복구할 서브코드를 선택하세요.')
    return
  }

  for (const row of selected) {
    const st: RowState = row.getData().__rowState ?? null
    if (st !== 'D') continue
    restoreDtl(row)
  }

  safeDeselectAll(detailTable.value)

  if (detailTable.value?.getData) {
    commonCodeDetails.value = detailTable.value.getData()
  }

  await nextTick()
  redrawOnce(detailTable.value)
}

/* ======================
 * 체크박스 컬럼
 * - rowSelection 내장 토글 사용(중복 toggleSelect 금지)
 * ====================== */
const selectionColumn = {
  formatter: 'rowSelection',
  titleFormatter: 'rowSelection',
  hozAlign: 'center',
  headerSort: false,
  width: 50,
  cellClick: (e: any) => {
    e.stopPropagation()
  },
}

/* ======================
 * 공통코드 클릭 → 서브 조회
 * - editor가 있는 컬럼에서 cellClick이 안 타는 케이스 보고 → cellMouseDown 사용
 * ====================== */
const onClickCommonCodeToLoadDetails = (e: any, cell: any) => {
  e.stopPropagation()
  const rowData = cell.getRow().getData()
  if (!rowData?.commonCode) return

  activeCommonCodeKey.value = rowData.__rowKey
  redrawOnce(commonTable.value)

  loadDetails(rowData)
}

/* ======================
 * columns: COMMON / DTL
 * ====================== */
const commonCodeColumns = [
  selectionColumn,
  {
    title: 'status',
    field: '__badge',
    width: 70,
    headerSort: false,
    hozAlign: 'center',
    headerHozAlign: 'center',
    formatter: (cell: any) => {
      const d = cell.getRow().getData()
      const st: RowState = d.__rowState ?? null
      if (st === 'I') return `<span class="badge-pill badge-insert">신규</span>`
      if (st === 'U') return `<span class="badge-pill badge-update">수정</span>`
      if (st === 'D') return `<span class="badge-pill badge-delete">삭제</span>`
      return ''
    },
  },
  {
    title: '공통코드',
    field: 'commonCode',
    width: 150,
    headerSort: false,
    editor: 'input',
    headerHozAlign: 'center',
    editable: (cell: any) => {
      const st: RowState = cell.getRow().getData().__rowState ?? null
      return allowEditCommonCode.value && st === 'I'
    },
    formatter: (cell: any) => {
      const rowData = cell.getRow().getData()
      const value = cell.getValue()
      const isActive = rowData.__rowKey === activeCommonCodeKey.value
      return `
        <span style="
          width:100%;
          border-radius:6px;
          cursor:pointer;
          font-weight:${isActive ? '700' : '500'};
          color:${isActive ? '#1d4ed8' : '#2563eb'};
          background:${isActive ? '#e0e7ff' : 'transparent'};
          border:${isActive ? '1px solid #6366f1' : '1px solid transparent'};
        ">
          ${value ?? ''}
        </span>
      `
    },
    cellMouseDown: onClickCommonCodeToLoadDetails,
  },
  { 
    title: '공통코드명', 
    field: 'commonCodeName', 
    width: 200, 
    headerSort: false, 
    editor: 'input', 
    headerHozAlign: 'center',
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  {
    title: '사용여부',
    field: 'activeYn',
    width: 100,
    headerSort: false,
    editor: 'list',
    headerHozAlign: 'center',
    editorParams: { values: { Y: '사용', N: '미사용' }, clearable: false },
    formatter: 'lookup',
    formatterParams: { Y: '사용', N: '미사용' },
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  { 
    title: '순서', 
    field: 'sortOrder',
    width: 80, 
    headerSort: false, 
    editor: 'number', 
    hozAlign: 'right',
    headerHozAlign: 'center',
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  { 
    title: '설명', 
    field: 'description', 
    width: 200, 
    headerSort: false, 
    editor: 'input', 
    headerHozAlign: 'center',
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  { 
    title: '속성1', 
    field: 'attr1', 
    width: 100, 
    editor: 'input', 
    headerSort: false, 
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D' 
  },
  { 
    title: '속성2', 
    field: 'attr2', 
    width: 100, 
    editor: 'input', 
    headerSort: false, 
    headerHozAlign: 'center',
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  { 
    title: '속성3', 
    field: 'attr3', 
    width: 100, 
    editor: 'input', 
    headerSort: false, 
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  { 
    title: '속성4', 
    field: 'attr4',
    width: 100, 
    editor: 'input', 
    headerSort: false, 
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  { 
    title: '속성5', 
    field: 'attr5', 
    width: 100, 
    editor: 'input',
    headerSort: false, 
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  { 
    title: '속성6', 
    field: 'attr6', 
    width: 100, 
    editor: 'input',
    headerSort: false,
    headerHozAlign: 'center',
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  { 
    title: '속성7', 
    field: 'attr7', 
    width: 100,
    editor: 'input', 
    headerSort: false,
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  { 
    title: '속성8', 
    field: 'attr8', 
    width: 100, 
    editor: 'input', 
    headerSort: false, 
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  { 
    title: '속성9', 
    field: 'attr9', 
    width: 100, 
    editor: 'input',
    headerSort: false, 
    headerHozAlign: 'center',
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  { 
    title: '속성10',
    field: 'attr10',
    width: 100,
    editor: 'input', 
    headerSort: false,
    headerHozAlign: 'center',
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
]

const detailColumns = [
  selectionColumn,
  {
    title: 'status',
    field: '__badge',
    width: 70,
    headerSort: false,
    hozAlign: 'center',
    headerHozAlign: 'center',
    formatter: (cell: any) => {
      const d = cell.getRow().getData()
      const st: RowState = d.__rowState ?? null
      if (st === 'I') return `<span class="badge-pill badge-insert">신규</span>`
      if (st === 'U') return `<span class="badge-pill badge-update">수정</span>`
      if (st === 'D') return `<span class="badge-pill badge-delete">삭제</span>`
      return ''
    },
  },
  {
    title: '서브코드', 
    field: 'commonCodeDtl', 
    width: 150, 
    headerSort: false,
    editor: 'input',
    headerHozAlign: 'center',
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  { 
    title: '서브코드명',
    field: 'commonCodeDtlName',
    width: 200,
    headerSort: false,
    editor: 'input', 
    headerHozAlign: 'center',
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  {
    title: '사용여부',
    field: 'activeYn',
    width: 100,
    headerSort: false,
    editor: 'list',
    headerHozAlign: 'center',
    editorParams: { values: { Y: '사용', N: '미사용' }, clearable: false },
    formatter: 'lookup',
    formatterParams: { Y: '사용', N: '미사용' },
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  { 
    title: '순서', 
    field: 'sortOrder', 
    width: 80, 
    headerSort: false,
    editor: 'number', 
    headerHozAlign: 'center',
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  { 
    title: '설명', 
    field: 'description', 
    width: 200, 
    headerSort: false,
    editor: 'input', 
    headerHozAlign: 'center',
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D'
  },
  { 
    title: '속성1', 
    field: 'attr1', 
    width: 100, 
    headerSort: false,
    editor: 'input', 
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D' 
  },
  { 
    title: '속성2', 
    field: 'attr2', 
    width: 100, 
    headerSort: false,
    editor: 'input', 
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D' 
  },
  { 
    title: '속성3', 
    field: 'attr3', 
    width: 100, 
    editor: 'input', 
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D' 
  },
  { 
    title: '속성4', 
    field: 'attr4', 
    width: 100, 
    headerSort: false,
    editor: 'input', 
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D' 
  },
  { 
    title: '속성5', 
    field: 'attr5', 
    width: 100, 
    headerSort: false,
    editor: 'input', 
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D' 
  },
  { 
    title: '속성6', 
    field: 'attr6', 
    width: 100, 
    headerSort: false,
    editor: 'input', 
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D' 
  },
  { 
    title: '속성7', 
    field: 'attr7', 
    width: 100, 
    headerSort: false,
    editor: 'input', 
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D' 
  },
  { 
    title: '속성8', 
    field: 'attr8', 
    width: 100, 
    headerSort: false,
    editor: 'input', 
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D' 
  },
  { 
    title: '속성9', 
    field: 'attr9', 
    width: 100, 
    headerSort: false,
    editor: 'input', 
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D' 
  },
  { 
    title: '속성10', 
    field: 'attr10', 
    width: 100, 
    headerSort: false,
    editor: 'input', 
    headerHozAlign: 'center', 
    editable: (cell: any) => (cell.getRow().getData().__rowState ?? null) !== 'D' 
  },
]

/* ======================
 * load common + details
 * ====================== */
const loadCommonCodes = async () => {
  const res = await fetchCmmnCdByCondition(searchForm.value)

  const rows = (res.data ?? []).map((r: any) => ({
    ...r,
    __rowKey: r.commonCode,
    __rowState: null,
  }))

  commonCodes.value = rows
  selectedCommonCode.value = null
  commonCodeDetails.value = []

  originalCommonMap.value.clear()
  rows.forEach((r: any) => {
    originalCommonMap.value.set(r.__rowKey, stableStringify(normalizeByKeys(r, COMMON_KEYS)))
  })

  insertedCommonMap.value.clear()
  updatedCommonMap.value.clear()
  deletedCommonMap.value.clear()

  originalDtlMap.value.clear()
  insertedDtlMap.value.clear()
  updatedDtlMap.value.clear()
  deletedDtlMap.value.clear()

  activeCommonCodeKey.value = null
}

const loadDetails = async (row: CommonCode) => {
  selectedCommonCode.value = row
  const res = await fetchCmmnCdDtlByCondition({ commonCode: row.commonCode })

  const dtlRows = (res.data ?? []).map((r: any) => ({
    ...r,
    __rowKey: `${r.commonCode}::${r.commonCodeDtl}`,
    __rowState: null,
  }))

  commonCodeDetails.value = dtlRows

  originalDtlMap.value.clear()
  dtlRows.forEach((r: any) => {
    originalDtlMap.value.set(r.__rowKey, stableStringify(normalizeByKeys(r, DTL_KEYS)))
  })

  insertedDtlMap.value.clear()
  updatedDtlMap.value.clear()
  deletedDtlMap.value.clear()
}

/* ======================
 * cell edited handlers
 * ====================== */
const onCommonCellEdited = ({ row }: any) => {
  const key = row.__rowKey
  const st: RowState = row.__rowState ?? null
  if (st === 'D') return

  if (st === 'I') {
    insertedCommonMap.value.set(key, row)
    commonTable.value?.getRow?.(key)?.reformat?.()
    redrawOnce(commonTable.value)
    return
  }

  const original = originalCommonMap.value.get(key)
  const current = stableStringify(normalizeByKeys(row, COMMON_KEYS))

  if (original && original === current) {
    updatedCommonMap.value.delete(key)
    setRowStateByKey(commonTable.value, key, null)
  } else {
    updatedCommonMap.value.set(key, row)
    setRowStateByKey(commonTable.value, key, 'U')
  }

  redrawOnce(commonTable.value)
}

const onDtlCellEdited = ({ row }: any) => {
  const key = row.__rowKey
  const st: RowState = row.__rowState ?? null
  if (st === 'D') return

  if (st === 'I') {
    insertedDtlMap.value.set(key, row)
    detailTable.value?.getRow?.(key)?.reformat?.()
    redrawOnce(detailTable.value)
    return
  }

  const original = originalDtlMap.value.get(key)
  const current = stableStringify(normalizeByKeys(row, DTL_KEYS))

  if (original && original === current) {
    updatedDtlMap.value.delete(key)
    setRowStateByKey(detailTable.value, key, null)
  } else {
    updatedDtlMap.value.set(key, row)
    setRowStateByKey(detailTable.value, key, 'U')
  }

  redrawOnce(detailTable.value)
}

/* ======================
 * save handlers
 * ====================== */
const saveCommon = async () => {
  const inserts = Array.from(insertedCommonMap.value.values()).map(stripMeta)
  const updates = Array.from(updatedCommonMap.value.values()).map(stripMeta)
  const deletes = Array.from(deletedCommonMap.value.values()).map(stripMeta)

  const invalidInsert = inserts.find((r: any) => !r.commonCode)
  if (invalidInsert) {
    await openAlert('신규 공통코드의 공통코드는 필수입니다.')
    return
  }

  if (inserts.length === 0 && updates.length === 0 && deletes.length === 0) {
    await openAlert('공통코드 변경사항이 없습니다.')
    return
  }
  debugger
  await openAlert('공통코드 저장이 완료되었습니다.')
  await loadCommonCodes()
}

const saveDtl = async () => {
  const inserts = Array.from(insertedDtlMap.value.values()).map(stripMeta)
  const updates = Array.from(updatedDtlMap.value.values()).map(stripMeta)
  const deletes = Array.from(deletedDtlMap.value.values()).map(stripMeta)

  const invalidInsert = inserts.find((r: any) => !r.commonCodeDtl)
  if (invalidInsert) {
    await openAlert('신규 서브코드의 서브코드는 필수입니다.')
    return
  }

  if (inserts.length === 0 && updates.length === 0 && deletes.length === 0) {
    await openAlert('서브코드 변경사항이 없습니다.')
    return
  }

  await openAlert('서브코드 저장이 완료되었습니다.')
  if (selectedCommonCode.value) await loadDetails(selectedCommonCode.value)
}

/* ======================
 * 단축키 편집 (Enter/F2)
 * ====================== */
const startEditCommonCode = () => {
  const rows = commonTable.value?.getSelectedRows?.() ?? []
  if (rows.length !== 1) return
  const row = rows[0]
  const st: RowState = row.getData().__rowState ?? null
  if (st !== 'I') {
    openAlert('공통코드는 신규(I) 행에서만 편집 가능합니다.')
    return
  }
  allowEditCommonCode.value = true
  row.getCell('commonCode')?.edit?.()
  setTimeout(() => (allowEditCommonCode.value = false), 0)
}

const startEditDtlCode = () => {
  const rows = detailTable.value?.getSelectedRows?.() ?? []
  if (rows.length !== 1) return
  const row = rows[0]
  const st: RowState = row.getData().__rowState ?? null
  if (st !== 'I') {
    openAlert('서브코드는 신규(I) 행에서만 편집 가능합니다.')
    return
  }
  allowEditDtlCode.value = true
  row.getCell('commonCodeDtl')?.edit?.()
  setTimeout(() => (allowEditDtlCode.value = false), 0)
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key !== 'Enter' && e.key !== 'F2') return
  const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
  if (tag === 'input' || tag === 'textarea') return

  const dtlSelected = detailTable.value?.getSelectedRows?.()?.length ?? 0
  const commonSelected = commonTable.value?.getSelectedRows?.()?.length ?? 0

  if (dtlSelected === 1) {
    e.preventDefault()
    startEditDtlCode()
    return
  }
  if (commonSelected === 1) {
    e.preventDefault()
    startEditCommonCode()
  }
}

/* ======================
 * search/reset
 * ====================== */
const resetSearch = async () => {
  searchForm.value = { commonCode: '', commonCodeName: '' }
}
const search = async () => {
  await loadCommonCodes()
}

onMounted(() => {
  loadCommonCodes()
  window.addEventListener('keydown', handleKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="card">
    <div class="page-header">
      <div class="page-title">공통코드 관리</div>

      <div class="search-bar">
        <div class="form-grid cols-6">
          <div class="form-field">
            <label>공통코드</label>
            <ElInputText v-model="searchForm.commonCode" />
          </div>
          <div class="form-field">
            <label>공통코드명</label>
            <ElInputText v-model="searchForm.commonCodeName" />
          </div>
        </div>
        <div class="search-actions">
          <ElButton type="primary" size="md" label="조회" @click="search" />
          <ElButton type="secondary" size="md" label="초기화" @click="resetSearch" />
        </div>
      </div>
    </div>

    <div class="custom-content">
      <div class="header-bar">
        <div class="action-bar">
          <ElButton type="primary" size="md" label="추가" @click="addCommonRow" />
          <ElButton type="danger" size="md" label="삭제" @click="deleteSelectedCommon" />
          <ElButton type="secondary" size="md" label="복구" @click="restoreSelectedCommon" />
          <ElButton type="success" size="md" label="저장" @click="saveCommon" />
        </div>
      </div>

      <ElTabulatorGrid
        :data="commonCodes"
        :columns="commonCodeColumns"
        :options="commonGridOptions"
        height="250px"
        index-field="__rowKey"
        @ready="onCommonGridReady"
        @cell-edited="onCommonCellEdited"
      />

      <div class="header-bar mt-4">
        <div class="action-bar">
          <ElButton type="primary" size="md" label="추가" @click="addDtlRow" />
          <ElButton type="danger" size="md" label="삭제" @click="deleteSelectedDtl" />
          <ElButton type="secondary" size="md" label="복구" @click="restoreSelectedDtl" />
          <ElButton type="success" size="md" label="저장" @click="saveDtl" />
        </div>
      </div>

      <ElTabulatorGrid
        :data="commonCodeDetails"
        :columns="detailColumns"
        :options="detailGridOptions"
        height="300px"
        index-field="__rowKey"
        @ready="onDtlGridReady"
        @cell-edited="onDtlCellEdited"
      />
    </div>
  </div>
</template>

<style>
.badge-pill {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
  color: #fff;
  line-height: 1.0;
}
.badge-insert { background: #22c55e; }
.badge-update { background: #f59e0b; }
.badge-delete { background: #ef4444; }
</style>