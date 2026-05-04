<script setup lang="ts">
import type { DmPayload } from '@/composables/useDmClient';
import { useDmStore } from '@/store/dmStore';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  connected: boolean;
  myUserId: string; // userId(Principal)
  peerUserId: string; // 상대 userId(Principal)
  conversationId: number;

  // payload + callback (optimistic UI)
  onSend: (payload: { receiverUserId: string; content: string; conversationId: number }, onLocalMessage?: (msg: DmPayload) => void) => void;
}>();

const store = useDmStore();
store.setActiveConversation(props.conversationId);

const text = ref('');
const listRef = ref<HTMLDivElement | null>(null);

const messages = computed(() => {
  return [...store.activeMessages].sort((a, b) => {
    if (!a.sentAt || !b.sentAt) return 0;
    return new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime();
  });
});

const handleSend = () => {
  const content = text.value.trim();
  if (!content) return;

  props.onSend(
    {
      receiverUserId: props.peerUserId,
      content,
      conversationId: props.conversationId
    },
    (msg) =>
      store.addMessage({
        ...msg,
        senderUserId: props.myUserId // 핵심
      })
  );

  text.value = '';
};

const formatTime = (t?: string) => {
  if (!t) return '';
  const d = new Date(t);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

watch(
  () => props.conversationId,
  (newId, oldId) => {
    if (!newId) return;
    if (newId !== oldId) {
      store.setActiveConversation(newId);
    }
  },
  { immediate: true }
);
</script>

<template>
  <section class="dm">
    <header class="dm__header">
      <strong>DM</strong>
      <span class="badge" :class="{ on: connected }">
        {{ connected ? 'ONLINE' : 'OFFLINE' }}
      </span>
    </header>

    <div class="dm__body">
      <div class="msg-list" ref="listRef">
        <div v-for="(m, idx) in messages" :key="m.messageId ?? `${m.sentAt}-${idx}`" class="msg" :class="{ mine: String(m.senderUserId) === String(myUserId) }">
          <div class="bubble">
            <div class="content">{{ m.content }}</div>
            <div class="time">{{ formatTime(m.sentAt) }}</div>
          </div>
        </div>
      </div>

      <div class="input-row">
        <input v-model="text" class="input" placeholder="메시지를 입력하세요" @keydown.enter.prevent="handleSend" />
        <button class="btn" @click="handleSend">전송</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.dm {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  width: 380px;
  background: #fff;
}
.dm__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}
.badge {
  font-size: 12px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #eee;
  color: #666;
}
.badge.on {
  background: #dcfce7;
  color: #166534;
}

.dm__body {
  display: flex;
  flex-direction: column;
  height: 520px;
}
.msg-list {
  flex: 1;
  overflow: auto;
  padding: 12px;
  background: #fafafa;
}
.msg {
  display: flex;
  margin-bottom: 10px;
}
.msg.mine {
  justify-content: flex-end;
}
.bubble {
  max-width: 75%;
}
.content {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 8px 10px;
  white-space: pre-wrap;
  word-break: break-word;
}
.msg.mine .content {
  background: #eff6ff;
  border-color: #bfdbfe;
}
.time {
  margin-top: 3px;
  font-size: 11px;
  color: #6b7280;
  text-align: right;
}

.input-row {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #e5e7eb;
  background: #fff;
}
.input {
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 10px;
  outline: none;
}
.btn {
  border: none;
  background: #2563eb;
  color: #fff;
  padding: 0 14px;
  border-radius: 10px;
  cursor: pointer;
}
</style>
