<script setup lang="ts">
import { computed } from 'vue';
import type { Filters } from '../types/recipe';
import { DEFAULT_FILTERS } from '../utility/selection';
const props = defineProps<{ filters: Filters; disabled: boolean; count: number }>();
const emit = defineEmits<{ change: [filters: Filters] }>();
const timeOptions = computed(() => [...new Set([0, 20, 30, 45, 60, props.filters.maxTotalMinutes])].sort((a, b) => a - b));
const setVegetarian = (event: Event) => emit('change', { ...props.filters, vegetarianOnly: (event.target as HTMLInputElement).checked });
const setTime = (event: Event) => emit('change', { ...props.filters, maxTotalMinutes: Number((event.target as HTMLSelectElement).value) });
</script>
<template>
  <section class="filters" aria-labelledby="filter-heading">
    <div class="section-top"><h2 id="filter-heading">On the menu</h2><span class="count">{{ count }} matches</span></div>
    <label class="check-label"><input type="checkbox" :checked="filters.vegetarianOnly" :disabled="disabled" @change="setVegetarian"><span>Vegetarian only<small>No meat or seafood</small></span></label>
    <label class="time-label" for="time-limit">Prep + cook time</label>
    <select id="time-limit" class="field" :value="filters.maxTotalMinutes" :disabled="disabled" @change="setTime">
      <option v-for="minutes in timeOptions" :key="minutes" :value="minutes">{{ minutes === 0 ? 'Any time' : `${minutes} minutes or less` }}</option>
    </select>
    <div class="filter-bottom"><span>Filters apply to spins</span><button class="btn sm" :disabled="disabled || (!filters.vegetarianOnly && !filters.maxTotalMinutes)" @click="emit('change', { ...DEFAULT_FILTERS })">Clear filters</button></div>
  </section>
</template>
<style scoped>
.filters { padding: 20px; background: rgba(255,255,255,.03); border: 1px solid var(--border); border-radius: var(--radius); }
.section-top,.filter-bottom { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
h2 { margin: 0; font-size: 14px; font-weight: 600; }
.count { font-size: 11px; color: var(--text-dim); }
.check-label { display: flex; align-items: center; gap: 10px; margin: 20px 0; cursor: pointer; }
input { width: 17px; height: 17px; accent-color: var(--accent); }
small { display: block; margin-top: 2px; color: var(--text-dim); font-size: 11px; }
.time-label { display: block; margin-bottom: 5px; color: var(--text-dim); font-size: 12px; }
.filter-bottom { margin-top: 14px; flex-wrap: wrap; }
.filter-bottom > span { font-size: 11px; color: var(--text-faint); }
@media (pointer: coarse) { .check-label { min-height: 44px; } input { min-height: 22px; width: 22px; } }
</style>
