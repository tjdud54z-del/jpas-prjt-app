import { useDmStore } from '@/store/dmStore'
import { ref } from 'vue'

declare global {
  interface Window {
    StompJs: any
  }
}

/** DM Payload */
export interface DmPayload {
  type?: string // ✅ PRESENCE 구분용 추가

  conversationId: number
  messageId?: number
  senderUserId?: any
  senderUserNo?: string
  senderUserNm?: string
  receiverUserId?: string
  content?: string
  sentAt?: string

  // ✅ PRESENCE용
  userId?: any
  status?: 'ONLINE' | 'OFFLINE'
}

/** DM WebSocket Client */
export function useDmClient() {
  const client = ref<any>(null)
  const connected = ref(false)

  const store = useDmStore() // ✅ 추가

  /** WebSocket 연결 */
  const connect = (onMessage: (msg: DmPayload) => void) => {
    if (client.value?.active) return

    const token = localStorage.getItem('accessToken')

    const c = new window.StompJs.Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: token
        ? { Authorization: `Bearer ${token}` }
        : {},
      reconnectDelay: 3000,

      onConnect: () => {
        connected.value = true
        console.log('✅ STOMP CONNECTED')

        /** =========================
         * ✅ DM 메시지 구독
         * ========================= */
        c.subscribe('/user/queue/dm', (frame: any) => {
          const msg: DmPayload = JSON.parse(frame.body)
          onMessage(msg)
        })

        /** =========================
         * ✅ ✅ PRESENCE 구독 (핵심 추가)
         * ========================= */
        c.subscribe('/topic/presence', (frame: any) => {
          const data: DmPayload = JSON.parse(frame.body)

          if (data.type === 'PRESENCE') {
            const userId = data.userId

            console.log(
              'userIduserIduserIduserId = ' + userId
            )

            if (!userId) return

            store.setUserOnline(
              userId,
              data.status === 'ONLINE'
            )

            console.log(
              `👤 Presence: ${userId} → ${data.status}`
            )
          }
        })
      },

      onDisconnect: () => {
        connected.value = false
        console.log('❌ STOMP DISCONNECTED')
      }
    })

    c.activate()
    client.value = c
  }

  /** READ 이벤트 구독 */
  const subscribeRead = (
    conversationId: number,
    cb: (evt: any) => void
  ) => {
    if (!client.value || !client.value.connected)
      return () => {}

    const sub = client.value.subscribe(
      `/topic/dm/read/${conversationId}`,
      (frame: any) => cb(JSON.parse(frame.body))
    )

    return () => sub.unsubscribe()
  }

  /** DM 전송 */
  const send = (
    payload: {
      receiverUserId: string
      content: string
      conversationId: number
    },
    onLocalMessage?: (msg: DmPayload) => void
  ) => {
    if (!client.value || !connected.value) return

    const raw = localStorage.getItem('userInfo') ?? '{}'
    const userInfo = JSON.parse(raw)

    const msg: DmPayload = {
      senderUserId: userInfo.userId,
      receiverUserId: payload.receiverUserId,
      conversationId: payload.conversationId,
      content: payload.content,
      sentAt: new Date().toISOString()
    }

    client.value.publish({
      destination: '/pub/dm.send',
      body: JSON.stringify(msg)
    })

    onLocalMessage?.(msg)
  }

  const disconnect = async () => {
    if (!client.value) return
    await client.value.deactivate()
    client.value = null
    connected.value = false
  }

  return {
    connect,
    subscribeRead,
    send,
    disconnect,
    connected
  }
}
