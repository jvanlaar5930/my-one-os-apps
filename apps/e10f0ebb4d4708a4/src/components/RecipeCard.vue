<script setup lang="ts">
import type { Recipe } from '../types/recipe';
import { totalMinutes } from '../utility/selection';
import AppIcon from './AppIcon.vue';
defineProps<{ recipe: Recipe; favorite: boolean; busy: boolean; context: string; outsideFilters?: boolean }>();
const emit = defineEmits<{ favorite: [id: string] }>();
</script>
<template>
  <article class="recipe-card" aria-labelledby="recipe-title">
    <header class="recipe-header">
      <div class="context">{{ context }}</div>
      <div class="title-row"><span class="recipe-emoji" aria-hidden="true">{{ recipe.emoji }}</span><div><h2 id="recipe-title">{{ recipe.name }}</h2><p>{{ recipe.description }}</p></div></div>
      <div class="tags"><span class="badge">{{ recipe.vegetarian ? 'Vegetarian' : 'Meat & seafood' }}</span><span class="total"><AppIcon name="clock"/>{{ totalMinutes(recipe) }} min total</span></div>
      <div class="meta"><span><AppIcon name="people"/>Serves {{ recipe.servings }}</span><span><strong>{{ recipe.prepMinutes }} min</strong> prep</span><span><strong>{{ recipe.cookMinutes }} min</strong> cook</span></div>
      <button class="btn favorite-btn" :class="{ saved: favorite }" :aria-pressed="favorite" :disabled="busy" @click="emit('favorite', recipe.id)"><AppIcon name="star"/>{{ favorite ? 'Saved to favorites' : 'Save to favorites' }}</button>
      <p v-if="outsideFilters" class="outside-note">Today’s saved dinner is outside your current filters. Spin to pick a matching meal.</p>
    </header>
    <div class="recipe-body">
      <section class="ingredients"><h3>Ingredients<span>For {{ recipe.servings }} servings</span></h3><ul role="list"><li v-for="ingredient in recipe.ingredients" :key="ingredient">{{ ingredient }}</li></ul></section>
      <section class="method"><h3>Let’s cook<span>Step by step</span></h3><ol role="list"><li v-for="(step, index) in recipe.instructions" :key="step"><span class="step-number" aria-hidden="true">{{ index + 1 }}</span><p><span class="sr-only">Step {{ index + 1 }}. </span>{{ step }}</p></li></ol></section>
    </div>
    <footer>Make yourself something good.</footer>
  </article>
</template>
<style scoped>
.recipe-card { min-width: 0; border: 1px solid var(--border); border-radius: var(--radius-lg); background: rgba(255,255,255,.025); overflow: hidden; }
.recipe-header { padding: 24px; background: linear-gradient(145deg, var(--accent-soft), transparent 85%); border-bottom: 1px solid var(--border); }
.context { font-size: 11px; text-transform: uppercase; letter-spacing: .14em; color: var(--text-dim); margin-bottom: 18px; }
.title-row { display: flex; align-items: flex-start; gap: 14px; }
.title-row > div { min-width: 0; }
.recipe-emoji { font-size: 40px; line-height: 1.1; }
h2 { margin: 0; font-size: 22px; letter-spacing: -.4px; line-height: 1.3; }
.title-row p { margin: 8px 0 0; color: var(--text-dim); line-height: 1.6; }
.tags { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 20px; }
.badge { font-size: 11px; padding: 4px 9px; border-radius: 999px; background: var(--accent-soft); color: var(--text); }
.total { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-dim); }
.total svg { width: 14px; height: 14px; }
.meta { display: flex; flex-wrap: wrap; gap: 12px 20px; margin: 20px 0; color: var(--text-dim); font-size: 12px; }
.meta span { display: flex; align-items: center; gap: 5px; }
.meta strong { font-weight: 500; color: var(--text); }
.favorite-btn { display: inline-flex; align-items: center; gap: 8px; }
.saved { border-color: var(--accent); background: var(--accent-soft); }
.saved :deep(svg) { fill: var(--accent-soft); color: var(--accent); }
.outside-note { color: var(--text-dim); font-size: 12px; margin: 16px 0 0; }
.recipe-body { padding: 24px; display: grid; grid-template-columns: minmax(0, .8fr) minmax(0, 1.2fr); gap: 28px; }
h3 { font-size: 14px; font-weight: 600; margin: 0 0 16px; }
h3 span { display: block; font-size: 12px; color: var(--text-dim); font-weight: 400; margin-top: 3px; }
ul { list-style: none; padding: 0; margin: 0; }
ul li { border-bottom: 1px solid var(--border); padding: 9px 0; font-size: 13px; line-height: 1.6; }
ul li:first-child { padding-top: 0; }
ul li:last-child { border: 0; }
ol { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 18px; }
ol li { display: flex; gap: 10px; align-items: flex-start; }
.step-number { display: inline-grid; place-items: center; flex: 0 0 24px; height: 24px; background: var(--accent-soft); border-radius: 8px; font-size: 12px; color: var(--text); font-family: var(--mono); }
ol p { margin: 1px 0 0; font-size: 13px; line-height: 1.75; }
footer { border-top: 1px solid var(--border); padding: 14px 24px; color: var(--text-faint); font-size: 11px; }
@media (max-width: 1000px) { .recipe-body { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 600px) { .recipe-header,.recipe-body { padding: 20px; } h2 { font-size: 20px; } .recipe-emoji { font-size: 32px; } }
</style>
