<script setup lang="ts">
import { markConversationRead, sendDmMessage } from '@/api/dmApi';
import type { DmPayload } from '@/composables/useDmClient';
import { useDmStore } from '@/store/dmStore';
import { computed, nextTick, onMounted, ref, watch } from 'vue';

const props = defineProps<{
  connected: boolean
  myUserNo: string
  myUserId: number
  peerUserNo: string
  peerUserId: number
  peerProfileImagePath?: string
  peerGenderFlag?: string
  peerUserName?: string
  conversationId: number
  onSend?: (payload: { receiverUserId: number; content: string; conversationId: number }, onLocalMessage?: (msg: DmPayload) => void) => void
}>()

// const emit = defineEmits<{
//   (e: 'update:open', v: boolean): void
// }>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const store = useDmStore()
const text = ref('')
const listRef = ref<HTMLDivElement | null>(null)


const isPeerOnline = computed(() => {
  return store.onlineUsers[props.peerUserNo] ?? false
})


/** 상대방이 마지막으로 읽은 메시지 ID */
const peerLastReadMessageId = computed(() => store.peerLastReadMessageId)

/** 메시지 정렬 */
const messages = computed(() =>
  [...store.activeMessages].sort((a, b) => {
    if (a.messageId && b.messageId) return a.messageId - b.messageId
    return new Date(a.sentAt ?? 0).getTime() - new Date(b.sentAt ?? 0).getTime()
  })
)

/** 내가 보낸 메시지인지 */
const isMine = (m: any) => {
  return String(m.senderUserId) === String(props.myUserId)
    || String(m.senderUserId) === String(props.myUserNo)
}

/** 이전 메시지와 같은 사람인지 */
const isSameSender = (idx: number) => {
  if (idx === 0) return false
  return String(messages.value[idx - 1]?.senderUserId) === String(props.peerUserId) 
    || String(messages.value[idx - 1]?.senderUserId) === String(props.peerUserNo)
}

/* ==================================================
   이미지 설정
   ================================================== */
const getProfileImg = (genderFlag?: string, path?: string) => {
  if (!path) {
    if (genderFlag === 'M') return 'http://localhost:8080/uploads/basicM.jpg'
    if (genderFlag === 'W') return 'http://localhost:8080/uploads/basicW.jpg'
  }
  return `http://localhost:8080${path}?t=${Date.now()}`
}

/* ==================================================
   추가: 내가 보낸 메시지 중 "마지막" messageId
   ================================================== */
const lastMyMessageId = computed<number | null>(() => {
  const myMessages = messages.value.filter((m) => (String(m.senderUserId) === String(props.myUserId) || String(m.senderUserId) === String(props.myUserNo)) && m.messageId)

  if (myMessages.length === 0) return null
  return Math.max(...myMessages.map((m) => m.messageId!))
})

/* ==================================================
   변경: 읽음 표시 조건 (마지막 메시지 1개만)
   ================================================== */
const isRead = (m: any) => {
  // 1) 내 메시지인가?
  const isMine = String(m.senderUserId) === String(props.myUserId) || String(m.senderUserId) === String(props.myUserNo)
  if (!isMine) return false

  // 2) 서버 확정 메시지인가?
  if (!m.messageId) return false

  // 3) 상대방이 읽었는가?
  if (peerLastReadMessageId.value < m.messageId) return false

  // 4) 내가 보낸 "마지막" 메시지인가?
  return m.messageId === lastMyMessageId.value
}

/** 날짜 관련 기존 로직 그대로 */
const isNewDate = (idx: number) => {
  if (idx === 0) return true
  const prev = messages.value[idx - 1]
  const curr = messages.value[idx]
  if (!prev?.sentAt || !curr?.sentAt) return false
  return new Date(prev.sentAt).toISOString().slice(0, 10) !== new Date(curr.sentAt).toISOString().slice(0, 10)
}

const formatDateLabel = (t?: string) => (t ? new Date(t).toISOString().slice(0, 10) : '')

