
<script setup lang="ts">
import { computed } from 'vue'
import { useAlert } from '@/composables/useAlert'
import { useConfirm } from '@/composables/useConfirm'

const alertModal = useAlert()
const confirmModal = useConfirm()

const isShow = computed(
  () => alertModal.isShow.value || confirmModal.isShow.value
)

const message = computed(() =>
  alertModal.isShow.value
    ? alertModal.message.value
    : confirmModal.message.value
)

const isConfirm = computed(() => confirmModal.isShow.value)
</script>

<template>
  <Transition name="modal">
    <div v-if="isShow" class="modal-backdrop">
      <div class="modal-box">
        <p class="message">{{ message }}</p>

        <div class="actions">
          <!-- Alert -->
          <button
            v-if="!isConfirm"
            @click="alertModal.resolver()"
          >
            확인
          </button>

          <!-- Confirm -->
          <template v-else>
            <button @click="confirmModal.resolver(true)">
              확인
            </button>
            <button @click="confirmModal.rejecter(false)">
              취소
            </button>
          </template>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
/* 배경 + 모달 전체 */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.25s ease;
}

/* 초기 진입 / 나갈 때 */
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

/* backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* 모달 박스 */
.modal-box {
  background: #fff;
  padding: 24px;
  width: 320px;
  border-radius: 8px;
  transform: scale(1);
  transition: transform 0.25s ease;
}

/* scale 애니메이션 */
.modal-enter-from .modal-box {
  transform: scale(0.9);
}

.modal-leave-to .modal-box {
  transform: scale(0.9);
}

.actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
