<script lang="ts">
import type { BlockDefinition } from '../types'

export const definition: BlockDefinition = {
  key: 'totals',
  label: 'Totals',
  summary: 'Record counts or sums, optionally by category and current week or month.',
  options: {
    of: { kind: 'collection', required: true },
    sum: { kind: 'field', in: { from: 'option', name: 'of' }, types: ['number'] },
    by: { kind: 'field', in: { from: 'option', name: 'of' }, types: ['choice'] },
    period: { kind: 'group', options: {
      date: { kind: 'field', in: { from: 'parent', name: 'of' }, types: ['date'], required: true },
      per: { kind: 'oneOf', values: ['week', 'month'], required: true },
    } },
    prefix: { kind: 'value' },
  },
  example: { block: 'totals', of: 'items' },
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import type { BlockProps } from '../types'
import { totalRows } from '../described/blockRuntime'

const props = defineProps<BlockProps>()
const rows = computed(() => totalRows(props.options, props.ctx))
</script>

<template>
  <dl class="totals" aria-label="Totals">
    <div v-for="(row, i) in rows" :key="i" class="row" :class="{ overall: i === 0 }">
      <dt>{{ row.label }}</dt>
      <dd>{{ row.display }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.totals { margin: 0; padding: var(--d-space); color: var(--d-fg); font-family: var(--d-font); background: var(--d-surface); border: 1px solid var(--d-border); border-radius: var(--d-radius); box-shadow: var(--d-shadow); }
.row { display: flex; align-items: baseline; justify-content: space-between; gap: var(--d-space); padding: calc(var(--d-space) / 2) 0; }
.row + .row { border-top: 1px solid var(--d-border); }
.overall { font-family: var(--d-font-display); font-size: calc(var(--d-space) * 1.25); }
dt { overflow-wrap: anywhere; }
dd { margin: 0; font-variant-numeric: tabular-nums; }
</style>
