
<script setup lang="ts">
// import GlobalLoadingBar from '@/components/common/GlobalLoadingBar.vue'
import GlobalLoadingOverlay from '@/components/common/GlobalLoadingOverlay.vue'
import ModalHost from '@/components/common/ModalHost.vue'
</script>


<template>
  <!-- <GlobalLoadingBar /> -->
  <GlobalLoadingOverlay />
  <ModalHost />
  <router-view />
</template>
