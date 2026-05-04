<script setup lang="ts">
/** 임포트 컴포넌트 */
import { fetchEmployeesByCondition, restoreEmployees, retireEmployees } from '@/api/employeeApi';
import ElButton from '@/components/common/ElButton.vue';
import ElDatePicker from '@/components/common/ElDatePicker.vue';
import ElInputText from '@/components/common/ElInputText.vue';
import ElSelectBox from '@/components/common/ElSelectBox.vue';
import ElTabulatorGrid from '@/components/common/ElTabulatorGrid.vue';
import { useAlert } from '@/composables/useAlert';
import { useConfirm } from '@/composables/useConfirm';
import { useLoadingStore } from '@/store/loadingStore';
import EmployeeCreatePopup from '@/views/popups/EmployeeCreatePopup.vue';
// import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue';

/** 직원 조회 인터페이스 */
interface Employee {
  userId: number;
  userNo: string;
  name: string;
  departmentName: string;
  positionName: string;
  activeYn: 'Y' | 'N';
}

import { useRouter } from 'vue-router';

const router = useRouter();

/** 모달 메세지창 */
const { openConfirm } = useConfirm();
const { openAlert } = useAlert();

// const toast = useToast();

/** 직원 추가 모달 표시 여부 */
const showCreateModal = ref(false);

/** 데이터/선택 */
const employees = ref<Employee[]>([]);
const checkedIds = ref<number[]>([]);

/** 로딩바 컴포넌트 */
const loadingStore = useLoadingStore();

/** 공통 그리드에서 넘어오는 table instance 저장 (선택 해제 등 제어용) */
const gridTable = ref<any>(null);
const onGridReady = (table: any) => {
  gridTable.value = table;
};

/** 공통 그리드 selection-change → checkedIds 동기화 */
const onSelectionChange = (rows: Record<string, any>[]) => {
  checkedIds.value = rows.map((r) => r.userId);
};

const activeOptions = [
  { label: '재직', value: 'Y' },
  { label: '퇴사', value: 'N' }
];

/** Tabulator 컬럼 정의 */
const gridOptions = {
  layout: 'fitColumns',
  selectableRows: true,
  selectableRowsRangeMode: 'none'
};

const columns: any[] = [
  {
    formatter: 'rowSelection',
    titleFormatter: 'rowSelection',
    width: 50,
    hozAlign: 'center',
    headerSort: false
  },
  { title: 'ID', field: 'userId', width: 80, sorter: 'number' },
  { title: '사번', field: 'userNo', sorter: 'string' },
  { title: '이름', field: 'name', sorter: 'string' },
  { title: '이메일', field: 'email', sorter: 'string' },
  { title: '입사일', field: 'hireDate', sorter: 'number' },
  { title: '부서', field: 'departmentName', sorter: 'string' },
  { title: '직급', field: 'positionName', sorter: 'string' },
  {
    title: '재직',
    field: 'activeYn',
    width: 90,
    hozAlign: 'center',
    headerSort: false,
    formatter: (cell: any) => {
      const v = cell.getValue();
      const text = v === 'Y' ? '재직' : '퇴사';
      const cls = v === 'Y' ? 'badge active' : 'badge inactive';
      return `<span class="${cls}">${text}</span>`; // HTML 형식으로 DOM 로드 가능.
    }
  },
  {
    title: 'DM',
    hozAlign: 'center',
    width: 90,
    headerSort: false,
    formatter: () => {
      // return `<button class="p-button p-button-sm p-button-text">DM</button>`;
      return '[ 클릭 ]';
    },
    cellClick: (_e: any, cell: any) => {
      const row = cell.getRow().getData();
      const peeruserNo = row.userNo;
      const activeYn = row.activeYn;
      dmValidation(peeruserNo, activeYn);
    }
  }
];

/** DM 페이지 이동 벨리데이션 */
const dmValidation = async (peeruserNo: string, activeYn: string) => {
  let userInfo = localStorage.getItem('userInfo');
  const paserInfo = JSON.parse(userInfo ?? '{}');

  if (paserInfo.userNo === peeruserNo) {
    await openAlert('자신에게는 DM을 보낼 수 없습니다.');
    return;
  } else if (activeYn === 'N') {
    await openAlert('퇴사자에게는 DM을 보낼 수 없습니다.');
    return;
  } else {
    router.push(`/dm?peer=${peeruserNo}`); // DM 페이지로 이동 + 상대 userId 전달
  }
};

/** 직원추가 handler */
const addEmployee = () => {
  showCreateModal.value = true;
};

/** 직원목록 조회 handler */
const loadEmployees = async () => {
  try {
    const res = await fetchEmployeesByCondition(searchForm.value);
    employees.value = res.data;
    // 데이터 갱신 시 선택은 초기화해주는게 안전(버튼 활성화/선택 혼선 방지)
    checkedIds.value = [];
    gridTable.value?.deselectRow?.();
    // toast.add({ severity: 'success', summary: '요청완료', detail: '조회가 완료되었습니다.', life: 3000 });
  } catch (e: any) {
    // 만료/에러 시 기존 데이터 제거(착시 방지)
    employees.value = [];
    checkedIds.value = [];
    gridTable.value?.deselectRow?.();
    // toast.add({ severity: 'error', summary: '요청실패', detail: '조회가 실패하였습니다. 관리자에게 문의하세요.', life: 3000 });
  }
};

