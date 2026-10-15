<script lang="ts">
import type { BlockDefinition } from '../types'

export const definition: BlockDefinition = {
  key: 'table', label: 'Table', summary: 'Searchable collection columns with field labels, formatting and optional record navigation.',
  options: {
    of: { kind: 'collection', required: true },
    columns: { kind: 'fields', in: { from: 'option', name: 'of' }, required: true },
    title: { kind: 'text', max: 80 },
    search: { kind: 'fields', in: { from: 'option', name: 'of' }, types: ['text', 'longText'] },
    filter: { kind: 'filter', in: { from: 'option', name: 'of' } },
    sort: { kind: 'group', options: { by: { kind: 'field', in: { from: 'parent', name: 'of' }, required: true }, dir: { kind: 'oneOf', values: ['asc', 'desc'] } } },
    open: { kind: 'screen', passes: { from: 'item', of: { from: 'option', name: 'of' } } },
    limit: { kind: 'number', min: 1, max: 500, integer: true },
  },
  example: { block: 'table', of: 'items', columns: ['name'] },
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BlockProps } from '../types'
import { listOptions, optionFields, optionText } from '../described/blockRuntime'
import { displayValue } from '../described/values'

const props = defineProps<BlockProps>()
const query = ref('')
const collection = computed(() => optionText(props.options, 'of'))
const columns = computed(() => optionFields(props.options, 'columns'))
const fields = computed(() => props.ctx.fields(collection.value))
const searchable = computed(() => optionFields(props.options, 'search'))
const records = computed(() => {
  const rows = props.ctx.data.list(collection.value, listOptions(props.options)).value
  const term = query.value.trim().toLocaleLowerCase()
  return term ? rows.filter((row) => searchable.value.some((field) => displayValue(row[field]).toLocaleLowerCase().includes(term))) : rows
})
const limit = computed(() => typeof props.options.limit === 'number' ? props.options.limit : 100)
const rows = computed(() => records.value.slice(0, limit.value))
const open = computed(() => optionText(props.options, 'open'))
</script>

<template>
  <section class="record-table">
    <label v-if="searchable.length" class="search">Search <input v-model="query" type="search" /></label>
    <div class="scroll">
      <table>
        <caption>{{ optionText(options, 'title') || 'Records' }}</caption>
        <thead><tr><th v-for="field in columns" :key="field" scope="col">{{ fields[field]?.label || field }}</th></tr></thead>
        <tbody>
          <tr v-for="record in rows" :key="record.id">
            <td v-for="(field, index) in columns" :key="field">
              <button v-if="open && index === 0" type="button" @click="ctx.open(open, record)">{{ displayValue(record[field], fields[field]) || 'Open record' }}</button>
              <template v-else>{{ displayValue(record[field], fields[field]) }}</template>
            </td>
          </tr>
          <tr v-if="!records.length"><td :colspan="columns.length">No matching records.</td></tr>
        </tbody>
      </table>
    </div>
    <p v-if="records.length > limit" role="status">Showing {{ rows.length }} of {{ records.length }}.</p>
  </section>
</template>

<style scoped>
.record-table { color: var(--d-fg); font-family: var(--d-font); }
.scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; }
caption { text-align: left; font-weight: 600; padding: var(--d-space) 0; }
th, td { padding: var(--d-space); border-bottom: 1px solid var(--d-border); overflow-wrap: anywhere; }
th { background: var(--d-surface2); }
td { background: var(--d-surface); }
input, button { font: inherit; color: var(--d-fg); background: var(--d-surface); border: 1px solid var(--d-border); border-radius: var(--d-radius); padding: calc(var(--d-space) / 2); }
button { cursor: pointer; }
button:focus-visible, input:focus-visible { outline: 2px solid var(--d-accent); outline-offset: 2px; }
.search { display: flex; gap: var(--d-space); align-items: center; }
p { color: var(--d-muted); }
</style>
