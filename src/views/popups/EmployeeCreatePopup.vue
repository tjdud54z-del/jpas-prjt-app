
<script setup lang="ts">
import { reactive } from 'vue'
import ElModal from '@/components/common/ElModal.vue'
import ElInputText from '@/components/common/ElInputText.vue';
import ElButton from '@/components/common/ElButton.vue'

const emit = defineEmits<{
  (e: 'submit', form: EmployeeCreateForm): void
  (e: 'cancel'): void
}>()

interface EmployeeCreateForm {
  employeeNo: string
  password: string
  name: string
  departmentCode: string
  positionCode: string
  email?: string
}

const form = reactive<EmployeeCreateForm>({
  employeeNo: '',
  password: '',
  name: '',
  departmentCode: '',
  positionCode: '',
  email: ''
})

const submit = () => {
  emit('submit', { ...form })
}
</script>


<template>
  <ElModal
    size="lg"
    :closeOnEnter="true"
    @close="emit('cancel')"
    @enter="submit" >
    <div class="modal-header">
      직원 등록
    </div>
    <div class="modal-body">
      <div class="form-grid cols-3">
        <div class="form-field">
          <label>사번</label>
          <ElInputText
            v-model="form.employeeNo"
            placeholder="사번을 입력하세요." />
        </div>
        <div class="form-field">
          <label>패스워드</label>
          <ElInputText
            v-model="form.password"
            placeholder="패스워드 입력하세요." />
        </div>
        <div class="form-field">
          <label>이름</label>
          <ElInputText
            v-model="form.name"
            placeholder="이름을 입력하세요."  />
        </div>
        <div class="form-field">
          <label>부서</label>
          <ElInputText
            v-model="form.departmentCode"
            placeholder="부서를 입력하세요."  />
        </div>
        <div class="form-field">
          <label>직급</label>
          <ElInputText
            v-model="form.positionCode"
            placeholder="직급을 입력하세요."  />
        </div>
        <div class="form-field">
          <label>이메일</label>
          <ElInputText
            v-model="form.email"
            placeholder="이메일을 입력하세요."  />
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <ElButton type="secondary" @click="emit('cancel')">
        취소
      </ElButton>
      <ElButton type="primary" @click="submit">
        저장
      </ElButton>
    </div>
  </ElModal>
</template>
