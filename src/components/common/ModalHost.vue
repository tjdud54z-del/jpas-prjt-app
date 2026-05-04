<script setup lang="ts">
import { useAlert } from '@/composables/useAlert';
import { useConfirm } from '@/composables/useConfirm';
import { computed } from 'vue';

const alertModal = useAlert();
const confirmModal = useConfirm();

const isShow = computed(() => alertModal.isShow.value || confirmModal.isShow.value);

const message = computed(() => (alertModal.isShow.value ? alertModal.message.value : confirmModal.message.value));

const isConfirm = computed(() => confirmModal.isShow.value);
</script>

<template>
    <Transition name="modal">
        <div v-if="isShow" class="modal-backdrop">
            <div class="modal-box">
                <h3 class="logo-text">알림창</h3>
                <div class="confirm-message">
                    {{ message }}
                </div>

                <div class="actions">
                    <!-- Alert -->
                    <Button v-if="!isConfirm" label="확인" Raised @click="alertModal.resolver()" />
                    <!-- Confirm -->
                    <template v-else>
                        <Button label="취소" severity="secondary" Raised @click="confirmModal.rejecter(false)" />
                        <Button label="확인" Raised @click="confirmModal.resolver(true)" />
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
    z-index: 9998;
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

.confirm-message {
    white-space: pre-line;
}

.logo-text {
    font-size: 24px;
    font-weight: bold;
    font-family: 'Courier New', Courier, monospace;
    white-space: nowrap; /* 줄바꿈 방지 (사이드바 좁을 때 유용) */
}
</style>
