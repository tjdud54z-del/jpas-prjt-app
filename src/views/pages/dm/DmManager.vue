<script setup lang="ts">
import DmModal from '@/components/dm/DmModal.vue'
import DmModalPanel from '@/components/dm/DmModalPanel.vue'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import DmConversationList from './DmConversationList.vue'

import { markConversationRead, openConversation } from '@/api/dmApi'
import { fetchUsersByCondition, type User } from '@/api/userApi'
import { useDmClient } from '@/composables/useDmClient'
import { useDmStore } from '@/store/dmStore'

/** 로그인 사용자 */
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

/** 상태 */
const dmOpen = ref(false)
const activeConversationId = ref<number | null>(null)
const peerUserNo = ref('')
const peerUserId = ref<number>(0)

const store = useDmStore()
const { connect, disconnect, connected } = useDmClient()

/** =========================
 * 검색 (실시간 + 버튼 + debounce)
 * ========================= */
const searchKeyword = ref('')
const searching = ref(false)
const searchResults = ref<User[]>([])
const showResults = ref(false)

let searchTimer: any = null

const resetSearchUi = () => {
  searchResults.value = []
  showResults.value = false
}

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

const debounceSearch = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(onSearchUsers, 400)
}

watch(searchKeyword, (val) => {
  const kw = val?.trim()
  if (!kw || kw.length < 2) {
    resetSearchUi()
    return
  }
  debounceSearch()
})

const onKeydownSearch = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (searchTimer) clearTimeout(searchTimer)
    onSearchUsers()
  } else if (e.key === 'Escape') {
    resetSearchUi()
  }
}

const onClickSearchBtn = () => {
  if (searchTimer) clearTimeout(searchTimer)
  onSearchUsers()
}

/** 프로필 이미지 */
const getProfileImg = (genderFlag?: string, path?: string) => {
  if (!path) {
    if (genderFlag === 'M') return 'http://localhost:8080/uploads/basicM.jpg'
    if (genderFlag === 'W') return 'http://localhost:8080/uploads/basicW.jpg'
  }
  return `http://localhost:8080${path}?t=${Date.now()}`
}

/** 유저 선택 */
const onPickUser = async (u: User) => {
  if (!u?.userId || Number(u.userId) === Number(myUserId.value)) return

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
}

/** 채팅방 열기 */
const onOpenFromList = async (item: any) => {
  activeConversationId.value = item.conversationId
  peerUserNo.value = item.peerUserNo
  peerUserId.value = item.peerUserId

  store.setActiveConversation(item.conversationId)
  await store.fetchMessages(item.conversationId)

  dmOpen.value = true
}

/** WebSocket */
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

/** 외부 클릭 닫기 */
const searchBoxRef = ref<HTMLElement | null>(null)

const handleClickOutside = (e: MouseEvent) => {
  if (!searchBoxRef.value?.contains(e.target as Node)) {
    showResults.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <div class="dm-manager">

    <!-- 좌우 레이아웃 -->
    <div class="dm-header-row">

      <!-- 왼쪽 채팅 리스트 -->
      <div class="dm-left">
        <DmConversationList @open="onOpenFromList" />
      </div>

      <!-- 오른쪽 검색 -->
      <div ref="searchBoxRef" class="dm-right">

        <div class="search-wrapper">

          <div class="search-box">
            <span class="icon">🔍</span>

            <input
              v-model="searchKeyword"
              class="search-input"
              placeholder="이름 또는 ID를 입력하세요."
              @keydown="onKeydownSearch"
            />

            <button
              v-if="searchKeyword"
              class="clear-btn"
              @click="searchKeyword=''; resetSearchUi()"
            >
              ✖
            </button>

            <button
              class="search-btn"
              :disabled="searching"
              @click="onClickSearchBtn"
            >
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
                @click="onPickUser(u)"
              >
                <img
                  class="avatar"
                  :src="getProfileImg(u.genderFlag, u.profileImagePath)"
                />

                <div class="body">
                  <div class="name">{{ u.name }}</div>
                  <div class="sub">{{ u.userNo }}</div>
                </div>
              </button>

            </div>
          </Transition>
        </div>

      </div>

    </div>

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
.dm-header-row {
  display: flex;
  gap: 12px;
}

.dm-left {
  flex: 1;   /* 채팅 많이 보여주기 */
}

.dm-right {
  flex: 10;   /* 검색 적당히 */
}

.search-wrapper {
  position: relative;
}

.search-box {
  width: 100%;
  display: flex;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 6px 10px;
  background-color: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: #111827;
}

.icon {
  margin-right: 6px;
}

.clear-btn {
  background: none;
  border: none;
  cursor: pointer;
}

.search-btn {
  margin-left: 6px;
  padding: 5px 10px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
}

.dm-search-dropdown {
  position: absolute;
  top: 44px;
  width: 100%;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  max-height: 760px;
  overflow-y: auto;
  z-index: 10;
}

.dm-search-dropdown::-webkit-scrollbar {
  width: 6px;
}

.dm-search-dropdown::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 6px;
}

.dm-search-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  width: 100%;
  text-align: left;
  background: #fff;
}

.dm-search-item:hover {
  background: #f9fafb;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

/* 애니메이션 */
.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.dropdown-enter-to {
  opacity: 1;
  transform: translateY(0);
}
.dropdown-enter-active {
  transition: 0.18s;
}
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.dropdown-leave-active {
  transition: 0.1s;
}
</style>