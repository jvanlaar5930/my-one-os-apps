<script lang="ts">
import type { BlockDefinition } from '../types'

export const definition: BlockDefinition = {
  key: 'chart',
  label: 'Chart',
  summary: 'Record counts or sums per day, week or month.',
  options: {
    of: { kind: 'collection', required: true },
    date: { kind: 'field', in: { from: 'option', name: 'of' }, types: ['date'], required: true },
    sum: { kind: 'field', in: { from: 'option', name: 'of' }, types: ['number'] },
    by: { kind: 'oneOf', values: ['day', 'week', 'month'], required: true },
    last: { kind: 'number', min: 1, max: 120, integer: true, required: true },
    prefix: { kind: 'value' },
  },
  example: { block: 'chart', of: 'checkins', date: 'day', by: 'day', last: 30 },
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import type { BlockProps } from '../types'
import { chartPoints } from '../described/blockRuntime'

const props = defineProps<BlockProps>()
const points = computed(() => chartPoints(props.options, props.ctx))
const low = computed(() => Math.min(0, ...points.value.map((point) => point.value)))
const high = computed(() => Math.max(1, ...points.value.map((point) => point.value)))
const y = (value: number) => 100 - (value - low.value) / (high.value - low.value) * 100
const zero = computed(() => y(0))
const barWidth = computed(() => 300 / points.value.length)
const label = computed(() => `Check-ins or totals from ${points.value[0]?.date} to ${points.value[points.value.length - 1]?.date}`)
</script>

<template>
  <figure>
    <figcaption>{{ points[0]?.date }} – {{ points[points.length - 1]?.date }}</figcaption>
    <svg viewBox="0 0 300 105" role="img" :aria-label="label">
      <line x1="0" x2="300" :y1="zero" :y2="zero" />
      <rect v-for="(point, i) in points" :key="point.date" :x="i * barWidth + barWidth * 0.1" :y="Math.min(y(point.value), zero)" :width="barWidth * 0.8" :height="Math.abs(y(point.value) - zero)">
        <title>{{ point.date }}: {{ point.label }}</title>
      </rect>
    </svg>
    <details>
      <summary>Show values</summary>
      <table>
        <thead><tr><th scope="col">Period</th><th scope="col">Total</th></tr></thead>
        <tbody><tr v-for="point in points" :key="point.date"><th scope="row">{{ point.date }}</th><td>{{ point.label }}</td></tr></tbody>
      </table>
    </details>
  </figure>
</template>

<style scoped>
figure { margin: 0; padding: var(--d-space); color: var(--d-fg); font-family: var(--d-font); background: var(--d-surface); border: 1px solid var(--d-border); border-radius: var(--d-radius); box-shadow: var(--d-shadow); }
figcaption { font-family: var(--d-font-display); margin-bottom: var(--d-space); }
svg { width: 100%; height: calc(var(--d-space) * 12); }
rect { fill: var(--d-accent); }
line { stroke: var(--d-border); }
summary { color: var(--d-muted); cursor: pointer; }
summary:focus-visible { outline: 2px solid var(--d-accent); }
table { width: 100%; border-collapse: collapse; margin-top: var(--d-space); }
th, td { padding: calc(var(--d-space) / 4); text-align: left; border-bottom: 1px solid var(--d-border); }
</style>
