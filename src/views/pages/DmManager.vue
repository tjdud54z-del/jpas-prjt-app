<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

import DmModal from '@/components/dm/DmModal.vue'
import DmModalPanel from '@/components/dm/DmModalPanel.vue'
import DmConversationList from './DmConversationList.vue'

import { openConversation } from '@/api/dmApi'
import { useAlert } from '@/composables/useAlert'
import { useDmClient } from '@/composables/useDmClient'
import { useDmStore } from '@/store/dmStore'

// ===============================
// 공통 모달창
// ===============================
const { openAlert } = useAlert()

// ===============================
// 로그인 사용자
// ===============================
const userInfo = JSON.parse(localStorage.getItem('userInfo') ?? '{}')
const myUserId: number = Number(userInfo.userId)
const myUserNo: string = userInfo.userNo

// ===============================
// 상태
// ===============================
const dmOpen = ref(false)
const activeConversationId = ref<number | null>(null)
const peerUserNo = ref<string>('') // 목록 클릭 시 사용
const peerUserId = ref<number>(0)

// [추가] 유저 ID 입력값
const inputUserId = ref<number | null>(null)

// ===============================
// Store / Socket
// ===============================
const store = useDmStore()
const { connect, disconnect, connected } = useDmClient()

// ===============================
// DM 목록 클릭 → 대화방 열기 (기존 로직)
// ===============================
const onOpenFromList = async (item: { conversationId: number; peerUserNo: string; peerUserId: number }) => {
  const conversationId = item.conversationId
  if (!conversationId) return

  activeConversationId.value = conversationId
  peerUserNo.value = item.peerUserNo
  peerUserId.value = item.peerUserId

  store.setActiveConversation(conversationId)
  await store.fetchMessages(conversationId)

  dmOpen.value = true
}

// ===============================
// 유저 ID로 대화방 열기 (없으면 생성)
// ===============================
const onCreateByUserId = async () => {
  if (!inputUserId.value) {
    await openAlert('사용자 ID를 입력하세요.')
    return
  }

  try {
    // 서버에서: 있으면 기존 방 / 없으면 신규 방 생성
    const res = await openConversation({
      senderId: myUserId,
      receiverId: inputUserId.value
    })

    const conversationId = res.data.conversationId

    activeConversationId.value = conversationId
    peerUserId.value = inputUserId.value
    peerUserNo.value = '' // 필요 시 추가 조회

    store.setActiveConversation(conversationId)
    await store.fetchMessages(conversationId)

    dmOpen.value = true

    // 입력값 초기화 (선택)
    inputUserId.value = null
  } catch (e) {
    console.error(e)
    alert('대화방을 열 수 없습니다.')
  }
}

// ===============================
// DM 모달 닫힐 때 목록 1회 갱신
// ===============================
watch(dmOpen, (open) => {
  if (!open) {
    store.triggerConversationListReload()
  }
})

// ===============================
// WebSocket
// ===============================
onMounted(() => {
  connect((msg) => {
    if (msg.senderUserId === myUserId) return
    if (!msg.conversationId) return

    store.addMessage(msg)
  })
})

onUnmounted(() => {
  disconnect()
})
</script>

<template>
  <div class="dm-manager">
    <!-- 유저 ID로 DM 생성 -->
    <div class="dm-create">
      <input v-model.number="inputUserId" type="number" placeholder="사용자 ID를 입력하세요." class="dm-create__input" />
      <button class="dm-create__btn" @click="onCreateByUserId">대화방 만들기</button>
    </div>

    <!-- DM 목록 -->
    <DmConversationList @open="onOpenFromList" />

    <!-- DM 모달 -->
    <DmModal v-model:open="dmOpen">
      <DmModalPanel v-if="activeConversationId" :connected="connected" :myUserId="myUserId" :myUserNo="myUserNo" :peerUserNo="peerUserNo" :peerUserId="peerUserId" :conversationId="activeConversationId" @update:open="dmOpen = $event" />
    </DmModal>
  </div>
</template>

<style scoped>
.dm-manager {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 유저 ID 입력 영역 */
.dm-create {
  display: flex;
  gap: 8px;
}

.dm-create__input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.dm-create__btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: #2563eb;
  color: #fff;
  cursor: pointer;
}
</style>
