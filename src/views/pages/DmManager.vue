<script setup lang="ts">
import DmModal from '@/components/dm/DmModal.vue'
import DmModalPanel from '@/components/dm/DmModalPanel.vue'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import DmConversationList from './DmConversationList.vue'

import { markConversationRead } from '@/api/dmApi'
import { useDmClient } from '@/composables/useDmClient'
import { useDmStore } from '@/store/dmStore'

// 로그인 사용자
const userInfo = JSON.parse(localStorage.getItem('userInfo') ?? '{}')
const myUserId = Number(userInfo.userId)
const myUserNo = userInfo.userNo

// 상태
const dmOpen = ref(false)
const activeConversationId = ref<number | null>(null)
const peerUserNo = ref('')
const peerUserId = ref<number>(0)

// Store / Socket
const store = useDmStore()
const { connect, disconnect, connected } = useDmClient()

// 목록 클릭 → 대화방 열기
const onOpenFromList = async (item: any) => {
  if (!item.conversationId) return

  activeConversationId.value = item.conversationId
  peerUserNo.value = item.peerUserNo
  peerUserId.value = item.peerUserId

  store.setActiveConversation(item.conversationId)
  await store.fetchMessages(item.conversationId)

  dmOpen.value = true
}

// WebSocket 연결 (DM 수신 + 즉시 읽음 처리)
onMounted(() => {
  connect((msg) => {
    // 내가 보낸 메시지는 제외
    if (String(msg.senderUserId) === String(myUserId)) return

    // 메시지 추가
    store.addMessage(msg)

    // 현재 열려 있는 대화방이면 즉시 읽음 처리
    if (store.activeConversationId === msg.conversationId) {
      markConversationRead(msg.conversationId, myUserId)
    }
  })
})

onUnmounted(() => {
  disconnect()
})

// 모달 닫힐 때 목록 갱신
watch(dmOpen, (open) => {
  if (!open) {
    store.triggerConversationListReload()
  }
})
</script>

<template>
  <div class="dm-manager">
    <DmConversationList @open="onOpenFromList" />

    <DmModal v-model:open="dmOpen">
      <DmModalPanel v-if="activeConversationId" :connected="connected" :myUserId="myUserId" :myUserNo="myUserNo" :peerUserId="peerUserId" :peerUserNo="peerUserNo" :conversationId="activeConversationId" @update:open="dmOpen = $event" />
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
