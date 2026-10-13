<script setup lang="ts">
import type { Filters } from '../types/recipe';
import { DEFAULT_FILTERS } from '../utility/selection';
import FilterPanel from './FilterPanel.vue';
import AppIcon from './AppIcon.vue';
defineProps<{ filters: Filters; count: number; busy: boolean; loading: boolean; saving: boolean; dinnerName: string; feedback: string }>();
const emit = defineEmits<{ spin: []; filters: [filters: Filters]; recipe: [] }>();
</script>
<template>
  <div class="picker">
    <section class="invitation">
      <div class="food-mark" aria-hidden="true">🍽️</div>
      <p class="eyebrow">A little less deciding</p>
      <h1>What’s for dinner?</h1>
      <p class="intro">Good food. A fresh idea.<br>Let tonight’s dinner find you.</p>
      <button class="btn btn-primary spin" :disabled="busy || count === 0" @click="emit('spin')"><AppIcon name="shuffle"/>{{ loading ? 'Opening the recipe box…' : saving ? 'Saving your changes…' : 'Spin for Dinner' }}</button>
      <p class="spin-hint">{{ count === 0 ? 'Clear or adjust the filters to spin.' : count === 1 ? 'Only one dinner fits these filters.' : dinnerName ? 'Feeling something else? Give it another spin.' : 'Your pick stays here for the rest of today.' }}</p>
      <button v-if="dinnerName" class="current-pick btn" aria-controls="recipe-details" @click="emit('recipe')"><span><small>Today’s pick</small><strong>{{ dinnerName }}</strong><small>View recipe</small></span><AppIcon name="arrow"/></button>
    </section>
    <FilterPanel :filters="filters" :disabled="busy" :count="count" @change="emit('filters', $event)"/>
    <div class="match-note" :class="{ empty: count === 0 }" role="status">
      <p>{{ feedback }}</p>
      <button v-if="count === 0" class="btn" :disabled="busy" @click="emit('filters', { ...DEFAULT_FILTERS })">Clear filters</button>
    </div>
    <p class="collection-note"><span aria-hidden="true">🌿</span> 30 complete recipes · Made for two<br><span>Everyday ingredients, plenty of variety.</span></p>
  </div>
</template>
<style scoped>
.picker { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
.invitation { padding: 24px 8px 8px; text-align: center; }
.food-mark { font-size: 56px; line-height: 1.2; margin-bottom: 20px; }
.eyebrow { text-transform: uppercase; letter-spacing: .15em; font-size: 11px; color: var(--text-dim); margin: 0 0 8px; }
h1 { font-size: 22px; font-weight: 650; letter-spacing: -.5px; margin: 0; }
.intro { color: var(--text-dim); margin: 12px 0 24px; font-size: 13px; line-height: 1.7; }
.spin { width: 100%; min-height: 48px; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 15px; }
.spin-hint { font-size: 11px; color: var(--text-dim); margin: 12px 0 0; }
.current-pick { display: flex; align-items: center; justify-content: space-between; gap: 12px; width: 100%; margin-top: 16px; text-align: left; }
.current-pick small { display: block; color: var(--text-dim); font-size: 11px; font-weight: 400; }
.current-pick strong { display: block; font-size: 13px; font-weight: 600; margin: 4px 0; }
.match-note { color: var(--text-dim); font-size: 12px; padding: 0 8px; }
.match-note p { margin: 0; }
.match-note.empty { padding: 14px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--accent-soft); color: var(--text); }
.match-note .btn { margin-top: 12px; }
.collection-note { text-align: center; font-size: 12px; color: var(--text-dim); margin: 4px 0 12px; line-height: 1.8; }
.collection-note > span:last-child { color: var(--text-faint); font-size: 11px; }
@media (max-width: 600px) { .invitation { padding-top: 8px; } .food-mark { margin-bottom: 12px; font-size: 44px; } .intro { margin-bottom: 16px; } }
</style>
