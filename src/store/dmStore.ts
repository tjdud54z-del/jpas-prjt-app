import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { fetchDmMessages } from '@/api/dmApi'; // dmApi 연동
import type { DmPayload } from '@/composables/useDmClient';

/**
 * DmPayload (프론트 표준 메시지 형태)
 * - messageId?: number
 * - conversationId: number
 * - content: string
 * - sentAt?: string
 * - senderUserId: number
 */
export const useDmStore = defineStore('dm', () => {
  /** 전체 메시지 풀 (모든 대화 섞여 있음) */
  const messages = ref<DmPayload[]>([]);

  /** 현재 활성 대화 ID */
  const activeConversationId = ref<number | null>(null);

  /** 현재 대화 메시지 (화면 표시용) */
  const activeMessages = computed(() => {
    if (activeConversationId.value == null) return [];

    return messages.value.filter((m) => m.conversationId === activeConversationId.value).sort((a, b) => (a.sentAt ?? '').localeCompare(b.sentAt ?? ''));
  });

  /** 대화 전환 */
  const setActiveConversation = (conversationId: number) => {
    if (activeConversationId.value === conversationId) return;
    activeConversationId.value = conversationId;
  };

  /**
   * 메시지 조회 (대화 클릭 시)
   * - dmApi 사용
   * - body / senderId → content / senderUserId 변환
   */
  const fetchMessages = async (conversationId: number) => {
    const res = await fetchDmMessages(conversationId, { size: 50 });

    const mapped: DmPayload[] = res.data.map((m) => ({
      messageId: m.messageId,
      conversationId,
      content: m.body, // 핵심
      sentAt: m.sentAt,
      senderUserNm: m.senderUserNm,
      senderUserId: m.senderUserNo // 핵심
    }));

    setMessages(conversationId, mapped);
  };

  /**
   * 수신/전송 공용 addMessage
   * - WebSocket 수신
   * - optimistic UI
   */
  const addMessage = (msg: DmPayload) => {
    // conversationId 보정
    if (!msg.conversationId && activeConversationId.value != null) {
      msg.conversationId = activeConversationId.value;
    }

    // messageId 중복 방지
    if (msg.messageId && messages.value.some((m) => m.messageId === msg.messageId)) {
      return;
    }

    messages.value.push(msg);
  };

  /**
   * 대화 단위 메시지 세팅 (초기 조회용)
   */
  const setMessages = (conversationId: number, list: DmPayload[]) => {
    messages.value = messages.value.filter((m) => m.conversationId !== conversationId);
    messages.value.push(...list);
  };

  /** 전체 초기화 */
  const clear = () => {
    messages.value = [];
    activeConversationId.value = null;
  };

  return {
    // state
    messages,
    activeConversationId,

    // computed
    activeMessages,

    // actions
    setActiveConversation,
    fetchMessages,
    addMessage,
    setMessages,
    clear
  };
});
