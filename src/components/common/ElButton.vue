
<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  type?: 'primary' | 'secondary' | 'danger' | 'success'
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'click'): void
}>()

const buttonClass = computed(() => {
  return [
    'btn',
    props.type ? `btn-${props.type}` : 'btn-primary'
  ]
})
</script>

<template>
  <button
    :class="buttonClass"
    :disabled="disabled"
    @click="emit('click')"
  >
    <slot />
  </button>
</template>
