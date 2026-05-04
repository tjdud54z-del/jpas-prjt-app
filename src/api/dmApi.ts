import { http } from '@/api/common/http';

/* =======================
 * Inbox (대화 목록)
 * ======================= */
export interface DmConversationListItem {
  conversationId: number;

  peerUserId: number; // camelCase 통일
  peerUserNo: string;
  peerUserName: string;

  lastMessageId: number | null;
  lastMessageAt: string | null;
  lastMessage: string | null;
  lastSenderId: number | null;

  unreadCount: number;
}

/* =======================
 * Message Row (백엔드 원본)
 * ======================= */
export interface DmMessageRow {
  senderUserNm: any;
  senderUserNo: any;
  messageId: number;
  conversationId: number;

  senderId: number; // 백엔드 기준 (store에서 변환)
  body: string;
  sentAt: string;
}

/* =======================
 * (R) 대화 목록: 커서 페이징
 * ======================= */
export const fetchDmConversations = (params: { userId?: number; size?: number; cursorAt?: string; cursorId?: number }) => {
  return http.get<DmConversationListItem[]>('/api/dm/conversations', { params });
};

/* =======================
 * (C) 대화방 열기 (없으면 생성)
 * ======================= */
export const openDmConversation = (peerUserId: number) => {
  return http.post<{ conversationId: number }>('/api/dm/conversations', { peerUserId });
};

/* =======================
 * (R) 메시지 히스토리
 * - messageId DESC 커서 페이징
 * ======================= */
export const fetchDmMessages = (
  conversationId: number,
  params: {
    size?: number;
    cursorMessageId?: number;
  }
) => {
  return http.get<DmMessageRow[]>(`/api/dm/conversations/${conversationId}/messages`, { params });
};

/* =======================
 * (U) 읽음 처리
 * ======================= */
export const markDmRead = (conversationId: number, lastReadMessageId: number) => {
  return http.post(`/api/dm/conversations/${conversationId}/read`, { lastReadMessageId });
};
