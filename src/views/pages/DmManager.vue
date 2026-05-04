<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';

import DmModal from '@/components/dm/DmModal.vue';
import DmModalPanel from '@/components/dm/DmModalPanel.vue';
import DmConversationList from './DmConversationList.vue';

import { fetchDmMessages, openDmConversation } from '@/api/dmApi';

import { useDmClient } from '@/composables/useDmClient';
import { useDmStore } from '@/store/dmStore';

// ===============================
// 로그인 사용자
// ===============================
const userInfo = JSON.parse(localStorage.getItem('userInfo') ?? '{}');
const myUserId: string = userInfo.userNo;

// ===============================
// 상태
// ===============================
const dmOpen = ref(false);
const activeConversationId = ref<number | null>(null);
const peerUserId = ref<string>('');

// ===============================
// Store / Socket
// ===============================
const store = useDmStore();
const { connect, send, disconnect, connected } = useDmClient();

// ===============================
// DM 목록 클릭
// ===============================
const onOpenFromList = async (item: { conversationId: number; peerUserNo: string }) => {
  const conversationId = item.conversationId;

  console.log('conversationId' + conversationId);

  console.log('peeruserId' + item.peerUserNo);

  if (!conversationId || conversationId === 0) return;

  activeConversationId.value = conversationId;
  peerUserId.value = String(item.peerUserNo);

  store.setActiveConversation(conversationId);

  const res = await fetchDmMessages(conversationId, { size: 30 });
  store.setMessages(conversationId, res.data);

  dmOpen.value = true;
};

// ===============================
// 신규 DM (사원 상세 등에서 호출용)
// ===============================
const openNewDm = async (peeruserId: number) => {
  const res = await openDmConversation(peeruserId);
  const conversationId = res.data.conversationId;

  if (!conversationId || conversationId === 0) return;

  activeConversationId.value = conversationId;
  peerUserId.value = String(peeruserId);

  store.setActiveConversation(conversationId);

  const msgRes = await fetchDmMessages(conversationId, { size: 30 });
  store.setMessages(conversationId, msgRes.data);

  dmOpen.value = true;
};

// ===============================
// WebSocket 수신
// ===============================
onMounted(() => {
  connect((msg) => {
    // 내가 보낸 echo 무시
    if (msg.senderUserId === myUserId) return;

    // conversationId 방어
    if (!msg.conversationId || msg.conversationId === 0) return;

    store.addMessage(msg);
  });
});

onUnmounted(() => {
  disconnect();
});
</script>

<template>
  <div class="dm-manager">
    <!-- DM 목록 -->
    <DmConversationList @open="onOpenFromList" />
    <!-- DM 모달 -->
    <DmModal v-model:open="dmOpen">
      <DmModalPanel v-if="activeConversationId" :connected="connected" :myUserId="myUserId" :peerUserId="peerUserId" :conversationId="activeConversationId" :onSend="send" />
    </DmModal>
  </div>
</template>

<style scoped>
.dm-manager {
  display: flex;
  gap: 16px;
}
</style>
