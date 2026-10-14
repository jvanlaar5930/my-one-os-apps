<script lang="ts">
import type { BlockDefinition } from '../types'

export const definition: BlockDefinition = {
  key: 'plot', label: 'Plot', summary: 'Compare numeric series as line, grouped bar or area charts.',
  options: {
    of: { kind: 'collection', required: true },
    x: { kind: 'field', in: { from: 'option', name: 'of' }, types: ['date', 'text', 'choice'], required: true },
    y: { kind: 'field', in: { from: 'option', name: 'of' }, types: ['number'], required: true },
    series: { kind: 'field', in: { from: 'option', name: 'of' }, types: ['text', 'choice'] },
    type: { kind: 'oneOf', values: ['line', 'bar', 'area'], required: true },
    title: { kind: 'text', max: 120 },
    unit: { kind: 'text', max: 20 },
    aggregate: { kind: 'oneOf', values: ['sum', 'mean', 'min', 'max'] },
    limit: { kind: 'number', min: 1, max: 120, integer: true },
    filter: { kind: 'filter', in: { from: 'option', name: 'of' } },
  },
  example: { block: 'plot', of: 'habits', x: 'name', y: 'goal', type: 'bar' },
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import type { BlockProps } from '../types'
import { optionText, plotSeries } from '../described/blockRuntime'

const props = defineProps<BlockProps>()
const data = computed(() => plotSeries(props.options, props.ctx))
const labels = computed(() => [...new Set(data.value.series.flatMap((series) => series.points.map((point) => point.x)))].sort())
const low = computed(() => Math.min(0, ...data.value.series.flatMap((series) => series.points.map((point) => point.value))))
const high = computed(() => Math.max(1, ...data.value.series.flatMap((series) => series.points.map((point) => point.value))))
const y = (value: number) => 110 - (value - low.value) / (high.value - low.value) * 100
const x = (label: string) => 20 + (labels.value.length > 1 ? labels.value.indexOf(label) / (labels.value.length - 1) * 280 : 140)
const zero = computed(() => y(0))
const width = computed(() => 280 / Math.max(1, labels.value.length) / Math.max(1, data.value.series.length))
const drawn = computed(() => data.value.series.map((series, index) => {
  const points = series.points.map((point) => `${x(point.x)},${y(point.value)}`).join(' ')
  const first = series.points[0]
  const last = series.points[series.points.length - 1]
  return { name: series.name, points, area: first && last ? `${x(first.x)},${zero.value} ${points} ${x(last.x)},${zero.value}` : '', bars: series.points.map((point) => ({ ...point, left: 20 + labels.value.indexOf(point.x) * width.value * data.value.series.length + index * width.value, y: Math.min(zero.value, y(point.value)), height: Math.abs(zero.value - y(point.value)), cx: x(point.x), cy: y(point.value) })) }
}))
const title = computed(() => optionText(props.options, 'title') || optionText(props.options, 'y'))
</script>

<template>
  <figure>
    <figcaption>{{ title }}</figcaption>
    <p v-if="!labels.length" class="empty">No records to plot yet.</p>
    <template v-else>
      <svg viewBox="0 0 320 135" role="img" :aria-label="title">
        <line x1="20" x2="300" :y1="zero" :y2="zero" class="axis" />
        <g v-for="(series, index) in drawn" :key="series.name" class="series" :class="{ secondary: index % 3 === 1, tertiary: index % 3 === 2 }">
          <template v-if="options.type === 'bar'">
            <rect v-for="point in series.bars" :key="point.x" :x="point.left + width * 0.1" :y="point.y" :width="width * 0.8" :height="point.height"><title>{{ series.name }} · {{ point.x }}: {{ point.display }}</title></rect>
          </template>
          <template v-else>
            <polygon v-if="options.type === 'area'" :points="series.area" class="area" />
            <polyline :points="series.points" class="line" />
            <circle v-for="point in series.bars" :key="point.x" :cx="point.cx" :cy="point.cy" r="1.5"><title>{{ series.name }} · {{ point.x }}: {{ point.display }}</title></circle>
          </template>
        </g>
        <text x="20" y="130">{{ labels[0] }}</text>
        <text x="300" y="130" text-anchor="end">{{ labels[labels.length - 1] }}</text>
      </svg>
      <ul class="legend">
        <li v-for="(series, index) in drawn" :key="series.name" class="series" :class="{ secondary: index % 3 === 1, tertiary: index % 3 === 2 }">{{ series.name }}</li>
      </ul>
      <p v-if="data.totalSeries > 8 || data.totalPoints > (typeof options.limit === 'number' ? options.limit : 120)" class="empty">Showing up to 8 of {{ data.totalSeries }} series and {{ labels.length }} of {{ data.totalPoints }} positions.</p>
      <details><summary>Show values</summary><table>
        <thead><tr><th scope="col">Series</th><th scope="col">Position</th><th scope="col">Value</th></tr></thead>
        <tbody><template v-for="series in data.series" :key="series.name"><tr v-for="point in series.points" :key="point.x"><th scope="row">{{ series.name }}</th><td>{{ point.x }}</td><td>{{ point.display }}</td></tr></template></tbody>
      </table></details>
    </template>
  </figure>
</template>

<style scoped>
figure { margin: 0; padding: var(--d-space); background: var(--d-surface); color: var(--d-fg); font-family: var(--d-font); border: 1px solid var(--d-border); border-radius: var(--d-radius); box-shadow: var(--d-shadow); }
figcaption { font-family: var(--d-font-display); font-size: calc(var(--d-space) * 1.25); }
svg { width: 100%; height: calc(var(--d-space) * 14); }
.axis { stroke: var(--d-border); }
.series { color: var(--d-accent); fill: var(--d-accent); stroke: var(--d-accent); }
.secondary { color: var(--d-fg); fill: var(--d-fg); stroke: var(--d-fg); }
.tertiary { color: var(--d-muted); fill: var(--d-muted); stroke: var(--d-muted); }
.line { fill: none; stroke-width: 1.5; }
.area { fill-opacity: 0.15; stroke: none; }
text { fill: var(--d-muted); font-family: var(--d-font); font-size: calc(var(--d-space) * 0.7); }
.legend { display: flex; flex-wrap: wrap; gap: var(--d-space); padding-left: var(--d-space); }
.empty, summary { color: var(--d-muted); }
summary { cursor: pointer; }
summary:focus-visible { outline: 2px solid var(--d-accent); }
table { width: 100%; border-collapse: collapse; margin-top: var(--d-space); }
th, td { text-align: left; padding: calc(var(--d-space) / 4); border-bottom: 1px solid var(--d-border); }
</style>
