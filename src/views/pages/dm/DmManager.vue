<script setup lang="ts">
import DmModal from '@/components/dm/DmModal.vue'
import DmModalPanel from '@/components/dm/DmModalPanel.vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import DmConversationList from './DmConversationList.vue'

import { markConversationRead, openConversation } from '@/api/dmApi'
import { fetchUsersByCondition, type User } from '@/api/userApi'
import { useDmClient } from '@/composables/useDmClient'
import { useDmStore } from '@/store/dmStore'

/** =========================
 * 로그인 사용자
 * ========================= */
const currentUser = computed(() => {
  const raw = localStorage.getItem('userInfo')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (parsed?.userId) return parsed
    if (parsed?.userInfo && typeof parsed.userInfo === 'string') return JSON.parse(parsed.userInfo)
    return parsed
  } catch {
    return null
  }
})

const myUserId = computed(() => Number(currentUser.value?.userId || 0))
const myUserNo = computed(() => String(currentUser.value?.userNo || ''))

/** =========================
 * 상태
 * ========================= */
const dmOpen = ref(false)
const activeConversationId = ref<number | null>(null)
const peerUserNo = ref('')
const peerUserId = ref<number>(0)

const store = useDmStore()
const { connect, disconnect, connected } = useDmClient()

/** =========================
 * ✅ 유저 검색 (실시간 + debounce)
 * ========================= */
const searchKeyword = ref('')
const searching = ref(false)
const searchResults = ref<User[]>([])
const showResults = ref(false)

// ✅ debounce timer
let searchTimer: any = null

// ✅ 검색 UI 초기화
const resetSearchUi = () => {
  searchResults.value = []
  showResults.value = false
}

/** ✅ 실제 검색 API */
const onSearchUsers = async () => {
  const kw = searchKeyword.value?.trim()

  if (!kw || kw.length < 2) {
    resetSearchUi()
    return
  }

  searching.value = true

  try {
    const res = await fetchUsersByCondition({
      userNoOrName: kw,
      activeYn: 'Y'
    })

    searchResults.value = res.data ?? []
    showResults.value = true
  } catch (e) {
    console.error(e)
    resetSearchUi()
  } finally {
    searching.value = false
  }
}

/** ✅ debounce */
const debounceSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)

  searchTimer = setTimeout(() => {
    onSearchUsers()
  }, 400)
}

/** ✅ 실시간 검색 watch */
watch(searchKeyword, (val) => {
  const kw = val?.trim()

  if (!kw || kw.length < 2) {
    resetSearchUi()
    return
  }

  debounceSearch()
})

/** ✅ Enter / ESC */
const onKeydownSearch = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (searchTimer) clearTimeout(searchTimer)
    onSearchUsers()
  } else if (e.key === 'Escape') {
    resetSearchUi()
  }
}

/** ✅ 프로필 이미지 */
const getProfileImg = (genderFlag?: string, path?: string) => {
  if (!path) {
    if (genderFlag === 'M') return 'http://localhost:8080/uploads/basicM.jpg'
    if (genderFlag === 'W') return 'http://localhost:8080/uploads/basicW.jpg'
  }
  return `http://localhost:8080${path}?t=${Date.now()}`
}

/** ✅ 유저 선택 */
const onPickUser = async (u: User) => {
  if (!u?.userId) return
  if (Number(u.userId) === Number(myUserId.value)) {
    alert('본인과는 대화를 시작할 수 없습니다.')
    return
  }

  try {
    const oc = await openConversation({
      senderId: myUserId.value,
      receiverId: u.userId
    })

    const cid = oc.data?.conversationId
    if (!cid) return

    activeConversationId.value = cid
    peerUserId.value = u.userId
    peerUserNo.value = u.userNo

    store.setActiveConversation(cid)
    await store.fetchMessages(cid)

    dmOpen.value = true

    searchKeyword.value = ''
    resetSearchUi()
  } catch (e) {
    console.error(e)
  }
}

/** =========================
 * 목록에서 열기
 * ========================= */
const onOpenFromList = async (item: any) => {
  activeConversationId.value = item.conversationId
  peerUserNo.value = item.peerUserNo
  peerUserId.value = item.peerUserId

  store.setActiveConversation(item.conversationId)
  await store.fetchMessages(item.conversationId)

  dmOpen.value = true
}

/** =========================
 * WebSocket
 * ========================= */
onMounted(() => {
  connect((msg) => {
    if (String(msg.senderUserId) === String(myUserId.value)) return
    store.addMessage(msg)

    if (store.activeConversationId === msg.conversationId) {
      markConversationRead(msg.conversationId, myUserId.value)
    }
  })
})

onUnmounted(() => {
  disconnect()
})

watch(dmOpen, (open) => {
  if (!open) store.triggerConversationListReload()
})

