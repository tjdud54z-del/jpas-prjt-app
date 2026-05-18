import { http } from '@/api/common/http'

/* =======================
 * Inbox (대화 목록)
 * ======================= */
export interface DmConversationListItem {
  conversationId: number
  peerUserId: number // camelCase 통일
  peerUserNo: string
  peerUserName: string
  peerProfileImagePath: string
  peerGenderFlag: string
  lastMessageId: number | null
  lastMessageAt: string | null
  lastMessage: string | null
  lastSenderId: number | null
  unreadCount: number
}

/* =======================
 * Message Row (백엔드 원본)
 * ======================= */
export interface DmMessageRow {
  senderUserId: any
  senderUserNm: any
  senderUserNo: any
  messageId: number
  conversationId: number
  senderId: number // 백엔드 기준 (store에서 변환)
  body: string
  sentAt: string
}

/* =======================
 * Message sender (백엔드 원본)
 * ======================= */
export type SendDmMessageReq = {
  senderId: number // 내 id (현재는 body로)
  receiverId: number // 상대 id
  receiverUserId: string
  body: string // 내용
  msgType: 'TEXT' | string // 타입
  conversationId?: number // 있으면 같이(백엔드가 무시/활용 모두 가능)
}

export type SendDmMessageRes = {
  conversationId: number
  messageId: number
  sentAt: string // ISO
}

/* =======================
 * (R) 대화 목록: 커서 페이징
 * ======================= */
export const fetchDmConversations = (params: {
  userId?: number
  size?: number
  cursorAt?: string
  cursorId?: number
}) => {
  return http.get<DmConversationListItem[]>(
    '/api/dm/conversations',
    { params }
  )
}

/* =======================
 * (C) 대화방 열기 (없으면 생성)
 * ======================= */
export const openConversation = (params: {
  senderId: number
  receiverId: number
}) => {
  return http.post<{ conversationId: number }>(
    '/api/dm/conversations',
    params
  )
}

/* =======================
 * (C) 메시지 전송 (없으면 생성)
 * ======================= */
export const sendDmMessage = (req: SendDmMessageReq) => {
  return http.post<SendDmMessageRes>(
    '/api/dm/messages',
    req
  )
}

/* =======================
 * (R) 메시지 히스토리
 * - messageId DESC 커서 페이징
 * ======================= */
export const fetchDmMessages = (params: {
  conversationId?: number
  size?: number
  userId?: number
  cursorMessageId?: number
}) => {
  return http.post<DmMessageRow[]>(
    `/api/dm/conversations/messages`,
    params
  )
}

/* =======================
 * (U) 읽음 처리
 * ======================= */
export const markConversationRead = (
  conversationId: number,
  userId: number
) => {
  return http.post(
    `/api/dm/conversations/${conversationId}/read`,
    { userId }
  )
}
