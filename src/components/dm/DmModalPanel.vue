<script setup lang="ts">
import type { DmPayload } from '@/composables/useDmClient';
import { useDmStore } from '@/store/dmStore';
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  connected: boolean;
  myUserId: number;
  myUserNm: string;
  peerUserId: number;
  conversationId: number;
  onSend: (payload: { receiverUserId: number; content: string; conversationId: number }, onLocalMessage?: (msg: DmPayload) => void) => void;
}>();

const store = useDmStore();

const text = ref('');
const listRef = ref<HTMLDivElement | null>(null);

/** 정렬 messageId 이후 같은경우 sentAt로 지정 */
const messages = computed(() =>
  [...store.activeMessages].sort((a, b) => {
    // 1️⃣ messageId가 둘 다 있으면 그걸로 정렬
    if (a.messageId && b.messageId) {
      return a.messageId - b.messageId;
    }

    // 2️⃣ fallback: sentAt
    const ta = a.sentAt ? new Date(a.sentAt).getTime() : 0;
    const tb = b.sentAt ? new Date(b.sentAt).getTime() : 0;
    return ta - tb;
  })
);

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
        messageId: msg.messageId,
        content: msg.content,
        sentAt: msg.sentAt,
        senderUserId: props.myUserId
      })
  );

  text.value = '';
};

const formatTime = (t?: string) => {
  if (!t) return '';
  const d = new Date(t);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

/** ✅ 대화방 변경 */
watch(
  () => props.conversationId,
  async (newId) => {
    if (!newId) return;
    await store.fetchMessages(newId);
    store.setActiveConversation(newId);
  },
  { immediate: true }
);

/** ✅ 자동 스크롤 */
watch(messages, () => {
  requestAnimationFrame(() => {
    listRef.value?.scrollTo({
      top: listRef.value.scrollHeight,
      behavior: 'smooth'
    });
  });
});
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
            <!-- ✅ 상대방 메시지일 때만 이름 -->
            <!-- <div v-if="String(m.senderUserId) !== String(myUserId)" class="sender">
              {{ m.senderUserNm }}
            </div> -->
            <div class="content">
              {{ m.content }}
            </div>
            <!-- ✅ 시간: 상대방은 왼쪽, 나는 오른쪽 -->
            <div class="time" :class="{ left: String(m.senderUserId) !== String(myUserId) }">
              {{ formatTime(m.sentAt) }}
            </div>
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
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* ✅ 상대방 이름 */
.sender {
  font-size: 12px;
  color: #374151;
  margin-left: 4px;
}

/* ✅ 말풍선 */
.content {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 8px 10px;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ✅ 내 메시지 스타일 */
.msg.mine .content {
  background: #eff6ff;
  border-color: #bfdbfe;
}

/* ✅ 시간 */
.time {
  font-size: 11px;
  color: #6b7280;
  text-align: right;
}

.time.left {
  text-align: left;
  margin-left: 4px;
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
