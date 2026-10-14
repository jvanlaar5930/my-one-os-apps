<script lang="ts">
import type { BlockDefinition } from '../types'
import { isPlainObject } from '../described/format'

export const definition: BlockDefinition = {
  key: 'list',
  label: 'List',
  summary: 'Records of a collection, with optional weekly progress.',
  options: {
    of: { kind: 'collection', required: true },
    title: { kind: 'field', in: { from: 'option', name: 'of' }, types: ['text'], required: true },
    subtitle: { kind: 'field', in: { from: 'option', name: 'of' } },
    filter: { kind: 'filter', in: { from: 'option', name: 'of' } },
    sort: { kind: 'group', options: {
      by: { kind: 'field', in: { from: 'parent', name: 'of' }, required: true },
      dir: { kind: 'oneOf', values: ['asc', 'desc'] },
    } },
    search: { kind: 'fields', in: { from: 'option', name: 'of' }, types: ['text', 'longText'] },
    prefix: { kind: 'value' },
    open: { kind: 'screen', passes: { from: 'item', of: { from: 'option', name: 'of' } } },
    add: { kind: 'screen', passes: { from: 'none' } },
    progress: { kind: 'group', options: {
      of: { kind: 'collection', required: true },
      ref: { kind: 'field', in: { from: 'option', name: 'of' }, types: ['ref'], required: true },
      date: { kind: 'field', in: { from: 'option', name: 'of' }, types: ['date'], required: true },
      per: { kind: 'oneOf', values: ['week'], required: true },
      target: { kind: 'field', in: { from: 'parent', name: 'of' }, types: ['number'], required: true },
    } },
  },
  check(options, ctx) {
    const progress = options.progress
    if (!isPlainObject(progress)) return []
    const inner = ctx.resolve({ from: 'option', name: 'of' }, progress)
    const field = inner && typeof progress.ref === 'string' ? ctx.field(inner, progress.ref) : null
    return field && field.ref !== options.of
      ? [{ code: 'B002', severity: 'error', where: 'progress.ref', message: `Progress counts ${inner} by '${String(progress.ref)}', but that doesn't point at ${String(options.of)}.` }]
      : []
  },
  example: { block: 'list', of: 'items', title: 'name' },
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BlockProps, DescribedRecord } from '../types'
import { blockPrefix, listOptions, optionFields, optionText, weeklyProgress } from '../described/blockRuntime'
import { displayValue } from '../described/values'

const props = defineProps<BlockProps>()
const query = ref('')
const collection = computed(() => optionText(props.options, 'of'))
const searchFields = computed(() => optionFields(props.options, 'search'))
const records = computed(() => {
  const items = props.ctx.data.list(collection.value, listOptions(props.options)).value
  const search = query.value.trim().toLocaleLowerCase()
  return search ? items.filter((item) => searchFields.value.some((key) => displayValue(item[key]).toLocaleLowerCase().includes(search))) : items
})
const rows = computed(() => records.value.slice(0, 500))
const progress = computed(() => weeklyProgress(rows.value, props.options, props.ctx))
const open = computed(() => optionText(props.options, 'open'))
const add = computed(() => optionText(props.options, 'add'))

function subtitle(record: DescribedRecord) {
  const key = optionText(props.options, 'subtitle')
  return displayValue(record[key], props.ctx.fields(collection.value)[key], blockPrefix(props.options, props.ctx))
}
</script>

<template>
  <section class="list">
    <div v-if="add || searchFields.length" class="toolbar">
      <input v-if="searchFields.length" v-model="query" type="search" aria-label="Search records" placeholder="Search" />
      <button v-if="add" type="button" @click="ctx.open(add)">Add</button>
    </div>
    <p v-if="!records.length" class="muted">No records yet.</p>
    <ul v-else>
      <li v-for="record in rows" :key="record.id">
        <button v-if="open" type="button" class="row" @click="ctx.open(open, record)">
          <span class="title">{{ displayValue(record[optionText(options, 'title')]) }}</span>
          <span v-if="options.subtitle" class="muted">{{ subtitle(record) }}</span>
          <span v-if="options.progress" class="progress">{{ progress.get(record.id) }}</span>
        </button>
        <div v-else class="row">
          <span class="title">{{ displayValue(record[optionText(options, 'title')]) }}</span>
          <span v-if="options.subtitle" class="muted">{{ subtitle(record) }}</span>
          <span v-if="options.progress" class="progress">{{ progress.get(record.id) }}</span>
        </div>
      </li>
    </ul>
    <p v-if="records.length > 500" class="muted" role="status">Showing 500 of {{ records.length }}.</p>
  </section>
</template>

<style scoped>
.list { color: var(--d-fg); font-family: var(--d-font); }
.toolbar { display: flex; gap: var(--d-space); margin-bottom: var(--d-space); }
input, button { font: inherit; color: var(--d-fg); border: 1px solid var(--d-border); background: var(--d-surface); border-radius: var(--d-radius); padding: calc(var(--d-space) / 2) var(--d-space); }
input { min-width: 0; flex: 1; }
button { cursor: pointer; }
button:focus-visible, input:focus-visible { outline: 2px solid var(--d-accent); outline-offset: 2px; box-shadow: var(--d-glow); }
ul { list-style: none; padding: 0; margin: 0; border: 1px solid var(--d-border); border-radius: var(--d-radius); overflow: hidden; box-shadow: var(--d-shadow); }
li + li { border-top: 1px solid var(--d-border); }
.row { display: flex; flex-direction: column; align-items: flex-start; gap: calc(var(--d-space) / 4); width: 100%; box-sizing: border-box; text-align: left; padding: var(--d-space); border: 0; border-radius: 0; background: var(--d-surface); }
button.row:hover { background: var(--d-surface2); }
.title { overflow-wrap: anywhere; }
.muted { color: var(--d-muted); }
.progress { color: var(--d-accent); }
</style>
