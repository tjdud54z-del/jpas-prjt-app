<!-- 스크립트 Area (스크립트를 제일 최상단에 놓는다. 해당사항은 현 프로젝트 고정) -->
<script setup lang="ts">
/** 임포트 컴포넌트 */
import { onMounted, ref, computed } from 'vue'
import { fetchEmployeesByCondition, retireEmployees, restoreEmployees } from '@/api/employeeApi'
import { useLoadingStore } from '@/store/loadingStore'
import ElButton from '@/components/common/ElButton.vue'
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

/** 컴포넌트 */
const employees = ref<Employee[]>([])
const checkedIds = ref<number[]>([])

/** 로딩바 컴포넌트 */
const loadingStore = useLoadingStore()

/** 전체 체크박스 */
const allChecked = computed({
  get() {
    return (
      employees.value.length > 0 &&
      checkedIds.value.length === employees.value.length
    )
  },
  set(val: boolean) {
    checkedIds.value = val
      ? employees.value.map(e => e.employeeId)
      : []
  }
})

/** 직원추가 handler */
const addEmployee = () => {
  showCreateModal.value = true
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
  await loadEmployees()
}


/* 복직처리 handler */
const restore = async () => {
  if (checkedIds.value.length === 0) return

  const selectedEmployees = employees.value.filter(e =>
    checkedIds.value.includes(e.employeeId)
  )

  const inactiveList = selectedEmployees.filter(e => e.activeYn === 'Y')
  const activeList = selectedEmployees.filter(e => e.activeYn === 'N')

  if (inactiveList.length > 0) {
    const okInactive = await openConfirm(
      `선택한 ${inactiveList.length}명은 이미 재직상태입니다.\n재직자 ${activeList.length}명만 복직처리를 하시겠습니까?`
    )
    if (!okInactive) return
  }

  if (activeList.length === 0) {
    await openConfirm('복직처리할 재직자가 없습니다.')
    return
  }

  const ok = await openConfirm('선택한 재직자를 복직처리하시겠습니까?')
  if (!ok) return

  const targetIds = activeList.map(e => e.employeeId)
  await restoreEmployees(targetIds)

  await openAlert('복직처리가 완료되었습니다.')

  checkedIds.value = []
  await loadEmployees()
}

/* 직원목록 조회 handler */
const loadEmployees = async () => {
  const res = await fetchEmployeesByCondition(searchForm.value)
  employees.value = res.data
}


/** 검색 조건 */
const searchForm = ref({
  employeeNo: '',
  name: '',
  activeYn: '' as '' | 'Y' | 'N'
})

/** 조회 버튼 */
const searchEmployees = async () => {
  await loadEmployees()
}

/** 초기화 버튼 */
const resetSearch = async () => {
  searchForm.value = {
    employeeNo: '',
    name: '',
    activeYn: ''
  }
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
      <input
        class="search-input"
        v-model="searchForm.employeeNo"
        placeholder="사번" />
      <input
        class="search-input"
        v-model="searchForm.name"
        placeholder="이름" />
      <select class="search-select" v-model="searchForm.activeYn">
        <option value="">전체</option>
        <option value="Y">재직</option>
        <option value="N">퇴사</option>
      </select>
      <div class="search-actions">
        <ElButton type="primary" @click="searchEmployees">
          조회
        </ElButton>
        <ElButton type="secondary" @click="resetSearch">
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
          @click="addEmployee">직원 추가
        </ElButton>
        <ElButton 
          type="danger"
          :disabled="checkedIds.length === 0 || loadingStore.isLoading"
          @click="retire">퇴사 처리
        </ElButton>
        <ElButton 
          type="success"
          :disabled="checkedIds.length === 0 || loadingStore.isLoading"
          @click="restore">복직 처리
        </ElButton>
      </div>
    </div>
    <!-- 컨텐츠영역>테이블 -->
    <table class="custom-table">
      <thead>
        <tr>
          <th>
            <input
              type="checkbox"
              v-model="allChecked" />
          </th>
          <th>ID</th>
          <th>사번</th>
          <th>이름</th>
          <th>부서</th>
          <th>직급</th>
          <th>재직</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="emp in employees" :key="emp.employeeId">
          <td>
            <input
              type="checkbox"
              v-model="checkedIds"
              :value="emp.employeeId" />
          </td>
          <td>{{ emp.employeeId }}</td>
          <td>{{ emp.employeeNo }}</td>
          <td>{{ emp.name }}</td>
          <td>{{ emp.departmentName }}</td>
          <td>{{ emp.positionName }}</td>
          <td>
            <span :class="emp.activeYn === 'Y' ? 'badge active' : 'badge inactive'">
              {{ emp.activeYn === 'Y' ? '재직' : '퇴사' }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <EmployeeCreatePopup
    v-if="showCreateModal"
    @submit="submitEmployee"
    @cancel="cancelCreate" />
</template>

<!-- 스타일 Area -->
<style scoped>

</style>

