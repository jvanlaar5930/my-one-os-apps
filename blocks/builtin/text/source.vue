<script lang="ts">
import type { BlockDefinition } from '../types'

export const definition: BlockDefinition = {
  key: 'text', label: 'Text', summary: 'Readable body text or a record field, preserving paragraphs without HTML.',
  options: {
    text: { kind: 'text', max: 2000 },
    field: { kind: 'field', in: { from: 'screenRecord' } },
  },
  check(options) {
    return (options.field === undefined) === (options.text === undefined)
      ? [{ code: 'B001', severity: 'error', where: '', message: "Text shows either 'field' or 'text', exactly one." }] : []
  },
  example: { block: 'text', text: 'Add a record to get started.' },
}
</script>

<script setup lang="ts">
import { computed } from 'vue'
import type { BlockProps } from '../types'
import { optionText } from '../described/blockRuntime'
import { displayValue } from '../described/values'

const props = defineProps<BlockProps>()
const content = computed(() => {
  const field = optionText(props.options, 'field')
  return field ? displayValue(props.ctx.record?.[field], props.ctx.fields(props.ctx.recordCollection ?? '')[field]) : optionText(props.options, 'text')
})
</script>

<template><p class="body-text">{{ content }}</p></template>

<style scoped>
.body-text { margin: 0; color: var(--d-fg); font-family: var(--d-font); line-height: 1.6; white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