/** 퇴사처리 handler */
const retire = async () => {
  if (checkedIds.value.length === 0) return;

  const selectedEmployees = employees.value.filter((e) => checkedIds.value.includes(e.userId));

  const inactiveList = selectedEmployees.filter((e) => e.activeYn === 'N');
  const activeList = selectedEmployees.filter((e) => e.activeYn === 'Y');

  if (inactiveList.length > 0) {
    const okInactive = await openConfirm(`선택한 ${inactiveList.length}명은 이미 퇴사상태입니다.\n재직자 ${activeList.length}명만 퇴사처리를 하시겠습니까?`);
    if (!okInactive) return;
  }

  if (activeList.length === 0) {
    await openConfirm('퇴사처리할 재직자가 없습니다.');
    return;
  }

  const ok = await openConfirm('선택한 재직자를 퇴사처리하시겠습니까?');
  if (!ok) return;

  const targetIds = activeList.map((e) => e.userId);
  await retireEmployees(targetIds);

  await openAlert('퇴사처리가 완료되었습니다.');
  // toast.add({ severity: 'success', summary: '요청완료', detail: '퇴사처리가 완료되었습니다.', life: 3000 });

  checkedIds.value = [];
  gridTable.value?.deselectRow?.();
  await loadEmployees();
};

/** 복직처리 handler */
const restore = async () => {
  if (checkedIds.value.length === 0) return;

  const selectedEmployees = employees.value.filter((e) => checkedIds.value.includes(e.userId));

  const inactiveList = selectedEmployees.filter((e) => e.activeYn === 'Y');
  const activeList = selectedEmployees.filter((e) => e.activeYn === 'N');

  if (inactiveList.length > 0) {
    const okInactive = await openConfirm(`선택한 ${inactiveList.length}명은 이미 재직상태입니다.\n퇴사자 ${activeList.length}명만 복직처리를 하시겠습니까?`);
    if (!okInactive) return;
  }

  if (activeList.length === 0) {
    await openConfirm('복직처리할 퇴사자가 없습니다.');
    return;
  }

  const ok = await openConfirm('선택한 퇴사자를 복직처리하시겠습니까?');
  if (!ok) return;

  const targetIds = activeList.map((e) => e.userId);
  await restoreEmployees(targetIds);

  await openAlert('복직처리가 완료되었습니다.');
  // toast.add({ severity: 'success', summary: '요청완료', detail: '복직처리가 완료되었습니다.', life: 3000 });

  checkedIds.value = [];
  gridTable.value?.deselectRow?.();
  await loadEmployees();
};

/** 검색 조건 */
const searchForm = ref({
  userNo: '',
  name: '',
  hireDate: '',
  activeYn: '' as '' | 'Y' | 'N'
});

/** 조회 버튼 */
const searchEmployees = async () => {
  await loadEmployees();
};

/** 초기화 버튼 */
const resetSearch = async () => {
  searchForm.value = { userNo: '', name: '', hireDate: '', activeYn: '' };

  // 초기화 시 선택도 같이 초기화(UX 안정)
  checkedIds.value = [];
  gridTable.value?.deselectRow?.();

  // 필요하면 즉시 조회:
  // await loadEmployees()
};

const submitEmployee = async (form: any) => {
  // await createEmployee(form)
  await openAlert('직원이 등록되었습니다.');
  showCreateModal.value = false;
  await loadEmployees();
};

const cancelCreate = () => {
  showCreateModal.value = false;
};

onMounted(() => {
  loadEmployees();
});
</script>

<!-- 탬플릿 Area -->
<template>
  <div class="card">
    <div class="font-semibold text-xl mb-4">직원관리</div>
    <div class="custom-content">
      <!-- 검색 영역 -->
      <div class="search-bar">
        <div class="form-grid cols-4">
          <div class="flex flex-col gap-1">
            <label for="userNo">사번</label>
            <ElInputText v-model="searchForm.userNo" type="text" placeholder="사번을 입력하세요." />
          </div>
          <div class="flex flex-col gap-1">
            <label for="name">이름</label>
            <ElInputText v-model="searchForm.name" type="text" placeholder="이름을 입력하세요." />
          </div>
          <div class="flex flex-col gap-1">
            <label for="activeYn">재직여부</label>
            <ElSelectBox v-model="searchForm.activeYn" :options="activeOptions" class="w-full"></ElSelectBox>
          </div>
          <div class="flex flex-col gap-1">
            <label for="hireDate">입사일</label>
            <ElDatePicker v-model="searchForm.hireDate" />
          </div>
        </div>
        <div class="search-actions">
          <ElButton type="primary" @click="searchEmployees"> 조회 </ElButton>
          <ElButton type="secondary" @click="resetSearch"> 초기화 </ElButton>
        </div>
      </div>

      <!-- 컨텐츠영역>제목/버튼 -->
      <div class="header-bar">
        <div class="action-bar">
          <ElButton type="primary" @click="addEmployee"> 직원 추가 </ElButton>
          <ElButton type="danger" :disabled="checkedIds.length === 0 || loadingStore.isLoading" @click="retire"> 퇴사 처리 </ElButton>
          <ElButton type="success" :disabled="checkedIds.length === 0 || loadingStore.isLoading" @click="restore"> 복직 처리 </ElButton>
        </div>
      </div>

      <!-- 공통 Tabulator Grid -->
      <ElTabulatorGrid :data="employees" :columns="columns" :options="gridOptions" index-field="userId" height="475px" @ready="onGridReady" @selection-change="onSelectionChange" />
    </div>
  </div>
  <EmployeeCreatePopup v-if="showCreateModal" @submit="submitEmployee" @cancel="cancelCreate" />
</template>
