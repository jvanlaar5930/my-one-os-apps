<script setup lang="ts">
defineProps<{ name: 'shuffle' | 'star' | 'clock' | 'people' | 'arrow' }>();
</script>
<template>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name === 'shuffle'"><path d="M3 7h3c4 0 8 10 12 10h3M3 17h3c2 0 4-3 6-6s4-4 6-4h3"/><path d="m18 4 3 3-3 3m0 4 3 3-3 3"/></template>
    <path v-else-if="name === 'star'" d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9Z"/>
    <template v-else-if="name === 'clock'"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></template>
    <template v-else-if="name === 'people'"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m2-15a3 3 0 0 1 0 6m1 3a5 5 0 0 1 3 4v2"/></template>
    <path v-else d="M4 12h16m-6-6 6 6-6 6"/>
  </svg>
</template>
<style scoped>
svg { width: 18px; height: 18px; flex: 0 0 auto; }
</style>
