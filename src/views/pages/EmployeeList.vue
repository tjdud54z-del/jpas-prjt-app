<script setup lang="ts">
/** 임포트 컴포넌트 */
import { onMounted, ref } from 'vue'
import { fetchEmployeesByCondition, retireEmployees, restoreEmployees } from '@/api/employeeApi'
import { useLoadingStore } from '@/store/loadingStore'
import ElButton from '@/components/common/ElButton.vue'
import ElInputText from '@/components/common/ElInputText.vue';
import ElSelectBox from '@/components/common/ElSelectBox.vue';
import ElDatePicker from '@/components/common/ElDatePicker.vue';
import ElTabulatorGrid from '@/components/common/ElTabulatorGrid.vue'
import { useAlert } from '@/composables/useAlert'
import { useConfirm } from '@/composables/useConfirm'
import EmployeeCreatePopup from '@/views/popups/EmployeeCreatePopup.vue'

/** 직원 조회 인터페이스 */
interface Employee {
  employeeId: number
  employeeNo: string
  name: string
  departmentName: string
  positionName: string
  activeYn: 'Y' | 'N'
}

/** 모달 메세지창 */
const { openConfirm } = useConfirm()
const { openAlert } = useAlert()

/** 직원 추가 모달 표시 여부 */
const showCreateModal = ref(false)

/** 데이터/선택 */
const employees = ref<Employee[]>([])
const checkedIds = ref<number[]>([])

/** 로딩바 컴포넌트 */
const loadingStore = useLoadingStore()

/** 공통 그리드에서 넘어오는 table instance 저장 (선택 해제 등 제어용) */
const gridTable = ref<any>(null)
const onGridReady = (table: any) => {
  gridTable.value = table
}

/** 공통 그리드 selection-change → checkedIds 동기화 */
const onSelectionChange = (rows: Record<string, any>[]) => {
  checkedIds.value = rows.map(r => r.employeeId)
}

const activeOptions = [
  { label: '재직', value: 'Y' },
  { label: '퇴사', value: 'N' },
]

/** Tabulator 컬럼 정의 */
const columns: any[] = [
  {
    formatter: 'rowSelection',
    titleFormatter: 'rowSelection',
    width: 50,
    hozAlign: 'center',
    headerSort: false,
  },
  { title: 'ID', field: 'employeeId', width: 80, sorter: 'number' },
  { title: '사번', field: 'employeeNo', sorter: 'string' },
  { title: '이름', field: 'name', sorter: 'string' },
  { title: '이메일', field: 'email', sorter: 'string' },
  { title: '입사일', field: 'hireDate', sorter: 'number'},
  { title: '부서', field: 'departmentName', sorter: 'string' },
  { title: '직급', field: 'positionName', sorter: 'string' },
  {
    title: '재직',
    field: 'activeYn',
    width: 90,
    hozAlign: 'center',
    headerSort: false,
    formatter: (cell: any) => {
      const v = cell.getValue()
      const text = v === 'Y' ? '재직' : '퇴사'
      const cls = v === 'Y' ? 'badge active' : 'badge inactive'
      return `<span class="${cls}">${text}</span>` // HTML 형식으로 DOM 로드 가능.
    },
  },
]

/**
 * 그리드 옵션
 * - selectableRows: true 로 Row Selection 활성화가 필요합니다.
 * - selectableRowsRangeMode: "click" 은 쉬프트 범위 선택 방식(선택사항)
 */
const gridOptions = {
  selectableRows: true,
  layout: 'fitColumns',
}

/** 직원추가 handler */
const addEmployee = () => {
  showCreateModal.value = true
}

/** 직원목록 조회 handler */
const loadEmployees = async () => {
  try {
    const res = await fetchEmployeesByCondition(searchForm.value)
    employees.value = res.data

    // 데이터 갱신 시 선택은 초기화해주는게 안전(버튼 활성화/선택 혼선 방지)
    checkedIds.value = []
    gridTable.value?.deselectRow?.()
  } catch (e) {
    // 만료/에러 시 기존 데이터 제거(착시 방지)
    employees.value = []
    checkedIds.value = []
    gridTable.value?.deselectRow?.()
  }
}

/** 퇴사처리 handler */
const retire = async () => {
  if (checkedIds.value.length === 0) return

  const selectedEmployees = employees.value.filter(e =>
    checkedIds.value.includes(e.employeeId)
  )

  const inactiveList = selectedEmployees.filter(e => e.activeYn === 'N')
  const activeList = selectedEmployees.filter(e => e.activeYn === 'Y')

  if (inactiveList.length > 0) {
    const okInactive = await openConfirm(
      `선택한 ${inactiveList.length}명은 이미 퇴사상태입니다.\n재직자 ${activeList.length}명만 퇴사처리를 하시겠습니까?`
    )
    if (!okInactive) return
  }

  if (activeList.length === 0) {
    await openConfirm('퇴사처리할 재직자가 없습니다.')
    return
  }

  const ok = await openConfirm('선택한 재직자를 퇴사처리하시겠습니까?')
  if (!ok) return

  const targetIds = activeList.map(e => e.employeeId)
  await retireEmployees(targetIds)

  await openAlert('퇴사처리가 완료되었습니다.')

  checkedIds.value = []
  gridTable.value?.deselectRow?.()
  await loadEmployees()
}

