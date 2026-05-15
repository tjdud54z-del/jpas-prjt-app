<script setup lang="ts">
import {
  createUser,
  updateUser,
  uploadProfileImage,
  type UserCommandParams,
} from '@/api/userApi'
import { onBeforeUnmount, ref } from 'vue'

import { useAlert } from '@/composables/useAlert'
import { useConfirm } from '@/composables/useConfirm'

import ElButton from '@/components/common/ElButton.vue'
import ElDatePicker from '@/components/common/ElDatePicker.vue'
import ElInputText from '@/components/common/ElInputText.vue'
import ElSelectBox from '@/components/common/ElSelectBox.vue'

/** 모달 메세지창 */
const { openConfirm } = useConfirm()
const { openAlert } = useAlert()

/** 폼 */
const userForm = ref<UserCommandParams>({
  userNo: '',
  password: '',
  name: '',
  email: '',
  genderFlag: '',
  phoneNumber: '',
  birthDate: '',
  addressMain: '',
  addressSub: '',
  userType: 'U',
  activeYn: 'Y',
  profileImagePath: null,
})

const genderOptions = [
  { label: '남자', value: 'M' },
  { label: '여자', value: 'W' }
]
const userTypeOptions = [
  { label: '유저', value: 'U' },
  { label: '직원', value: 'E' }
]
const activeOptions = [
  { label: '정상', value: 'Y' },
  { label: '탈퇴', value: 'N' }
]

/** 업로더 상태 */
const MAX_MB = 2
const MAX_BYTES = MAX_MB * 1024 * 1024
const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const dragActive = ref(false)
const errorMsg = ref('')
const uploading = ref(false)
const uploadProgress = ref(0)

const fileInput = ref<HTMLInputElement | null>(null)

/** 등록 전에는 업로드 못하므로, 파일은 "보관만" */
const selectedFile = ref<File | null>(null)

/** 미리보기: 선택한 파일이 있으면 로컬 미리보기, 없으면 기존 경로 */
const rawObjectUrl = ref('')
const previewUrl = ref('')

/** 삭제 UX: 저장 시 profileImagePath를 null로 반영 */
const profileImageDeleted = ref(false)

/** URL 정리 */
const revokeUrl = (url: string) => {
  try { if (url) URL.revokeObjectURL(url) } catch {}
}
onBeforeUnmount(() => {
  revokeUrl(rawObjectUrl.value)
})

/** validation */
const validateFile = (file: File) => {
  if (!ACCEPT_TYPES.includes(file.type)) return '이미지 파일만 업로드 가능합니다. (jpg/png/webp)'
  if (file.size > MAX_BYTES) return `파일 용량은 ${MAX_MB}MB 이하만 가능합니다.`
  return ''
}

/** 파일 선택 버튼 */
const triggerFileSelect = () => fileInput.value?.click()

/** 파일 선택/드롭: 업로드 X, 보관 + 미리보기만 */
const handlePickedFile = (file: File) => {
  const v = validateFile(file)
  if (v) {
    errorMsg.value = v
    return
  }
  errorMsg.value = ''

  selectedFile.value = file
  profileImageDeleted.value = false

  revokeUrl(rawObjectUrl.value)
  rawObjectUrl.value = URL.createObjectURL(file)
  previewUrl.value = rawObjectUrl.value
}

/** input change */
const onInputChange = (e: any) => {
  const file = e.target.files?.[0]
  e.target.value = null
  if (file) handlePickedFile(file)
}

/** Drag & Drop */
const onDragEnter = () => dragActive.value = true
const onDragOver = () => dragActive.value = true
const onDragLeave = () => dragActive.value = false
const onDrop = (e: DragEvent) => {
  dragActive.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) handlePickedFile(file)
}

/** 삭제 버튼 */
const removeProfileImage = () => {
  selectedFile.value = null
  revokeUrl(rawObjectUrl.value)
  rawObjectUrl.value = ''
  previewUrl.value = ''

  userForm.value.profileImagePath = null
  profileImageDeleted.value = true
}

