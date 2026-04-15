<template>
  <transition name="modal-fade">
    <div
      v-if="isShow"
      class="modal-backdrop"
      @keydown.tab.prevent="handleTab">
      <div
        class="modal"
        ref="modalRef"
        tabindex="-1">
        <p class="message">{{ message }}</p>
        <div class="actions">
          <button
            ref="cancelBtn"
            class="btn cancel"
            @click="onCancel">
            취소
          </button>
          <button
            ref="confirmBtn"
            class="btn confirm"
            @click="onConfirm">
            확인
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps<{
  isShow: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}>()

/* refs */
const cancelBtn = ref<HTMLButtonElement | null>(null)
const confirmBtn = ref<HTMLButtonElement | null>(null)

let focusableEls: HTMLElement[] = []
let currentIndex = 0

/* Tab 포커스 순환 */
const handleTab = (e: KeyboardEvent) => {
  if (!props.isShow || focusableEls.length === 0) return

  if (e.shiftKey) {
    currentIndex =
      currentIndex === 0 ? focusableEls.length - 1 : currentIndex - 1
  } else {
    currentIndex =
      currentIndex === focusableEls.length - 1 ? 0 : currentIndex + 1
  }

  focusableEls[currentIndex].focus()
}

/* 모달 열릴 때 포커스 초기화 */
watch(
  () => props.isShow,
  async (show) => {
    if (show) {
      await nextTick()

      focusableEls = [cancelBtn.value!, confirmBtn.value!]
      currentIndex = 0

      // 첫 포커스
      cancelBtn.value?.focus()
    }
  }
)

onBeforeUnmount(() => {
  focusableEls = []
})
</script>

<style scoped>
/* 배경 */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

/* 모달 박스 */
.modal {
  background: #fff;
  border-radius: 8px;
  padding: 20px 24px;
  width: 320px;
}

/* 메시지 */
.message {
  margin-bottom: 20px;
  font-size: 15px;
  white-space: pre-line;
}

/* 버튼 */
.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
}

.confirm {
  background: #4f46e5;
  color: #fff;
}

.cancel {
  background: #e5e7eb;
}

/* ============================= */
/* Transition 애니메이션 */
/* ============================= */

/* 전체 페이드 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* 모달 박스 scale */
.modal-fade-enter-active .modal,
.modal-fade-leave-active .modal {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.modal-fade-enter-from .modal,
.modal-fade-leave-to .modal {
  transform: scale(0.95);
  opacity: 0;
}
</style>