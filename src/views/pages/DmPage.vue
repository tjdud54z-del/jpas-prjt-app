<script setup lang="ts">
import DmPanel from '@/components/dm/DmPanel.vue';
import { useDmClient } from '@/composables/useDmClient';
import { useDmStore } from '@/store/dmStore';
import { onMounted, onUnmounted } from 'vue';

const userInfo = JSON.parse(localStorage.getItem('userInfo') ?? '{}');
const myUserId: string = userInfo.userNo;

// URL 예시: /dm?peerUserId=JPAS_0025&cid=10
const peerUserId = String(new URLSearchParams(location.search).get('peer') ?? '');
const conversationId = Number(new URLSearchParams(location.search).get('cid') ?? 0);

const store = useDmStore();
store.setActiveConversation(conversationId);

const { connect, send, disconnect, connected } = useDmClient();

onMounted(() => {
  connect((msg) => {
    // 내가 보낸 echo 메시지는 무시
    if (msg.senderUserId === myUserId) {
      return;
    }

    // 상대가 보낸 메시지만 추가
    store.addMessage(msg);
  });
});

onUnmounted(() => {
  disconnect();
});
</script>

<template>
  <div style="padding: 16px">
    <DmPanel :connected="connected" :myUserId="myUserId" :peerUserId="peerUserId" :conversationId="conversationId" :onSend="send" />
  </div>
</template>
