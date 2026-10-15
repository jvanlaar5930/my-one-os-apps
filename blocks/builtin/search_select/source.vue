<script lang="ts">
import type { BlockDefinition } from '../types'
import { checkSourceSearch } from '../described/sourceBlocks'

export const definition: BlockDefinition = {
  key: 'search_select', label: 'Search and select', summary: 'Live autocomplete from a declared source; copies selected result fields into saved records.',
  options: {
    source: { kind: 'source', required: true }, results: { kind: 'collection', required: true },
    query_param: { kind: 'text', max: 40, required: true },
    title: { kind: 'field', in: { from: 'option', name: 'results' }, types: ['text', 'longText', 'choice'], required: true },
    subtitle: { kind: 'field', in: { from: 'option', name: 'results' } },
    to: { kind: 'collection', required: true },
    copy: { kind: 'fieldMap', in: { from: 'option', name: 'results' }, required: true },
    label: { kind: 'text', max: 80 }, min_chars: { kind: 'number', min: 2, max: 10, integer: true }, limit: { kind: 'number', min: 1, max: 25, integer: true },
    then: { kind: 'screen', passes: { from: 'item', of: { from: 'option', name: 'to' } } },
  },
  check: checkSourceSearch,
  example: { block: 'search_select', source: 'lookup', results: 'items', query_param: 'name', title: 'name', to: 'saved', copy: { name: 'name' } },
}
</script>

<script setup lang="ts">
import type { BlockProps } from '../types'
import { optionText } from '../described/blockRuntime'
import { useSourceSearch } from '../described/sourceBlocks'
import { displayValue } from '../described/values'
const props = defineProps<BlockProps>()
const { query, loading, saving, message, error, matches, minimum, search, choose } = useSourceSearch(props)
</script>

<template>
  <section class="source-search" :aria-busy="loading || saving">
    <label>{{ optionText(options, 'label') || 'Search to add an item' }}<input v-model="query" data-test="query" type="search" autocomplete="off" @keydown.enter.prevent="search" /></label>
    <p v-if="loading" role="status">Searching…</p>
    <p v-else-if="query.trim().length < minimum" class="muted">Type at least {{ minimum }} characters.</p>
    <p v-else-if="message" role="status">{{ message }}</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <ul v-if="matches.length">
      <li v-for="record in matches" :key="record.id"><button data-test="select" type="button" :disabled="saving || loading" @click="choose(record)">
        <span>{{ displayValue(record[optionText(options, 'title')]) }}</span>
        <small v-if="options.subtitle">{{ displayValue(record[optionText(options, 'subtitle')]) }}</small>
        <span class="muted">Add</span>
      </button></li>
    </ul>
  </section>
</template>

<style scoped>
.source-search { color: var(--d-fg); font-family: var(--d-font); }
label { display: flex; flex-direction: column; gap: calc(var(--d-space) / 2); }
input, button { font: inherit; color: var(--d-fg); border: 1px solid var(--d-border); background: var(--d-surface); border-radius: var(--d-radius); padding: var(--d-space); }
button { display: flex; gap: var(--d-space); align-items: center; width: 100%; text-align: left; cursor: pointer; }
button:disabled { opacity: 0.6; cursor: wait; }
button:focus-visible, input:focus-visible { outline: 2px solid var(--d-accent); outline-offset: 2px; }
ul { list-style: none; padding: 0; display: grid; gap: calc(var(--d-space) / 2); }
small, .muted { color: var(--d-muted); }
</style>
