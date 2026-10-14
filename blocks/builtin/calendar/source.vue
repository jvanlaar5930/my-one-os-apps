<script lang="ts">
import type { BlockDefinition } from '../types'

export const definition: BlockDefinition = {
  key: 'calendar',
  label: 'Calendar',
  summary: 'A month view marking dates with records.',
  options: {
    of: { kind: 'collection', required: true },
    date: { kind: 'field', in: { from: 'option', name: 'of' }, types: ['date'], required: true },
    filter: { kind: 'filter', in: { from: 'option', name: 'of' } },
  },
  example: { block: 'calendar', of: 'checkins', date: 'day' },
}
</script>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BlockProps } from '../types'
import { listOptions, optionText } from '../described/blockRuntime'
import { dateFromDay, isRealDate, periodStart, shiftPeriod } from '../described/values'

const props = defineProps<BlockProps>()
const month = ref(periodStart(props.ctx.today(), 'month'))
const title = computed(() => dateFromDay(month.value).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }))
const marks = computed(() => new Set(props.ctx.data.list(optionText(props.options, 'of'), listOptions(props.options)).value.map((record) => record[optionText(props.options, 'date')]).filter(isRealDate)))
const days = computed(() => {
  const start = periodStart(month.value, 'week')
  return Array.from({ length: 42 }, (_, i) => {
    const date = shiftPeriod(start, 'day', i)
    return { date, day: Number(date.slice(-2)), inMonth: date.slice(0, 7) === month.value.slice(0, 7), marked: marks.value.has(date) }
  })
})
</script>

<template>
  <section class="calendar" aria-label="Calendar">
    <header>
      <button type="button" aria-label="Previous month" @click="month = shiftPeriod(month, 'month', -1)">‹</button>
      <h3 aria-live="polite">{{ title }}</h3>
      <button type="button" aria-label="Next month" @click="month = shiftPeriod(month, 'month', 1)">›</button>
    </header>
    <div class="grid">
      <span v-for="day in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="day" class="weekday">{{ day }}</span>
      <span v-for="day in days" :key="day.date" class="day" :class="{ outside: !day.inMonth, marked: day.marked, today: day.date === ctx.today() }" :aria-label="`${day.date}${day.marked ? ': done' : ''}`" :aria-current="day.date === ctx.today() ? 'date' : undefined">
        {{ day.day }}<span v-if="day.marked" aria-hidden="true"> ✓</span>
      </span>
    </div>
    <p>✓ Done</p>
  </section>
</template>

<style scoped>
.calendar { padding: var(--d-space); border: 1px solid var(--d-border); border-radius: var(--d-radius); background: var(--d-surface); color: var(--d-fg); font-family: var(--d-font); box-shadow: var(--d-shadow); }
header { display: flex; align-items: center; justify-content: space-between; gap: var(--d-space); margin-bottom: var(--d-space); }
h3 { margin: 0; font-family: var(--d-font-display); font-size: var(--d-space); }
button { border: 1px solid var(--d-border); border-radius: var(--d-radius); padding: calc(var(--d-space) / 4) calc(var(--d-space) / 2); background: var(--d-surface2); color: var(--d-fg); font: inherit; cursor: pointer; }
button:focus-visible { outline: 2px solid var(--d-accent); outline-offset: 2px; box-shadow: var(--d-glow); }
.grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: calc(var(--d-space) / 4); }
.weekday, .day { padding: calc(var(--d-space) / 2) 0; text-align: center; font-size: calc(var(--d-space) * 0.85); }
.weekday, .outside { color: var(--d-muted); }
.marked { background: var(--d-accent); color: var(--d-accent-fg); border-radius: var(--d-radius); }
.today { outline: 1px solid var(--d-accent); outline-offset: 1px; border-radius: var(--d-radius); }
p { margin: var(--d-space) 0 0; color: var(--d-muted); }
</style>
