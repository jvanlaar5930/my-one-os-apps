<script lang="ts">
import type { BlockDefinition } from '../types'
import { checkCollectionRefresh } from '../described/sourceBlocks'

export const definition: BlockDefinition = {
  key: 'collection_refresh', label: 'Refresh saved items', summary: 'Refreshes a scoped source for each saved record using field-to-parameter bindings, with progress and honest errors.',
  options: {
    of: { kind: 'collection', required: true }, source: { kind: 'source', required: true },
    params: { kind: 'fieldMap', in: { from: 'option', name: 'of' }, required: true },
    filter: { kind: 'filter', in: { from: 'option', name: 'of' } }, label: { kind: 'text', max: 80 },
  },
  check: checkCollectionRefresh,
  example: { block: 'collection_refresh', of: 'saved', source: 'details', params: { name: 'name' } },
}
</script>

<script setup lang="ts">
import type { BlockProps } from '../types'
import { optionText } from '../described/blockRuntime'
import { useCollectionRefresh } from '../described/sourceBlocks'
const props = defineProps<BlockProps>()
const { running, message, error, refresh } = useCollectionRefresh(props)
</script>

<template>
  <section class="collection-refresh" :aria-busy="running">
    <button type="button" :disabled="running" @click="refresh">{{ optionText(options, 'label') || 'Refresh saved items' }}</button>
    <p v-if="message" role="status">{{ message }}</p><p v-if="error" role="alert">{{ error }}</p>
  </section>
</template>

<style scoped>
.collection-refresh { color: var(--d-fg); font-family: var(--d-font); }
button { font: inherit; cursor: pointer; color: var(--d-accent-fg); background: var(--d-accent); border: 1px solid var(--d-accent); border-radius: var(--d-radius); padding: var(--d-space); }
button:disabled { opacity: 0.6; cursor: wait; }
button:focus-visible { outline: 2px solid var(--d-accent); outline-offset: 2px; }
p { margin-bottom: 0; }
</style>
