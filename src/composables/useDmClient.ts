import { ref } from 'vue';

declare global {
  interface Window {
    StompJs: any;
  }
}

/**
 * userId 기준 DM Payload
 */
export interface DmPayload {
  conversationId: number; // 필수 (store 필터 기준)
  messageId?: number;
  senderUserId?: string; // Principal 기반
  senderUserNo?: string;
  senderUserNm?: string;
  receiverUserId?: string; // Principal 기반
  content?: string;
  sentAt?: string;
}

/**
 * DM WebSocket Client (Native WS + STOMP)
 */
export function useDmClient() {
  const client = ref<any>(null);
  const connected = ref(false);

  const connect = (onMessage: (msg: DmPayload) => void) => {
    if (client.value?.active) return;

    const token = localStorage.getItem('accessToken');

    const c = new window.StompJs.Client({
      brokerURL: 'ws://localhost:8080/ws',
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 3000,

      onConnect: () => {
        console.log('STOMP CONNECTED');
        connected.value = true;

        // 유저 큐 구독(정답): /user/queue/dm
        c.subscribe('/user/queue/dm', (frame: any) => {
          const msg: DmPayload = JSON.parse(frame.body);
          console.log('📩 DM RECEIVED', msg);
          onMessage(msg);
        });
      },

      onDisconnect: () => {
        console.log('❌ STOMP DISCONNECTED');
        connected.value = false;
      },

      onStompError: (frame: any) => {
        console.error('[STOMP ERROR]', frame.headers?.message, frame.body);
      },

      onWebSocketError: (e: any) => {
        console.error('[WS ERROR]', e);
      }
    });

    c.activate();
    client.value = c;
  };

  /**
   * DM 전송 (userId 기준)
   * - payload에 receiverUserId 반드시 포함
   * - conversationId 반드시 포함
   * - onLocalMessage로 optimistic UI 처리
   */
  const send = (
    payload: {
      receiverUserId: string;
      content: string;
      conversationId: number;
    },
    onLocalMessage?: (msg: DmPayload) => void
  ) => {
    if (!client.value || !connected.value) return;

    const raw = localStorage.getItem('userInfo') ?? '{}';
    const userInfo = JSON.parse(raw);
    const senderUserId: string = userInfo.userId; // Principal과 같은 값이어야 함

    const msg: DmPayload = {
      senderUserId,
      receiverUserId: payload.receiverUserId,
      conversationId: payload.conversationId,
      content: payload.content,
      sentAt: new Date().toISOString()
    };

    console.log('📤 DM SEND', msg);

    client.value.publish({
      destination: '/pub/dm.send',
      body: JSON.stringify(msg)
    });

    // optimistic UI
    onLocalMessage?.(msg);
  };

  const disconnect = async () => {
    if (!client.value) return;
    await client.value.deactivate();
    client.value = null;
    connected.value = false;
  };

  return { connect, send, disconnect, connected };
}