/** ✅ 외부 클릭 시 닫기 */
const searchBoxRef = ref<HTMLElement | null>(null)

const handleClickOutside = (e: MouseEvent) => {
  if (!searchBoxRef.value?.contains(e.target as Node)) {
    showResults.value = false
  }
}

const onClickSearchBtn = () => {
  if (searchTimer) clearTimeout(searchTimer) // ✅ debounce 취소
  onSearchUsers() // 즉시 검색
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div class="dm-manager">
    <div ref="searchBoxRef" class="dm-create">
      <div class="search-wrapper">
        <div class="search-box">
          <span class="icon">🔍</span>
          <input
            v-model="searchKeyword"
            class="search-input"
            placeholder="이름 또는 사번으로 검색 (2글자 이상)"
            @keydown="onKeydownSearch"
            @focus="searchResults.length ? (showResults = true) : null" />
          <button
            v-if="searchKeyword"
            class="clear-btn"
            @click="searchKeyword=''; resetSearchUi()">
            ✖
          </button>
          <button
            class="search-btn"
            :disabled="searching"
            @click="onClickSearchBtn">
            검색
          </button>
          <span v-if="searching" class="loading">⏳</span>
        </div>
        <Transition name="dropdown">
          <div v-if="showResults" class="dm-search-dropdown">
            <div v-if="searchResults.length === 0" class="empty">
              검색 결과가 없습니다
            </div>
            <button
              v-for="u in searchResults"
              :key="u.userId"
              class="dm-search-item"
              @click="onPickUser(u)">
              <img
                class="avatar"
                :src="getProfileImg(u.genderFlag, u.profileImagePath)"/>
              <div class="body">
                <div class="name">{{ u.name }}</div>
                <div class="sub">{{ u.userNo }}</div>
              </div>
            </button>
          </div>
        </Transition>
      </div>
    </div>
    <!-- 대화 목록 -->
    <DmConversationList @open="onOpenFromList" />
    <!-- DM -->
    <DmModal v-model:open="dmOpen">
      <DmModalPanel
        v-if="activeConversationId"
        :connected="connected"
        :my-user-id="myUserId"
        :my-user-no="myUserNo"
        :peer-user-id="peerUserId"
        :peer-user-no="peerUserNo"
        :conversation-id="activeConversationId"
      />
    </DmModal>
  </div>
</template>

<style scoped>
.dm-manager {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* =========================
 * 검색 영역
 * ========================= */
.dm-create {
  position: relative;
  display: flex;
}

/* 검색 박스 */
.search-box {
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 6px 10px;
  background: #fff;
}

/* 입력창 */
.search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 6px;
  font-size: 14px;
}

/* 🔍 아이콘 */
.icon {
  margin-right: 6px;
  font-size: 14px;
  color: #9ca3af;
}

/* ❌ clear 버튼 */
.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 13px;
  color: #9ca3af;
  margin-left: 4px;
}

.clear-btn:hover {
  color: red;
}

/* ⏳ 로딩 */
.loading {
  margin-left: 6px;
  font-size: 12px;
  color: #6b7280;
}

/* =========================
 * 검색 결과 dropdown
 * ========================= */
/* ✅ wrapper 기준점 */
.search-wrapper {
  position: relative;
  width: 100%;
}

/* ✅ dropdown 위치 고정 */
.dm-search-dropdown {
  position: absolute;
  top: 44px; /* input 바로 아래 */
  left: 0;
  width: 100%;
}

/* 결과 없음 */
.empty {
  padding: 12px;
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
}

/* 검색 아이템 */
.dm-search-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border: none;
  background: #fff;
  cursor: pointer;
  text-align: left;
}

.dm-search-item:hover {
  background: #f9fafb;
}

/* 프로필 */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid #e5e7eb;
}

/* 텍스트 */
.body {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.sub {
  font-size: 12px;
  color: #6b7280;
}

.search-btn {
  margin-left: 6px;
  padding: 5px 10px;
  font-size: 12px;
  border-radius: 6px;
  border: none;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* =========================
 * 스크롤 개선 (선택)
 * ========================= */
.dm-search-dropdown::-webkit-scrollbar {
  width: 6px;
}

.dm-search-dropdown::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 6px;
}

.dm-search-dropdown::-webkit-scrollbar-track {
  background: transparent;
}


/* =========================
 * dropdown 애니메이션
 * ========================= */

/* 등장 시작 */
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

/* 등장 완료 */
.dropdown-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* 등장 지속 */
.dropdown-enter-active {
  transition: all 0.18s ease-out;
}

/* 사라질 때 시작 */
.dropdown-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* 사라질 때 끝 */
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* 사라질 때 */
.dropdown-leave-active {
  transition: all 0.12s ease-in;
}
</style>