/** 저장: 등록 → (선택시) 업로드 → 업데이트 */
const saveUser = async () => {
  // 필수값 간단 체크(원하시면 더 촘촘히)
  if (!userForm.value.userNo || !userForm.value.password || !userForm.value.name || !userForm.value.email) {
    errorMsg.value = '필수값(유저ID/비밀번호/이름/이메일)을 입력하세요.'
    return
  }

  errorMsg.value = ''
  uploading.value = true
  uploadProgress.value = 0

  const ok = await openConfirm('유저를 등록하시겠습니까??')
  if (!ok) return

  try {
    // 1) 유저 등록
    const createRes = await createUser({
      ...userForm.value,
      // 등록 시점에 삭제 표시면 null로
      profileImagePath: profileImageDeleted.value ? null : userForm.value.profileImagePath ?? null,
    })
    const newUserId = createRes.data

    // 2) 이미지 업로드(선택한 파일이 있는 경우에만)
    if (selectedFile.value) {
      const uploadRes = await uploadProfileImage(selectedFile.value, newUserId, (p) => {
        uploadProgress.value = p
      })

      // 3) 업로드 경로 반영 업데이트
      await updateUser({
        ...userForm.value,
        userId: newUserId,
        profileImagePath: profileImageDeleted.value ? null : uploadRes.data,
      })

      // 화면에도 반영(유지 UX)
      userForm.value.profileImagePath = profileImageDeleted.value ? null : uploadRes.data
      previewUrl.value = profileImageDeleted.value ? '' : uploadRes.data
      selectedFile.value = null
      revokeUrl(rawObjectUrl.value)
      rawObjectUrl.value = ''
    } else {
      // 이미지 선택 안했으면: 기존 경로 유지(또는 삭제표시면 null)
      userForm.value.profileImagePath = profileImageDeleted.value ? null : (userForm.value.profileImagePath ?? null)
    }

    alert('저장 완료')

    await openAlert('유저등록이 완료되었습니다.')

    resetForm()

  } catch (e: any) {
    console.error(e)
    errorMsg.value = e?.response?.data?.message || '저장 중 오류가 발생했습니다.'
  } finally {
    uploading.value = false
  }
}

/** 초기화 */
const resetForm = () => {
  userForm.value = {
    userNo: '',
    password: '',
    name: '',
    email: '',
    genderFlag: '',
    phoneNumber: '',
    birthDate: '',
    addressMain: '',
    addressSub: '',
    userType: 'U',
    activeYn: 'Y',
    profileImagePath: null,
  }

  selectedFile.value = null
  profileImageDeleted.value = false
  errorMsg.value = ''
  uploadProgress.value = 0

  revokeUrl(rawObjectUrl.value)
  rawObjectUrl.value = ''
  previewUrl.value = ''
}
</script>

