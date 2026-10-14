<script lang="ts">
import type { BlockDefinition } from '../types'

export const definition: BlockDefinition = {
  key: 'button',
  label: 'Button',
  summary: 'Runs an action or a sequence of actions.',
  options: {
    label: { kind: 'text', max: 40, required: true },
    action: { kind: 'action', required: true },
  },
  example: { block: 'button', label: 'Go', action: { do: 'open', screen: 'home' } },
}
</script>

<script setup lang="ts">
import { ref } from 'vue'
import type { BlockProps } from '../types'
import { optionText, runBlockAction } from '../described/blockRuntime'

const props = defineProps<BlockProps>()
const running = ref(false)

async function run() {
  if (running.value) return
  running.value = true
  try {
    await runBlockAction(props.options, props.ctx)
  } finally {
    running.value = false
  }
}
</script>

<template>
  <div class="button-row"><button type="button" :disabled="running" @click="run">{{ optionText(options, 'label') }}</button></div>
</template>

<style scoped>
.button-row { display: flex; justify-content: var(--d-button-align, flex-start); }
button {
  align-self: flex-start;
  box-sizing: border-box;
  max-width: 100%;
  width: var(--d-button-width, auto);
  min-height: var(--d-button-height, auto);
  overflow-wrap: anywhere;
  border: 1px solid var(--d-button-border, var(--d-button-color, var(--d-accent)));
  background: var(--d-button-background, var(--d-button-color, var(--d-accent)));
  color: var(--d-block-text, var(--d-button-foreground, var(--d-accent-fg)));
  border-radius: var(--d-radius);
  padding: var(--d-button-padding, calc(var(--d-space) / 2) var(--d-space));
  font: inherit;
  font-size: var(--d-button-font-size, inherit);
  cursor: pointer;
  box-shadow: var(--d-shadow);
}
button:disabled { opacity: 0.6; cursor: wait; }
button:focus-visible { outline: 2px solid var(--d-accent); outline-offset: 2px; box-shadow: var(--d-glow); }
</style>
