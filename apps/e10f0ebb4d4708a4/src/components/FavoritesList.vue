<script setup lang="ts">
import type { Recipe } from '../types/recipe';
import { totalMinutes } from '../utility/selection';
import AppIcon from './AppIcon.vue';
defineProps<{ recipes: Recipe[]; selectedId: string | null; busy: boolean }>();
const emit = defineEmits<{ select: [id: string]; remove: [id: string]; dinner: [] }>();
</script>
<template>
  <section class="favorites-list" aria-labelledby="favorites-heading">
    <div class="heading"><h1 id="favorites-heading">Your recipe box</h1><p>{{ recipes.length }} saved {{ recipes.length === 1 ? 'dinner' : 'dinners' }} · All your favorites, filters aside.</p></div>
    <div v-if="!recipes.length" class="empty-state"><span aria-hidden="true">🥣</span><h2>Keep the good ones.</h2><p>Save a dinner you love and it will be waiting here next time.</p><button class="btn" @click="emit('dinner')">Find a dinner <AppIcon name="arrow"/></button></div>
    <div v-else class="favorite-rows">
      <div v-for="recipe in recipes" :key="recipe.id" class="favorite-row" :class="{ selected: recipe.id === selectedId }">
        <button class="open-recipe" aria-controls="recipe-details" :aria-pressed="recipe.id === selectedId" @click="emit('select', recipe.id)"><span class="emoji" aria-hidden="true">{{ recipe.emoji }}</span><span><strong>{{ recipe.name }}</strong><small>{{ totalMinutes(recipe) }} min · {{ recipe.vegetarian ? 'Vegetarian' : 'Meat & seafood' }}</small></span></button>
        <button class="btn sm remove" :disabled="busy" :aria-label="`Remove ${recipe.name} from favorites`" @click="emit('remove', recipe.id)"><AppIcon name="star"/>Remove</button>
      </div>
    </div>
  </section>
</template>
<style scoped>
.favorites-list { min-width: 0; }
.heading { padding: 8px 4px 20px; }
h1 { font-size: 20px; margin: 0 0 8px; }
.heading p { margin: 0; color: var(--text-dim); font-size: 12px; }
.favorite-rows { display: flex; flex-direction: column; gap: 8px; }
.favorite-row { display: flex; border: 1px solid var(--border); border-radius: var(--radius); background: rgba(255,255,255,.025); align-items: center; padding-right: 8px; }
.favorite-row.selected { background: var(--accent-soft); border-color: var(--accent); }
.open-recipe { flex: 1; min-width: 0; display: flex; gap: 10px; text-align: left; align-items: center; padding: 14px 12px; background: transparent; border: 0; border-radius: var(--radius-sm); cursor: pointer; }
.open-recipe > span:last-child { min-width: 0; }
.open-recipe:hover { background: var(--bg-hover); }
.open-recipe:active { opacity: .75; }
.open-recipe:focus-visible { outline: none; box-shadow: var(--ring); }
.emoji { font-size: 28px; }
strong { font-size: 13px; font-weight: 600; display: block; }
small { font-size: 11px; color: var(--text-dim); display: block; margin-top: 4px; }
.remove { display: inline-flex; align-items: center; gap: 4px; color: var(--text-dim); flex-shrink: 0; }
.remove :deep(svg) { fill: var(--accent-soft); }
.empty-state { border: 1px dashed var(--border-strong); border-radius: var(--radius); padding: 28px 20px; text-align: center; color: var(--text-dim); }
.empty-state > span { font-size: 44px; }
.empty-state h2 { font-size: 16px; color: var(--text); }
.empty-state p { line-height: 1.7; }
.empty-state button { display: inline-flex; align-items: center; gap: 8px; margin-top: 8px; }
</style>
