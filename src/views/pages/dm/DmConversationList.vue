<script setup lang="ts">
import { fetchDmConversations, markConversationRead, type DmConversationListItem } from '@/api/dmApi';
import { onMounted, ref, watch } from 'vue';

import { useDmStore } from '@/store/dmStore';
const store = useDmStore()

const emit = defineEmits<{
  (e: 'open', item: DmConversationListItem): void
}>()

const conversations = ref<DmConversationListItem[]>([])
const loading = ref(false)

const getProfileImg = (genderFlag?: string, path?: string) => {
  if (!path) {
    if (genderFlag === 'M') return 'http://localhost:8080/uploads/basicM.jpg'
    if (genderFlag === 'W') return 'http://localhost:8080/uploads/basicW.jpg'
  }
  const baseUrl = 'http://localhost:8080'
  return `${baseUrl}${path}?t=${Date.now()}`
}

/** 로그인 사용자 ID */
const getUserId = (): number => {
  const raw = localStorage.getItem('userInfo') ?? '{}'
  const userInfo = JSON.parse(raw)
  return Number(userInfo.userId)
}

/** DM 대화 목록 로딩 */
const load = async () => {
  const userId = getUserId()
  loading.value = true
  try {
    const res = await fetchDmConversations({ userId: userId, size: 30 })
    conversations.value = res.data
  } finally {
    loading.value = false
  }
}

/** 대화 클릭 handler */
const onClick = async (item: DmConversationListItem) => {
  const userId = getUserId()

  // UI 먼저 즉시 반영 (낙관적 업데이트)
  if (item.unreadCount > 0) {
    item.unreadCount = 0
  }

  // 대화방 화면 오픈
  emit('open', item)

  // 백엔드에 읽음 처리 요청
  try {
    await markConversationRead(item.conversationId, userId)
  } catch (e) {
    console.error('읽음 처리 실패', e)
    // 필요하면 여기서만 다시 load()로 동기화
    // await load();
  }
}

watch(
  () => store.needReloadConversationList,
  async () => {
    await load() // 기존 DM 리스트 조회 함수
  }
)

onMounted(load)
</script>

<template>
  <aside class="dm-list">
    <header class="dm-list__header">
      <strong>채팅방</strong>
    </header>

    <ul class="dm-list__body"> 
      <li
        v-for="c in conversations"
        :key="c.conversationId"
        class="dm-item"
        @click="onClick(c)"
      >
        <!-- 프로필 -->
        <div class="avatar">
          <!-- <img
            v-if="c.peerProfileImagePath"
            :src="getProfileImg(c.peerGenderFlag, c.peerProfileImagePath)"
            class="avatar-img"
          />
          <div v-else class="avatar-fallback">
            {{ c.peerUserName?.charAt(0) }}
          </div>
        </div> -->
         <img
            :src="getProfileImg(c.peerGenderFlag, c.peerProfileImagePath)"
            class="avatar-img" />
        </div>

        <!-- 본문 -->
        <div class="content">
          <div class="top">
            <span class="name">
              {{ c.peerUserName }} ({{ c.peerUserNo }})
            </span>
            <span class="time">
              {{ c.lastMessageAt?.slice(11, 16) ?? '' }}
            </span>
          </div>

          <div class="bottom">
            <span class="message">
              {{ c.lastMessage ?? '대화를 시작해보세요' }}
            </span>
            <span v-if="c.unreadCount > 0" class="badge">
              {{ c.unreadCount }}
            </span>
          </div>
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
  max-height: 760px;
  overflow-y: auto;
}

.dm-list__body::-webkit-scrollbar {
  width: 6px;
}

.dm-list__body::-webkit-scrollbar-thumb {
  background-color: #d1d5db;
  border-radius: 6px;
}

.dm-item {
  display: flex;
  gap: 10px;
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

.avatar {
  width: 40px;
  height: 40px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  flex: 1;
  min-width: 0;
}

</style>
