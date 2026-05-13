<script setup lang="ts">
import GlobalLoadingOverlay from '@/components/common/GlobalLoadingOverlay.vue';
import ModalHost from '@/components/common/ModalHost.vue';
</script>

<template>
  <router-view />
  <GlobalLoadingOverlay />
  <ModalHost />
</template>

<style scoped></style>
