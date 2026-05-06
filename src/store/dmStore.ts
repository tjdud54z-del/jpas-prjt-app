import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import { fetchDmMessages } from '@/api/dmApi';
import type { DmPayload } from '@/composables/useDmClient';

/**
 * DmPayload 확장 (UI 상태 포함)
 *
 * 서버 기준 필드
 * - messageId?: number
 * - conversationId: number
 * - content: string
 * - sentAt?: string
 * - senderUserId: number
 *
 * 프론트 전용 필드
 * - tempId?: string        // 낙관적 메시지용
 * - status?: 'pending' | 'sent' | 'failed'
 */
export type DmUiPayload = DmPayload & {
  tempId?: string;
  status?: 'pending' | 'sent' | 'failed';
};

export const useDmStore = defineStore('dm', () => {
  /** 전체 메시지 풀 (모든 대화 섞여 있음) */
  const messages = ref<DmUiPayload[]>([]);

  /** 현재 활성 대화 ID */
  const activeConversationId = ref<number | null>(null);

  /** 현재 대화 메시지 (화면 표시용) */
  const activeMessages = computed(() => {
    if (activeConversationId.value == null) return [];

    return messages.value
      .filter((m) => m.conversationId === activeConversationId.value)
      .sort((a, b) => {
        // messageId 우선, 없으면 sentAt
        if (a.messageId && b.messageId) return a.messageId - b.messageId;
        return (a.sentAt ?? '').localeCompare(b.sentAt ?? '');
      });
  });

  /** 대화 전환 */
  const setActiveConversation = (conversationId: number) => {
    if (activeConversationId.value === conversationId) return;
    activeConversationId.value = conversationId;
  };

  /**
   * 메시지 조회 (대화 클릭 시, R)
   * - MyBatis 조회 결과 → DmPayload로 매핑
   */
  const fetchMessages = async (conversationId: number) => {
    const res = await fetchDmMessages(conversationId, { size: 50 });

    const mapped: DmUiPayload[] = res.data.map((m) => ({
      messageId: m.messageId,
      conversationId,
      content: m.body,
      sentAt: m.sentAt,
      senderUserNm: m.senderUserNm,
      senderUserId: m.senderUserId,
      senderUserNo: m.senderUserNo,
      status: 'sent'
    }));

    setMessages(conversationId, mapped);
  };

  /**
   * WebSocket 수신 / 서버 확정 메시지 추가
   */
  const addMessage = (msg: DmUiPayload) => {
    // conversationId 보정
    if (!msg.conversationId && activeConversationId.value != null) {
      msg.conversationId = activeConversationId.value;
    }

    // messageId 중복 방지
    if (msg.messageId && messages.value.some((m) => m.messageId === msg.messageId)) {
      return;
    }

    messages.value.push({
      ...msg,
      status: msg.status ?? 'sent'
    });
  };

  /**
   * 낙관적 메시지 추가 (전송 버튼 누른 직후)
   */
  const addOptimisticMessage = (payload: { conversationId?: number; senderUserId: number; senderUserNo: string; content: string }) => {
    const cid = payload.conversationId ?? activeConversationId.value;
    if (!cid) return '';

    const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    messages.value.push({
      tempId,
      conversationId: cid, // 항상 확정된 값
      senderUserId: payload.senderUserId,
      senderUserNo: payload.senderUserNo,
      content: payload.content,
      sentAt: new Date().toISOString(),
      status: 'pending'
    });

    '추가된 메세지 === ' + JSON.stringify(messages.value);

    return tempId;
  };

  /**
   * 서버 응답으로 메시지 확정 (temp → real)
   */
  const confirmMessage = (
    tempId: string,
    server: {
      messageId: number;
      sentAt: string;
      conversationId: number;
    }
  ) => {
    const msg = messages.value.find((m) => m.tempId === tempId);
    if (!msg) return;

    msg.messageId = server.messageId;
    msg.sentAt = server.sentAt;
    msg.conversationId = server.conversationId;
    msg.status = 'sent';
    delete msg.tempId;
  };

  /**
   * 전송 실패 처리
   */
  const failMessage = (tempId: string) => {
    const msg = messages.value.find((m) => m.tempId === tempId);
    if (!msg) return;

    msg.status = 'failed';
  };

  /**
   * 대화 단위 메시지 세팅 (초기 조회용)
   */
  const setMessages = (conversationId: number, list: DmUiPayload[]) => {
    messages.value = messages.value.filter((m) => m.conversationId !== conversationId);
    messages.value.push(...list);
  };

  /** 전체 초기화 */
  const clear = () => {
    messages.value = [];
    activeConversationId.value = null;
  };

  /** ✅ 대화방 리스트 재조회 트리거 (증가값) */
  const needReloadConversationList = ref(0);

  /** ✅ DM 모달 닫힐 때 호출 → 리스트 재조회 신호 */
  const triggerConversationListReload = () => {
    needReloadConversationList.value++;
  };

  return {
    // state
    messages,
    activeConversationId,
    needReloadConversationList,

    // computed
    activeMessages,

    // actions
    setActiveConversation,
    fetchMessages,
    addMessage, // WebSocket / 서버 수신용
    addOptimisticMessage, // 전송 직후 UI
    confirmMessage, // 서버 확정
    failMessage, // 실패 처리
    setMessages,
    triggerConversationListReload,
    clear
  };
});
