<script setup lang="ts">
import ElButton from '@/components/common/ElButton.vue';
import ElDatePicker from '@/components/common/ElDatePicker.vue';
import ElInputText from '@/components/common/ElInputText.vue';
import ElModal from '@/components/common/ElModal.vue';
import { reactive, ref } from 'vue';

import { useAlert } from '@/composables/useAlert';
import { useConfirm } from '@/composables/useConfirm';

import { createEmployee } from '@/api/employeeApi';

/** 모달 메세지창 */
const { openConfirm } = useConfirm();
const { openAlert } = useAlert();

const emit = defineEmits<{
  (e: 'saved'): void;
  (e: 'cancel'): void;
}>();

interface EmployeeCreateForm {
  // userNo: string
  password: string;
  name: string;
  departmentCode: string;
  positionCode: string;
  email: string;
  hireDate: string;
}

const form = reactive<EmployeeCreateForm>({
  // userNo: '',
  password: '',
  name: '',
  departmentCode: '',
  positionCode: '',
  email: '',
  hireDate: ''
});

/** 저장 중 중복 클릭 방지 */
const saving = ref(false);

/** (선택) 간단한 프론트 검증 */
function validate(): string | null {
  // if (!form.userNo) return '사번을 입력하세요.'
  if (!form.password) return '패스워드를 입력하세요.';
  if (!form.name) return '이름을 입력하세요.';
  if (!form.departmentCode) return '부서를 입력하세요.';
  if (!form.positionCode) return '직급을 입력하세요.';
  return null;
}

async function submit() {
  const msg = validate();
  if (msg) {
    await openAlert(msg);
    return;
  }

  try {
    saving.value = true;

    const payload = {
      // userNo: form.userNo,
      password: form.password,
      name: form.name,
      departmentCode: form.departmentCode,
      positionCode: form.positionCode,
      email: form.email ?? '',
      hireDate: form.hireDate ?? ''
    };

    const result = await createEmployee(payload);

    await openAlert('저장이 완료되었습니다.');
    emit('saved');
  } catch (err) {
    console.error(err);
    alert('저장 실패 (콘솔 로그 확인)');
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <ElModal size="lg" :closeOnEnter="true" @close="emit('cancel')" @enter="submit">
    <div class="modal-header">직원 등록</div>

    <div class="modal-body">
      <div class="form-grid cols-3">
        <div class="form-field">
          <label>사번</label>
          <ElInputText :disabled="true" placeholder="자동생성" />
        </div>

        <div class="form-field">
          <label>패스워드</label>
          <ElInputText v-model="form.password" placeholder="패스워드 입력하세요." />
        </div>

        <div class="form-field">
          <label>이름</label>
          <ElInputText v-model="form.name" placeholder="이름을 입력하세요." />
        </div>

        <div class="form-field">
          <label>부서</label>
          <ElInputText v-model="form.departmentCode" placeholder="부서를 입력하세요." />
        </div>

        <div class="form-field">
          <label>직급</label>
          <ElInputText v-model="form.positionCode" placeholder="직급을 입력하세요." />
        </div>

        <div class="form-field">
          <label>이메일</label>
          <ElInputText v-model="form.email" placeholder="이메일을 입력하세요." />
        </div>

        <div class="form-field">
          <ElDatePicker v-model="form.hireDate" label="입사일" />
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <ElButton type="secondary" @click="emit('cancel')" :disabled="saving"> 취소 </ElButton>

      <ElButton type="primary" @click="submit" :disabled="saving">
        {{ saving ? '저장중...' : '저장' }}
      </ElButton>
    </div>
  </ElModal>
</template>
