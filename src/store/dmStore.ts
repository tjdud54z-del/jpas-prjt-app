import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { fetchDmMessages } from '@/api/dmApi'
import type { DmPayload } from '@/composables/useDmClient'

/**
 * DmPayload 확장 (UI 상태 포함)
 */
export type DmUiPayload = DmPayload & {
  tempId?: string
  status?: 'pending' | 'sent' | 'failed'
}

export const useDmStore = defineStore('dm', () => {
  /** 전체 메시지 풀 */
  const messages = ref<DmUiPayload[]>([])

  /** 현재 활성 대화 ID */
  const activeConversationId = ref<number | null>(null)

  /** 상대방의 마지막 읽은 메시지 ID (읽음 표시용) */
  const peerLastReadMessageId = ref<number>(0)

  /** 현재 대화 메시지 (화면 표시용) */
  const activeMessages = computed(() => {
    if (activeConversationId.value == null) return []

    return messages.value
      .filter((m) => m.conversationId === activeConversationId.value)
      .sort((a, b) => {
        if (a.messageId && b.messageId) return a.messageId - b.messageId
        return (a.sentAt ?? '').localeCompare(b.sentAt ?? '')
      })
  })

  /** 대화 전환 */
  const setActiveConversation = (conversationId: number) => {
    if (activeConversationId.value === conversationId) return
    activeConversationId.value = conversationId

    // 대화방 바뀌면 읽음 정보 초기화
    peerLastReadMessageId.value = 0
  }

  /** 상대방 읽음 위치 세팅 */
  const setPeerLastReadMessageId = (messageId: number) => {
    peerLastReadMessageId.value = Number(messageId || 0)
  }

  /**
   * 메시지 조회 (읽음 정보 포함)
   * API 응답:
   * {
   *   messages: DmMessageRow[],
   *   peerLastReadMessageId: number
   * }
   */
  const fetchMessages = async (conversationId: number) => {
    const raw = localStorage.getItem('userInfo') ?? '{}'
    const userInfo = JSON.parse(raw)
    const userId = Number(userInfo.userId)

    const res = await fetchDmMessages({ conversationId: conversationId, userId: userId, size: 50 })

    // 읽음 정보 세팅
    setPeerLastReadMessageId(res.data.peerLastReadMessageId ?? 0)

    const mapped: DmUiPayload[] = res.data.messages.map((m: any) => ({
      messageId: m.messageId,
      conversationId,
      content: m.body,
      sentAt: m.sentAt,
      senderUserNm: m.senderUserNm,
      senderUserId: m.senderUserId,
      senderUserNo: m.senderUserNo,
      status: 'sent'
    }))

    setMessages(conversationId, mapped)
  }

  /** WebSocket / 서버 수신 메시지 추가 */
  const addMessage = (msg: DmUiPayload) => {
    if (!msg.conversationId && activeConversationId.value != null) {
      msg.conversationId = activeConversationId.value
    }

    if (msg.messageId && messages.value.some((m) => m.messageId === msg.messageId)) {
      return
    }

    messages.value.push({
      ...msg,
      status: msg.status ?? 'sent'
    })
  }

  /** 낙관적 메시지 추가 */
  const addOptimisticMessage = (payload: { conversationId?: number; senderUserId: number; senderUserNo: string; content: string }) => {
    const cid = payload.conversationId ?? activeConversationId.value
    if (!cid) return ''

    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`

    messages.value.push({
      tempId,
      conversationId: cid,
      senderUserId: payload.senderUserId,
      senderUserNo: payload.senderUserNo,
      content: payload.content,
      sentAt: new Date().toISOString(),
      status: 'pending'
    })

    return tempId
  }

  /** 서버 확정 */
  const confirmMessage = (
    tempId: string,
    server: {
      messageId: number
      sentAt: string
      conversationId: number
    }
  ) => {
    const msg = messages.value.find((m) => m.tempId === tempId)
    if (!msg) return

    msg.messageId = server.messageId
    msg.sentAt = server.sentAt
    msg.conversationId = server.conversationId
    msg.status = 'sent'
    delete msg.tempId
  }

  /** 전송 실패 */
  const failMessage = (tempId: string) => {
    const msg = messages.value.find((m) => m.tempId === tempId)
    if (!msg) return
    msg.status = 'failed'
  }

  /** 대화 단위 세팅 */
  const setMessages = (conversationId: number, list: DmUiPayload[]) => {
    messages.value = messages.value.filter((m) => m.conversationId !== conversationId)
    messages.value.push(...list)
  }

  /** 전체 초기화 */
  const clear = () => {
    messages.value = []
    activeConversationId.value = null
    peerLastReadMessageId.value = 0
  }

  /** 대화방 리스트 재조회 트리거 */
  const needReloadConversationList = ref(0)
  const triggerConversationListReload = () => {
    needReloadConversationList.value++
  }

  return {
    // state
    messages,
    activeConversationId,
    peerLastReadMessageId,
    needReloadConversationList,

    // computed
    activeMessages,

    // actions
    setActiveConversation,
    setPeerLastReadMessageId,
    fetchMessages,
    addMessage,
    addOptimisticMessage,
    confirmMessage,
    failMessage,
    setMessages,
    triggerConversationListReload,
    clear
  }
})
