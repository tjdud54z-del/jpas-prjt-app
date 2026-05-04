<script setup lang="ts">
import { fetchDmConversations, type DmConversationListItem } from '@/api/dmApi';
import { onMounted, ref } from 'vue';

const emit = defineEmits<{
  (e: 'open', item: DmConversationListItem): void;
}>();

const conversations = ref<DmConversationListItem[]>([]);
const loading = ref(false);

/** DM 대화 목록 로딩 */
const load = async () => {
  const raw = localStorage.getItem('userInfo') ?? '{}';
  const userInfo = JSON.parse(raw);
  const userId: number = userInfo.userId; // Principal과 같은 값이어야 함
  loading.value = true;
  try {
    const res = await fetchDmConversations({ userId: userId, size: 30 });
    conversations.value = res.data; // 서버 정렬 그대로 사용
  } finally {
    loading.value = false;
  }
};

/** 대화 클릭 handler */
const onClick = (item: DmConversationListItem) => {
  emit('open', item);
};

/** Mount */
onMounted(load);
</script>

<template>
  <aside class="dm-list">
    <header class="dm-list__header">
      <strong>채팅방</strong>
    </header>

    <ul class="dm-list__body">
      <li v-for="c in conversations" :key="c.conversationId" class="dm-item" @click="onClick(c)">
        <!-- 상단: 이름 + 시간 -->
        <div class="top">
          <span class="name"> {{ c.peerUserName }}({{ c.peerUserNo }})</span>
          <span class="time">
            {{ c.lastMessageAt?.slice(11, 16) ?? '' }}
          </span>
        </div>

        <!-- 하단: 마지막 메시지 + 안 읽음 -->
        <div class="bottom">
          <span class="message">
            {{ c.lastMessage ?? '대화를 시작해보세요' }}
          </span>
          <span v-if="c.unreadCount > 0" class="badge">
            {{ c.unreadCount }}
          </span>
        </div>
      </li>
      <li v-if="!loading && conversations.length === 0" class="empty">대화가 없습니다</li>
    </ul>
  </aside>
</template>

<style scoped>
.dm-list {
  width: 300px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
}

.dm-list__header {
  padding: 10px 12px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.dm-list__body {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 520px;
  overflow-y: auto;
}

.dm-item {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
}

.dm-item:hover {
  background: #f9fafb;
}

.top {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 4px;
}

.name {
  font-weight: 600;
}

.time {
  font-size: 12px;
  color: #6b7280;
}

.bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.message {
  font-size: 13px;
  color: #374151;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 200px;
}

.badge {
  min-width: 18px;
  padding: 2px 6px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  border-radius: 999px;
  text-align: center;
}

.empty {
  padding: 20px;
  text-align: center;
  color: #9ca3af;
}
</style>
