<script lang="ts">
import type { BlockDefinition } from '../types'

export const definition: BlockDefinition = {
  key: 'form',
  label: 'Form',
  summary: "Adds a record, or edits the screen's record if it has one.",
  options: {
    of: { kind: 'collection', required: true },
    fields: { kind: 'fields', in: { from: 'option', name: 'of' }, allowEmpty: true },
    then: { kind: 'screen', passes: { from: 'none' } },
  },
  example: { block: 'form', of: 'items' },
}
</script>

<script setup lang="ts">
import type { BlockProps, DescribedRecord } from '../types'
import { useBlockForm } from '../described/blockRuntime'
import { displayValue, spoken } from '../described/values'

const props = defineProps<BlockProps>()
const { values, fields, saving, message, save } = useBlockForm(props)

function recordLabel(record: DescribedRecord, collection: string) {
  const key = Object.entries(props.ctx.fields(collection)).find(([, field]) => field.type === 'text')?.[0]
  return key ? displayValue(record[key]) : record.id
}
</script>

<template>
  <form @submit.prevent="save">
    <label v-for="[key, field] in fields" :key="key">
      <span>{{ field.label ?? spoken(key) }}</span>
      <input v-if="field.type === 'boolean'" v-model="values[key]" type="checkbox" :disabled="saving" />
      <select v-else-if="field.type === 'choice' || field.type === 'ref'" v-model="values[key]" :required="field.required" :disabled="saving">
        <option value="">Choose…</option>
        <template v-if="field.type === 'choice'">
          <option v-for="choice in field.options" :key="choice" :value="choice">{{ choice }}</option>
        </template>
        <template v-else>
          <option v-for="record in ctx.data.list(field.ref ?? '').value" :key="record.id" :value="record.id">{{ recordLabel(record, field.ref ?? '') }}</option>
        </template>
      </select>
      <textarea v-else-if="field.type === 'longText'" :value="String(values[key] ?? '')" :required="field.required" :disabled="saving" @input="values[key] = ($event.target as HTMLTextAreaElement).value" />
      <input v-else-if="field.type === 'number'" v-model="values[key]" type="number" :min="field.min" :max="field.max" :step="10 ** -(field.decimals ?? 0)" :required="field.required" :disabled="saving" />
      <input v-else v-model="values[key]" :type="field.type === 'date' ? 'date' : 'text'" :required="field.required" :disabled="saving" />
    </label>
    <p v-if="message" role="status">{{ message }}</p>
    <button type="submit" :disabled="saving">{{ saving ? 'Saving…' : 'Save' }}</button>
  </form>
</template>

<style scoped>
form { display: flex; flex-direction: column; gap: var(--d-space); color: var(--d-fg); font-family: var(--d-font); }
label { display: flex; flex-direction: column; align-items: flex-start; gap: calc(var(--d-space) / 2); }
input, select, textarea { width: 100%; box-sizing: border-box; padding: calc(var(--d-space) / 2) var(--d-space); border: 1px solid var(--d-border); border-radius: var(--d-radius); background: var(--d-surface); color: var(--d-fg); font: inherit; }
input:not([type='checkbox']), select, textarea { padding: var(--d-input-padding, calc(var(--d-space) / 2) var(--d-space)); min-height: var(--d-input-height, auto); font-size: var(--d-input-font-size, inherit); background: var(--d-input-background, var(--d-surface)); }
input[type='checkbox'] { width: var(--d-space); height: var(--d-space); accent-color: var(--d-accent); }
textarea { min-height: calc(var(--d-space) * 6); resize: vertical; }
button { align-self: flex-start; padding: calc(var(--d-space) / 2) var(--d-space); border: 1px solid var(--d-accent); border-radius: var(--d-radius); background: var(--d-accent); color: var(--d-accent-fg); font: inherit; cursor: pointer; }
button:disabled { opacity: 0.6; cursor: wait; }
input:focus-visible, select:focus-visible, textarea:focus-visible, button:focus-visible { outline: 2px solid var(--d-accent); outline-offset: 2px; box-shadow: var(--d-glow); }
p { margin: 0; color: var(--d-muted); }
</style>
