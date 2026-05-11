<script setup lang="ts">
/** 임포트 컴포넌트 */
import { fetchUsersByCondition, restoreUsers, retireUsers } from '@/api/userApi'
import ElButton from '@/components/common/ElButton.vue'
import ElDatePicker from '@/components/common/ElDatePicker.vue'
import ElInputText from '@/components/common/ElInputText.vue'
import ElSelectBox from '@/components/common/ElSelectBox.vue'
import ElTabulatorGrid from '@/components/common/ElTabulatorGrid.vue'
import { useAlert } from '@/composables/useAlert'
import { useConfirm } from '@/composables/useConfirm'
import { useLoadingStore } from '@/store/loadingStore'
import UserCreatePopup from '@/views/popups/UserCreatePopup.vue'
// import { useToast } from 'primevue/usetoast';
import { onMounted, ref } from 'vue'

/** 유저 조회 인터페이스 */
interface User {
  userId: number
  userNo: string
  name: string
  addressMain: string
  addressSub: string
  activeYn: 'Y' | 'N'
}

import { useRouter } from 'vue-router'

const router = useRouter()

/** 모달 메세지창 */
const { openConfirm } = useConfirm()
const { openAlert } = useAlert()

// const toast = useToast();

/** 유저 추가 모달 표시 여부 */
const showCreateModal = ref(false)

/** 데이터/선택 */
const users = ref<User[]>([])
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
  checkedIds.value = rows.map((r) => r.userId)
}

const activeOptions = [
  { label: '정상', value: 'Y' },
  { label: '탈퇴', value: 'N' }
]

const genderOptions = [
  { label: '남성', value: 'M' },
  { label: '여성', value: 'W' }
]

/** Tabulator 컬럼 정의 */
const gridOptions = {
  layout: 'fitColumns',
  selectableRows: true,
  selectableRowsRangeMode: 'none'
}

const columns: any[] = [
  {
    formatter: 'rowSelection',
    titleFormatter: 'rowSelection',
    width: 50,
    hozAlign: 'center',
    headerSort: false
  },
  { title: 'ID', field: 'userId', width: 80, sorter: 'number' },
  { title: '유저ID', field: 'userNo', sorter: 'string' },
  { title: '이름', field: 'name', sorter: 'string' },
  { title: '이메일', field: 'email', sorter: 'string' },
  { title: '생년월일', field: 'birthDate', sorter: 'number' },
  { title: '성별', field: 'genderFlag', sorter: 'string' },
  { title: '전화번호', field: 'phoneNumber', sorter: 'string' },
  { title: '메인주소', field: 'addressMain', sorter: 'string' },
  { title: '상세주소', field: 'addressSub', sorter: 'string' },
  {
    title: '탈퇴여부',
    field: 'activeYn',
    width: 90,
    hozAlign: 'center',
    headerSort: false,
    formatter: (cell: any) => {
      const v = cell.getValue()
      const text = v === 'Y' ? '정상' : '탈퇴'
      const cls = v === 'Y' ? 'badge active' : 'badge inactive'
      return `<span class="${cls}">${text}</span>` // HTML 형식으로 DOM 로드 가능.
    }
  }
  // {
  //   title: 'DM',
  //   hozAlign: 'center',
  //   width: 90,
  //   headerSort: false,
  //   formatter: () => {
  //     // return `<button class="p-button p-button-sm p-button-text">DM</button>`;
  //     return '[ 클릭 ]'
  //   },
  //   cellClick: (_e: any, cell: any) => {
  //     const row = cell.getRow().getData()
  //     const peeruserNo = row.userNo
  //     const activeYn = row.activeYn
  //     dmValidation(peeruserNo, activeYn)
  //   }
  // }
]

/** DM 페이지 이동 벨리데이션 */
const dmValidation = async (peeruserNo: string, activeYn: string) => {
  let userInfo = localStorage.getItem('userInfo')
  const paserInfo = JSON.parse(userInfo ?? '{}')

  if (paserInfo.userNo === peeruserNo) {
    await openAlert('자신에게는 DM을 보낼 수 없습니다.')
    return
  } else if (activeYn === 'N') {
    await openAlert('탈퇴자에게는 DM을 보낼 수 없습니다.')
    return
  } else {
    router.push(`/dm?peer=${peeruserNo}`) // DM 페이지로 이동 + 상대 userId 전달
  }
}

/** 유저 handler */
const addUser = () => {
  // showCreateModal.value = true
  router.push('/users/create')
}

/** 유저목록 조회 handler */
const loadUsers = async () => {
  try {
    const res = await fetchUsersByCondition(searchForm.value)
    users.value = res.data
    // 데이터 갱신 시 선택은 초기화해주는게 안전(버튼 활성화/선택 혼선 방지)
    checkedIds.value = []
    gridTable.value?.deselectRow?.()
    // toast.add({ severity: 'success', summary: '요청완료', detail: '조회가 완료되었습니다.', life: 3000 });
  } catch (e: any) {
    // 만료/에러 시 기존 데이터 제거(착시 방지)
    users.value = []
    checkedIds.value = []
    gridTable.value?.deselectRow?.()
    // toast.add({ severity: 'error', summary: '요청실패', detail: '조회가 실패하였습니다. 관리자에게 문의하세요.', life: 3000 });
  }
}

