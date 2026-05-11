<script setup>
import { ref } from 'vue'

const dropdownItems = ref([
  { name: 'Option 1', code: 'Option 1' },
  { name: 'Option 2', code: 'Option 2' },
  { name: 'Option 3', code: 'Option 3' }
])

const dropdownItem = ref(null)
</script>

<template>
  <Fluid>
    <div class="flex mt-8">
      <div class="card flex flex-col gap-4 w-full">
        <div class="font-semibold text-xl">유저등록</div>
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex flex-wrap gap-2 w-full">
            <label for="userNo">ID</label>
            <InputText id="userNo" type="text" />
          </div>
          <div class="flex flex-wrap gap-2 w-full">
            <label for="password">패스워드</label>
            <InputText id="password" type="text" />
          </div>
          <div class="flex flex-wrap gap-2 w-full">
            <label for="email">이메일</label>
            <InputText id="email" type="text" />
          </div>
          <div class="flex flex-wrap gap-2 w-full">
            <label for="birthDate">생년월일</label>
            <InputText id="birthDate" type="text" />
          </div>
        </div>

        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex flex-wrap gap-2 w-full">
            <label for="addressMain">주소</label>
            <InputText id="addressMain" type="text" />
          </div>
          <div class="flex flex-wrap gap-2 w-full">
            <label for="addressSub">주소(상세)</label>
            <InputText id="addressSub" type="text" />
          </div>
        </div>

        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex flex-wrap gap-2 w-full">
            <label for="state">State</label>
            <Select id="state" v-model="dropdownItem" :options="dropdownItems" optionLabel="name" placeholder="Select One" class="w-full"></Select>
          </div>
          <div class="flex flex-wrap gap-2 w-full">
            <label for="zip">Zip</label>
            <InputText id="zip" type="text" />
          </div>
        </div>
      </div>
    </div>
  </Fluid>
</template>