/** 복직처리 handler */
const restore = async () => {
  if (checkedIds.value.length === 0) return

  const selectedEmployees = employees.value.filter(e =>
    checkedIds.value.includes(e.employeeId)
  )

  const inactiveList = selectedEmployees.filter(e => e.activeYn === 'Y')
  const activeList = selectedEmployees.filter(e => e.activeYn === 'N')

  if (inactiveList.length > 0) {
    const okInactive = await openConfirm(
      `선택한 ${inactiveList.length}명은 이미 재직상태입니다.\n퇴사자 ${activeList.length}명만 복직처리를 하시겠습니까?`
    )
    if (!okInactive) return
  }

  if (activeList.length === 0) {
    await openConfirm('복직처리할 퇴사자가 없습니다.')
    return
  }

  const ok = await openConfirm('선택한 퇴사자를 복직처리하시겠습니까?')
  if (!ok) return

  const targetIds = activeList.map(e => e.employeeId)
  await restoreEmployees(targetIds)

  await openAlert('복직처리가 완료되었습니다.')

  checkedIds.value = []
  gridTable.value?.deselectRow?.()
  await loadEmployees()
}

/** 검색 조건 */
const searchForm = ref({
  employeeNo: '',
  name: '',
  hireDate: '',
  activeYn: '' as '' | 'Y' | 'N'
})

/** 조회 버튼 */
const searchEmployees = async () => {
  await loadEmployees()
}

/** 초기화 버튼 */
const resetSearch = async () => {
  searchForm.value = { employeeNo: '', name: '', hireDate: '',  activeYn: '' }

  // 초기화 시 선택도 같이 초기화(UX 안정)
  checkedIds.value = []
  gridTable.value?.deselectRow?.()

  // 필요하면 즉시 조회:
  // await loadEmployees()
}

const submitEmployee = async (form: any) => {
  // await createEmployee(form)
  await openAlert('직원이 등록되었습니다.')
  showCreateModal.value = false
  await loadEmployees()
}

const cancelCreate = () => {
  showCreateModal.value = false
}

onMounted(() => {
  loadEmployees()
})
</script>

<!-- 탬플릿 Area -->
<template>
  <div class="custom-content">
    <!-- 검색 영역 -->
    <div class="search-bar">
      <div class="form-grid cols-4">
      <ElInputText
        label="사번"
        v-model="searchForm.employeeNo"
        placeholder="사번을 입력하세요." />
      <ElInputText
        label="이름"
        v-model="searchForm.name"
        placeholder="이름을 입력하세요." />
      <ElDatePicker
        label="입사일"
        v-model="searchForm.hireDate" />
      <ElSelectBox
        label="재직여부"
        v-model="searchForm.activeYn"
        placeholder="전체"
        :options="activeOptions" />
      </div>
      <div class="search-actions">
        <ElButton 
          type="primary" 
          @click="searchEmployees">
          조회
        </ElButton>
        <ElButton 
          type="secondary" 
          @click="resetSearch">
          초기화
        </ElButton>
      </div>
    </div>

    <!-- 컨텐츠영역>제목/버튼 -->
    <div class="header-bar">
      <h2>직원관리</h2>
      <div class="action-bar">
        <ElButton 
          type="primary" 
          @click="addEmployee">
          직원 추가
        </ElButton>
        <ElButton
          type="danger"
          :disabled="checkedIds.length === 0 || loadingStore.isLoading"
          @click="retire">
          퇴사 처리
        </ElButton>
        <ElButton
          type="success"
          :disabled="checkedIds.length === 0 || loadingStore.isLoading"
          @click="restore">
          복직 처리
        </ElButton>
      </div>
    </div>

    <!-- 공통 Tabulator Grid -->
    <ElTabulatorGrid
      :data="employees"
      :columns="columns"
      :options="gridOptions"
      :selectable="true"
      index-field="employeeId"
      height="520px"
      @ready="onGridReady"
      @selection-change="onSelectionChange"
    />
  
  </div>
  <EmployeeCreatePopup
    v-if="showCreateModal"
    @submit="submitEmployee"
    @cancel="cancelCreate" />
</template>

<!-- 스타일 Area -->
<style scoped>
</style>