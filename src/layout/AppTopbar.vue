<script setup lang="ts">
import { http } from '@/api/common/http'
import { useLayout } from '@/layout/composables/layout'
import { useConfirm } from 'primevue/useconfirm'
// import { useToast } from 'primevue/usetoast'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppConfigurator from './AppConfigurator.vue'

// DM imports 추가
import { markConversationRead } from '@/api/dmApi'
import DmModal from '@/components/dm/DmModal.vue'
import DmModalPanel from '@/components/dm/DmModalPanel.vue'
import { useDmClient } from '@/composables/useDmClient'
import { useDmStore } from '@/store/dmStore'
import DmConversationList from '@/views/pages/dm/DmConversationList.vue'

const router = useRouter()
const { toggleMenu, toggleDarkMode, isDarkTheme } = useLayout()

/** =========================
 *  Drawer 표시 상태 (기존)
 * ========================= */
const visibleRight = ref(false)

// const toast = useToast()
const confirmPopup = useConfirm()

/** =========================
 *  DM 상태/스토어/소켓
 * ========================= */
// 로그인 사용자
const userInfo = computed(() => {
  const raw = localStorage.getItem('userInfo')
  return raw ? JSON.parse(raw) : {}
})
const myUserId = computed(() => Number(userInfo.value.userId))
const myUserNo = computed(() => userInfo.value.userNo)

// DM 상태
const dmOpen = ref(false)
const activeConversationId = ref<number | null>(null)
const peerUserNo = ref('')
const peerUserId = ref<number>(0)

// Store / Socket
const store = useDmStore()
const { connect, disconnect, connected } = useDmClient()

/** Drawer 리스트 클릭 → Drawer 닫고, 모달 오픈 */
const onOpenFromDrawer = async (item: any) => {
  if (!item?.conversationId) return

  // 1) Drawer 닫기(먼저)
  visibleRight.value = false

  // 2) Drawer 닫힘 애니메이션/포커스 충돌 방지
  await nextTick()

  // 3) 대화방 상태 세팅
  activeConversationId.value = item.conversationId
  peerUserNo.value = item.peerUserNo
  peerUserId.value = item.peerUserId

  // 4) 스토어 active + 메시지 로드
  store.setActiveConversation(item.conversationId)
  await store.fetchMessages(item.conversationId)

  // 5) 모달 오픈
  dmOpen.value = true
}

/** WebSocket 연결 (DM 수신 + 현재 방이면 즉시 읽음 처리) */
onMounted(() => {
  connect((msg: any) => {
    // 내가 보낸 메시지는 제외
    if (String(msg.senderUserId) === String(myUserId.value)) return

    // 메시지 추가
    store.addMessage(msg)

    // 현재 열려 있는 대화방이면 즉시 읽음 처리
    if (store.activeConversationId === msg.conversationId) {
      markConversationRead(msg.conversationId, myUserId.value)
    }
  })
})

onUnmounted(() => {
  disconnect()
})

/** 모달 닫힐 때 목록 갱신 */
watch(dmOpen, (open) => {
  if (!open) {
    store.triggerConversationListReload()
  }
})

/** Drawer 열릴 때도 목록 최신화(선택) */
watch(visibleRight, (open) => {
  if (open) {
    store.triggerConversationListReload()
  }
})

/** =========================
 *  로그아웃 confirm (기존)
 * ========================= */
const confirm = async (event: any) => {
  confirmPopup.require({
    target: event.target,
    message: '로그아웃 하시겠습니까?',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: '취소',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: '로그아웃'
    },
    accept: () => {
      localStorage.clear()
      delete http.defaults.headers.common.Authorization
      router.push('/login')
    },
    reject: () => {}
  })
}
</script>

<template>
  <div class="layout-topbar">
    <div class="layout-topbar-logo-container">
      <button class="layout-menu-button layout-topbar-action" @click="toggleMenu">
        <i class="pi pi-bars"></i>
      </button>

      <router-link to="/dashboard" class="layout-topbar-logo">
        <!-- 여기 로고 SVG는 서영님 기존 그대로 유지 -->
        <!-- ... (생략: 기존 SVG) ... -->
        <span>J-P-A-S</span>
      </router-link>
    </div>

    <div class="layout-topbar-actions">
      <div class="layout-config-menu">
        <button type="button" class="layout-topbar-action" @click="toggleDarkMode">
          <i :class="['pi', { 'pi-moon': isDarkTheme, 'pi-sun': !isDarkTheme }]"></i>
        </button>

        <div class="relative">
          <button
            v-styleclass="{
              selector: '@next',
              enterFromClass: 'hidden',
              enterActiveClass: 'p-anchored-overlay-enter-active',
              leaveToClass: 'hidden',
              leaveActiveClass: 'p-anchored-overlay-leave-active',
              hideOnOutsideClick: true
            }"
            type="button"
            class="layout-topbar-action layout-topbar-action-highlight"
          >
            <i class="pi pi-palette"></i>
          </button>
          <AppConfigurator />
        </div>
      </div>

      <button
        v-styleclass="{
          selector: '@next',
          enterFromClass: 'hidden',
          enterActiveClass: 'p-anchored-overlay-enter-active',
          leaveToClass: 'hidden',
          leaveActiveClass: 'p-anchored-overlay-leave-active',
          hideOnOutsideClick: true
        }"
        class="layout-topbar-menu-button layout-topbar-action"
      >
        <i class="pi pi-ellipsis-v"></i>
      </button>

      <div class="layout-topbar-menu hidden lg:block">
        <div class="layout-topbar-menu-content">
          <button type="button" class="layout-topbar-action">
            <i class="pi pi-calendar"></i>
            <span>캘린더</span>
          </button>

          <!-- 채팅 버튼 -->
          <button type="button" class="layout-topbar-action" @click="visibleRight = true">
            <i class="pi pi-inbox"></i>
            <span>채팅</span>
          </button>

          <!-- Drawer 안에 채팅 리스트 삽입 -->
          <Drawer
            v-model:visible="visibleRight"
            header="채팅"
            position="right"
            style="width: 336px;"
          >
            <DmConversationList @open="onOpenFromDrawer" />
          </Drawer>

          <button type="button" class="layout-topbar-action">
            <i class="pi pi-user"></i>
            <span>프로필</span>
          </button>

          <button type="button" class="layout-topbar-action" @click="confirm">
            <i class="pi pi-fw pi-sign-in layout-menuitem-icon" style="color: red"></i>
            <span style="color: red">로그아웃</span>
          </button>

          <ConfirmPopup></ConfirmPopup>
        </div>
      </div>
    </div>

    <!-- Drawer와 별개로 모달은 Topbar 루트에 렌더링(Overlay가 안정적) -->
    <DmModal v-model:open="dmOpen">
      <DmModalPanel
        v-if="activeConversationId"
        :connected="connected"
        :my-user-id="myUserId"
        :my-user-no="myUserNo"
        :peer-user-id="peerUserId"
        :peer-user-no="peerUserNo"
        :conversation-id="activeConversationId"
        @update:open="dmOpen = $event"
      />
    </DmModal>
  </div>
</template>