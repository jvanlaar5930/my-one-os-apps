<script lang="ts">
import type { BlockDefinition } from '../types'

export const definition: BlockDefinition = {
  key: 'heading',
  label: 'Heading',
  summary: "The screen record's field, or fixed text, as a title.",
  options: {
    field: { kind: 'field', in: { from: 'screenRecord' } },
    text: { kind: 'text', max: 80 },
  },
  check(options) {
    return (options.field === undefined) === (options.text === undefined)
      ? [{ code: 'B001', severity: 'error', where: '', message: "A heading shows either 'field' or 'text', exactly one." }]
      : []
  },
  example: { block: 'heading', text: 'Welcome' },
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import type { BlockProps } from '../types'
import { optionText } from '../described/blockRuntime'
import { displayValue } from '../described/values'

const props = defineProps<BlockProps>()
const text = computed(() => {
  const field = optionText(props.options, 'field')
  return field ? displayValue(props.ctx.record?.[field], props.ctx.fields(props.ctx.recordCollection ?? '')[field]) : optionText(props.options, 'text')
})
</script>

<template>
  <h2>{{ text }}</h2>
</template>

<style scoped>
h2 {
  margin: 0;
  color: var(--d-block-text, var(--d-fg));
  font-family: var(--d-heading-font, var(--d-font-display));
  font-size: var(--d-heading-size, calc(var(--d-space) * 1.5));
  font-weight: var(--d-heading-weight, 700);
  font-style: var(--d-heading-style, normal);
  text-decoration: var(--d-heading-decoration, none);
  text-align: var(--d-text-align, left);
  overflow-wrap: anywhere;
}
</style>