<template>
  <div class="card">
    <div class="page-header flex-header">
      <div class="page-title">유저 등록</div>
      <div class="header-actions">
        <ElButton type="primary" size="md" label="저장" @click="saveUser" />
        <ElButton type="secondary" size="md" label="초기화" @click="resetForm" />
      </div>
    </div>

    <div class="custom-content">
      <div class="search-bar" style="flex-direction: column; align-items: stretch;">

        <!-- 업로더 -->
        <div
          class="profile-uploader"
          :class="{ 'is-drag': dragActive, 'is-error': !!errorMsg }"
          @dragenter.prevent="onDragEnter"
          @dragover.prevent="onDragOver"
          @dragleave.prevent="onDragLeave"
          @drop.prevent="onDrop"
        >
          <div class="profile-left">
            <div class="profile-image">
              <img
                :src="previewUrl || userForm.profileImagePath || '/images/default-profile.png'"
                alt="profile"
              />
            </div>

            <div class="profile-meta">
              <div class="profile-title">프로필 이미지</div>

              <!-- 기존 이미지 유지 UX 문구 -->
              <div class="profile-desc">
                <span v-if="profileImageDeleted">삭제로 표시됨(저장 시 반영)</span>
                <span v-else-if="selectedFile">이미지 선택됨(저장 시 업로드)</span>
                <span v-else-if="userForm.profileImagePath">현재 이미지 유지 중(변경 시 새 이미지 선택)</span>
                <span v-else>드래그&드롭 또는 버튼 선택 ({{ MAX_MB }}MB 이하)</span>
              </div>

              <div class="profile-actions">
                <input
                  ref="fileInput"
                  class="hidden-file-input"
                  type="file"
                  accept="image/*"
                  @change="onInputChange"
                />
                <ElButton type="secondary" size="sm" label="이미지 선택" :disabled="uploading" @click="triggerFileSelect" />
                <ElButton
                  type="danger"
                  size="sm"
                  label="삭제"
                  :disabled="uploading || (!selectedFile && !userForm.profileImagePath)"
                  @click="removeProfileImage"
                />
              </div>

              <div v-if="errorMsg" class="error-text">{{ errorMsg }}</div>

              <div v-if="uploading" class="progress-wrap">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                </div>
                <div class="progress-text">처리 중... {{ uploadProgress }}%</div>
              </div>
            </div>
          </div>

          <div class="drop-hint">
            <span v-if="dragActive">여기에 놓기</span>
            <span v-else>Drag & Drop</span>
          </div>
        </div>

        <!-- 기존 폼 -->
        <div class="form-grid cols-4">
          <div class="form-field"><label>유저ID *</label><ElInputText v-model="userForm.userNo" /></div>
          <div class="form-field"><label>비밀번호 *</label><ElInputText v-model="userForm.password" type="password" /></div>
          <div class="form-field"><label>이름 *</label><ElInputText v-model="userForm.name" /></div>
          <div class="form-field"><label>이메일 *</label><ElInputText v-model="userForm.email" /></div>

          <div class="form-field"><label>성별</label><ElSelectBox v-model="userForm.genderFlag" :options="genderOptions" /></div>
          <div class="form-field"><label>전화번호</label><ElInputText v-model="userForm.phoneNumber" /></div>
          <div class="form-field"><label>생년월일 *</label><ElDatePicker v-model="userForm.birthDate" /></div>

          <div class="form-field"><label>유형</label><ElSelectBox v-model="userForm.userType" :options="userTypeOptions" /></div>
          <div class="form-field"><label>상태</label><ElSelectBox v-model="userForm.activeYn" :options="activeOptions" /></div>

          <div class="form-field" style="grid-column: span 2;">
            <label>주소</label><ElInputText v-model="userForm.addressMain" />
          </div>
          <div class="form-field" style="grid-column: span 2;">
            <label>상세주소</label><ElInputText v-model="userForm.addressSub" />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* 꼭 필요한 것만 남김 */
.flex-header { display:flex; justify-content:space-between; align-items:center; }
.header-actions { display:flex; gap:8px; }
.hidden-file-input { display:none; }

.profile-uploader{
  border:1px dashed #d1d5db;
  border-radius:10px;
  padding:14px;
  background:#fafafa;
  display:flex;
  justify-content:space-between;
  align-items:center;
  transition: all .15s ease;
  margin-bottom: 16px;
}
.profile-uploader.is-drag{ border-color:#6366f1; background:#eef2ff; }
.profile-uploader.is-error{ border-color:#ef4444; background:#fff1f2; }

.profile-left{ display:flex; gap:14px; align-items:center; }
.profile-image{
  width:76px; height:76px; border-radius:50%;
  overflow:hidden; border:1px solid #e5e7eb; background:#fff;
}
.profile-image img{ width:100%; height:100%; object-fit:cover; }

.profile-meta{ display:flex; flex-direction:column; gap:6px; }
.profile-title{ font-weight:700; color:#111827; }
.profile-desc{ font-size:12px; color:#6b7280; }
.profile-actions{ display:flex; gap:8px; margin-top:6px; }

.drop-hint{ font-size:12px; color:#6b7280; }
.error-text{ color:#ef4444; font-size:12px; margin-top:2px; }

.progress-wrap{ margin-top:6px; }
.progress-bar{ width: 220px; height: 8px; border-radius:999px; background:#e5e7eb; overflow:hidden; }
.progress-fill{ height:100%; background:#22c55e; transition: width .1s linear; }
.progress-text{ font-size:12px; color:#374151; margin-top:4px; }
</style>