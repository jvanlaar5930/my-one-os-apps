<script lang="ts">
import type { BlockDefinition } from '../types'
import Button, { definition as button } from './button.vue'

export const definition: BlockDefinition = {
  key: 'button_group',
  label: 'Button group',
  summary: 'Multiple buttons arranged side by side or stacked, each with its own actions.',
  options: {
    layout: { kind: 'oneOf', values: ['side_by_side', 'stacked'], required: true },
    buttons: { kind: 'array', min: 1, max: 12, required: true, options: button.options },
  },
  example: { block: 'button_group', layout: 'side_by_side', buttons: [
    { label: 'First button', action: { do: 'open', screen: 'home' } },
    { label: 'Second button', action: { do: 'open', screen: 'home' } },
  ] },
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import type { BlockProps } from '../types'
import { isPlainObject } from '../described/format'

const props = defineProps<BlockProps>()
const buttons = computed(() => Array.isArray(props.options.buttons) ? props.options.buttons.filter(isPlainObject).slice(0, 12) : [])
</script>

<template>
  <div class="button-group" :class="{ stacked: options.layout === 'stacked' }" role="group" aria-label="Button group">
    <Button v-for="(button, index) in buttons" :key="index" :options="button" :ctx="ctx" />
  </div>
</template>

<style scoped>
.button-group { display: flex; flex-wrap: wrap; gap: calc(var(--d-space) / 2); justify-content: var(--d-button-align, flex-start); }
.button-group > * { min-width: 0; max-width: 100%; }
.button-group.stacked { flex-direction: column; align-items: var(--d-button-align, flex-start); }
.button-group.stacked > * { width: var(--d-button-width, auto); }
</style>