const formatTime = (t?: string) => {
  if (!t) return ''
  const d = new Date(t)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

/** 메시지 전송 로직 그대로 */
const handleSend = async () => {
  const content = text.value.trim()
  if (!content) return

  const tempId = store.addOptimisticMessage({
    conversationId: props.conversationId,
    senderUserId: props.myUserId,
    senderUserNo: props.myUserNo,
    content
  })

  text.value = ''

  try {
    const res = await sendDmMessage({
      senderId: props.myUserId,
      receiverId: props.peerUserId,
      receiverUserId: props.peerUserNo,
      body: content,
      msgType: 'TEXT',
      conversationId: props.conversationId
    })

    store.confirmMessage(tempId, {
      conversationId: res.data.conversationId,
      messageId: res.data.messageId,
      sentAt: res.data.sentAt,
    })
  } catch (e) {
    store.failMessage(tempId)
  }
}

/* ==================================================
   그대로 유지: 채팅창 열릴 때 읽음 처리
   ================================================== */
onMounted(async () => {
  await nextTick()
  listRef.value?.scrollTo({ top: listRef.value.scrollHeight })

  await markConversationRead(props.conversationId, props.myUserId)
})

watch(messages, () => {
  requestAnimationFrame(() => {
    listRef.value?.scrollTo({ top: listRef.value.scrollHeight, behavior: 'smooth' })
  })
})
</script>

<template>
  <section class="dm">
    <header class="dm__header">
      <!-- <img
        class="avatar"
        :src="getProfileImg(peerGenderFlag, peerProfileImagePath)" /> -->
      <div class="dm__title-row">
        <strong>채팅창</strong>
        <span class="badge" :class="{ on: isPeerOnline }">
          {{ isPeerOnline ? 'ONLINE' : 'OFFLINE' }}
        </span>
      </div>
      <!-- <button class="dm__close" @click="emit('update:open', false)">✕</button> -->
      <button class="dm__close" @click="emit('close')">✕</button>
    </header>

    <div class="dm__body">
    
      <div ref="listRef" class="msg-list">
        <template v-for="(m, idx) in messages" :key="m.messageId ?? m.tempId">

          <!-- 날짜 -->
          <div v-if="isNewDate(idx)" class="date-divider">
            {{ formatDateLabel(m.sentAt) }}
          </div>

          <!-- 메시지 -->
          <div class="msg" :class="{ mine: isMine(m) }">

            <!-- 상대 메시지 -->
            <template v-if="!isMine(m)">
              <div class="msg-row">

                <!-- avatar (첫 메시지만) -->
                <img
                  v-if="!isSameSender(idx)"
                  class="avatar"
                  :src="getProfileImg(peerGenderFlag, peerProfileImagePath)"
                />

                <!-- avatar 자리 유지 (정렬용) -->
                <div v-else class="avatar placeholder"></div>

                <div class="bubble-wrap">

                  <!-- 이름 (첫 메시지만) -->
                  <div v-if="!isSameSender(idx)" class="sender-name">
                    {{ peerUserName }}
                  </div>

                  <div class="bubble">
                    <div class="content">{{ m.content }}</div>
                    <div class="time">
                      {{ formatTime(m.sentAt) }}
                    </div>
                  </div>

                </div>
              </div>
            </template>

            <!-- 내 메시지 -->
            <template v-else>
              <div class="bubble mine-bubble">
                <div class="content">{{ m.content }}</div>
                <div class="time">
                  <span v-if="isRead(m)" class="read">✔</span>
                  {{ formatTime(m.sentAt) }}
                </div>
              </div>
            </template>

          </div>

        </template>
      </div>


      <div class="input-row">
        <input v-model="text" class="input" placeholder="메시지를 입력하세요" @keydown.enter.prevent="handleSend" />
        <button class="btn" @click="handleSend">전송</button>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* =========================
   DM 전체 컨테이너
========================= */
.dm {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  width: 380px;
  background: #fff;
}

/* =========================
   헤더
========================= */
.dm__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.dm__title-row {
  display: flex;
  align-items: left;
  gap: 8px;
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

.dm__close {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: #6b7280;
}

.dm__close:hover {
  color: red;
}

/* =========================
   메시지 영역
========================= */
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
/* =========================
   메시지 단위 (핵심)
========================= */
.msg {
  display: flex;
  flex-direction: column;
  margin-bottom: 6px;
}

/* 내 메시지: 오른쪽 */
.msg.mine {
  align-items: flex-end;
}

.msg.mine + .msg.mine {
  margin-top: -2px;
}

/* 상대 메시지: 왼쪽 */
.msg:not(.mine) {
  align-items: flex-start;
}

.msg:not(.mine) + .msg:not(.mine) {
  margin-top: -2px;
}
/* =========================
   상대방 이름
========================= */
.sender-name {
  font-size: 12px;
  color: #374151;
  margin-left: 4px;
  margin-bottom: 2px;
}

/* =========================
   말풍선 + 시간 래퍼
========================= */
.bubble {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  /* max-width: calc(100% - 20px); */
  max-width: 85%;
}

/* 상대방 메시지: [말풍선][시간] */
.msg:not(.mine) .bubble {
  flex-direction: row;
}

/* 내 메시지: [시간][말풍선] */
.msg.mine .bubble {
  flex-direction: row-reverse;
}

/* =========================
   말풍선
========================= */
.content {
  position: relative;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 8px 12px;
  white-space: pre-wrap;
  word-break: break-word;
}


.msg:not(.mine) .content::before {
  content: '';
  position: absolute;
  left: -6px;
  top: 10px;

  width: 0;
  height: 0;

  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-right: 6px solid #fff;
}

.msg:not(.mine) .content::after {
  content: '';
  position: absolute;
  left: -7px;
  top: 10px;

  width: 0;
  height: 0;

  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-right: 7px solid #e5e7eb; /* 테두리 */
}

/* 내 메시지 말풍선 */
.msg.mine .content {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.msg.mine .content::before {
  content: '';
  position: absolute;
  right: -6px;
  top: 10px;

  width: 0;
  height: 0;

  border-top: 6px solid transparent;
  border-bottom: 6px solid transparent;
  border-left: 6px solid #eff6ff;
}

.msg.mine .content::after {
  content: '';
  position: absolute;
  right: -7px;
  top: 10px;

  width: 0;
  height: 0;

  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 7px solid #bfdbfe;
}
/* =========================
   첫메세지만 말꼬리 모양 적용
========================= */
.msg:not(.mine) + .msg:not(.mine) .content::before,
.msg:not(.mine) + .msg:not(.mine) .content::after {
  display: none;
}

.msg.mine + .msg.mine .content::before,
.msg.mine + .msg.mine .content::after {
  display: none;
}
/* =========================
   시간 / 상태
========================= */
.time {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
}

.mini {
  font-size: 11px;
}

.mini.err {
  color: #dc2626;
}

.read {
  font-size: 11px;
  color: #2563eb;
  margin-left: 4px;
}

/* =========================
   날짜 구분선
========================= */
.date-divider {
  display: flex;
  justify-content: center;
  margin: 12px 0;
  font-size: 12px;
  color: #6b7280;
}

.date-divider::before,
.date-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e5e7eb;
  margin: auto 8px;
}

/* =========================
   입력 영역
========================= */
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

/* =========================
   대화방 대상 이미지 영역
========================= */
.dm__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}

.title-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
}

.bubble-wrap {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.mine-bubble {
  align-self: flex-end;
}
</style>