/** 탈퇴처리 handler */
const retire = async () => {
  if (checkedIds.value.length === 0) return

  const selectedUsers = users.value.filter((e) => checkedIds.value.includes(e.userId))

  const inactiveList = selectedUsers.filter((e) => e.activeYn === 'N')
  const activeList = selectedUsers.filter((e) => e.activeYn === 'Y')

  if (inactiveList.length > 0) {
    const okInactive = await openConfirm(`선택한 ${inactiveList.length}명은 이미 탈퇴상태입니다.\n유저 ${activeList.length}명만 탈퇴처리를 하시겠습니까?`)
    if (!okInactive) return
  }

  if (activeList.length === 0) {
    await openConfirm('탈퇴처리할 유저가 없습니다.')
    return
  }

  const ok = await openConfirm('선택한 유저를 탈퇴처리하시겠습니까?')
  if (!ok) return

  const targetIds = activeList.map((e) => e.userId)
  await retireUsers(targetIds)

  await openAlert('탈퇴처리가 완료되었습니다.')
  // toast.add({ severity: 'success', summary: '요청완료', detail: '탈퇴처리가 완료되었습니다.', life: 3000 });

  checkedIds.value = []
  gridTable.value?.deselectRow?.()
  await loadUsers()
}

/** 복구처리 handler */
const restore = async () => {
  if (checkedIds.value.length === 0) return

  const selectedUsers = users.value.filter((e) => checkedIds.value.includes(e.userId))

  const inactiveList = selectedUsers.filter((e) => e.activeYn === 'Y')
  const activeList = selectedUsers.filter((e) => e.activeYn === 'N')

  if (inactiveList.length > 0) {
    const okInactive = await openConfirm(`선택한 ${inactiveList.length}명은 이미 재직상태입니다.\n탈퇴자 ${activeList.length}명만 복구처리를 하시겠습니까?`)
    if (!okInactive) return
  }

  if (activeList.length === 0) {
    await openConfirm('복구처리할 탈퇴자가 없습니다.')
    return
  }

  const ok = await openConfirm('선택한 탈퇴자를 복구처리하시겠습니까?')
  if (!ok) return

  const targetIds = activeList.map((e) => e.userId)
  await restoreUsers(targetIds)

  await openAlert('복구처리가 완료되었습니다.')
  // toast.add({ severity: 'success', summary: '요청완료', detail: '복구처리가 완료되었습니다.', life: 3000 });

  checkedIds.value = []
  gridTable.value?.deselectRow?.()
  await loadUsers()
}

/** 검색 조건 */
const searchForm = ref({
  userNo: '',
  name: '',
  birthDate: '',
  activeYn: '' as '' | 'Y' | 'N'
})

/** 조회 버튼 */
const searchUsers = async () => {
  await loadUsers()
}

/** 초기화 버튼 */
const resetSearch = async () => {
  searchForm.value = { userNo: '', name: '', birthDate: '', activeYn: '' }

  // 초기화 시 선택도 같이 초기화(UX 안정)
  checkedIds.value = []
  gridTable.value?.deselectRow?.()

  // 필요하면 즉시 조회:
  // await loadUsers()
}

const submitUser = async (form: any) => {
  // await createUser(form)
  await openAlert('유저가 등록되었습니다.')
  showCreateModal.value = false
  await loadUsers()
}

const cancelCreate = () => {
  showCreateModal.value = false
}

onMounted(() => {
  loadUsers()
})
</script>

<!-- 탬플릿 Area -->
<template>
  <div class="card">
    <div class="font-semibold text-xl mb-4">유저 List</div>
    <div class="custom-content">
      <!-- 검색 영역 -->
      <div class="search-bar">
        <div class="form-grid cols-4">
          <div class="flex flex-col gap-1">
            <label for="userNo">유저ID</label>
            <ElInputText 
              v-model="searchForm.userNo" 
              size="md"
              type="text" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="name">이름</label>
            <ElInputText 
              v-model="searchForm.name" 
              size="md" 
              type="text" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="activeYn">탈퇴여부</label>
            <ElSelectBox 
              v-model="searchForm.activeYn" 
              size="md" 
              :options="activeOptions" 
              class="w-full" />
          </div>
          <div class="flex flex-col gap-1">
            <label for="birthDate">생년월일</label>
            <ElDatePicker 
              v-model="searchForm.birthDate" 
              size="md" 
              showMonthYearSelect 
              clearable />
          </div>
        </div>
        <div class="search-actions">
          <ElButton 
            type="primary" 
            size="md" 
            @click="searchUsers"
            label="조회" />
          <ElButton 
            type="secondary" 
            size="md" 
            @click="resetSearch"
            label="초기화" />
        </div>
      </div>
      <!-- 컨텐츠영역>제목/버튼 -->
      <div class="header-bar">
        <div class="action-bar">
          <ElButton 
            type="primary" 
            size="md" 
            @click="addUser"
            label="등록" />
          <ElButton 
            type="danger" 
            size="md" 
            :disabled="checkedIds.length === 0 || loadingStore.isLoading" 
            @click="retire"
            label="탈퇴" />
          <ElButton 
            type="success" 
            size="md" 
            :disabled="checkedIds.length === 0 || loadingStore.isLoading" 
            @click="restore" 
            label="복구" />
        </div>
      </div>
      <!-- 공통 Tabulator Grid -->
      <ElTabulatorGrid 
        :data="users" 
        :columns="columns" 
        :options="gridOptions" 
        index-field="userId" 
        height="475px" 
        @ready="onGridReady" 
        @selection-change="onSelectionChange" />
    </div>
  </div>
  <!-- 유저등록 Popup -->
  <UserCreatePopup 
    v-if="showCreateModal" 
    @submit="submitUser" 
    @cancel="cancelCreate" />
</template>
