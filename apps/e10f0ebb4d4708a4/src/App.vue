<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import DinnerPicker from './components/DinnerPicker.vue';
import RecipeCard from './components/RecipeCard.vue';
import FavoritesList from './components/FavoritesList.vue';
import AppIcon from './components/AppIcon.vue';
import { recipes } from './utility/recipes';
import { getStorage } from './utility/storage';
import { revealRecipeInPane } from './utility/recipeNavigation';
import { useDinner } from './composables/useDinner';
import { useRecipeView } from './composables/useRecipeView';

const storage = getStorage();
const { dinner, favorites, favoriteIds, filters, dateLabel, loading, saving, busy, matches, feedback, dinnerOutsideFilters, error, notice, announcement, unsaved, load, spin, toggleFavorite, updateFilters, refreshPreferences, retrySave } = useDinner(recipes, storage);
const { view, activeRecipe, recipeAnnouncement, selectFavorite, showDinner } = useRecipeView(dinner, favorites);
const detailsElement = ref<HTMLElement | null>(null);
const contentElement = ref<HTMLElement | null>(null);
const revealRecipe = async () => {
  await nextTick();
  revealRecipeInPane(contentElement.value, detailsElement.value);
};
const openFavorite = async (id: string) => {
  selectFavorite(id);
  await revealRecipe();
};
let dateTimer: ReturnType<typeof setInterval> | undefined;
let disposed = false;
const refreshOnVisible = async () => { if (!document.hidden) await refreshPreferences(); };

onMounted(async () => {
  await load();
  if (disposed) return;
  dateTimer = setInterval(refreshOnVisible, 30000);
  window.addEventListener('focus', refreshPreferences);
  document.addEventListener('visibilitychange', refreshOnVisible);
});
onUnmounted(() => {
  disposed = true;
  if (dateTimer) clearInterval(dateTimer);
  window.removeEventListener('focus', refreshPreferences);
  document.removeEventListener('visibilitychange', refreshOnVisible);
});
</script>
<template>
  <div class="app-shell">
    <header class="app-bar"><div class="brand"><span aria-hidden="true">🍽️</span><strong>Recipe Roulette</strong></div><nav aria-label="Recipe views"><button class="view-button" :class="{ active: view === 'dinner' }" :aria-pressed="view === 'dinner'" @click="view = 'dinner'">Tonight</button><button class="view-button" :class="{ active: view === 'favorites' }" :aria-pressed="view === 'favorites'" @click="view = 'favorites'"><AppIcon name="star"/>Favorites <span class="favorite-count">{{ favorites.length }}</span></button></nav></header>
    <main ref="contentElement" class="content">
      <div class="page-heading"><span>{{ view === 'dinner' ? dateLabel : 'A collection worth coming back to' }}</span><span v-if="saving" class="saving-note" role="status">Saving changes…</span><span v-else class="kitchen-note">Your little dinner ritual</span></div>
      <div v-if="!storage" class="status info">Session mode: enjoy all recipes and favorites. Changes are remembered while this app stays open.</div>
      <div v-if="notice" class="status warning" role="status">{{ notice }}</div>
      <div v-if="error" class="status error" role="alert"><span>{{ error }}</span><button v-if="unsaved" class="btn sm" :disabled="busy" @click="retrySave">{{ saving ? 'Retrying…' : 'Retry save' }}</button></div>
      <div v-if="loading" class="loading" role="status">Opening your recipe box…</div>
      <div class="layout" :aria-busy="loading">
        <DinnerPicker v-if="view === 'dinner'" :filters="filters" :count="matches.length" :busy="busy" :loading="loading" :saving="saving" :dinner-name="dinner?.name ?? ''" :feedback="feedback" @spin="spin" @filters="updateFilters" @recipe="revealRecipe"/>
        <FavoritesList v-else :recipes="favorites" :selected-id="activeRecipe?.id ?? null" :busy="busy" @select="openFavorite" @remove="toggleFavorite" @dinner="showDinner"/>
        <div id="recipe-details" ref="detailsElement" class="details" role="region" :aria-label="activeRecipe ? `Recipe details: ${activeRecipe.name}` : 'Recipe details'" tabindex="-1">
          <RecipeCard v-if="activeRecipe" :key="activeRecipe.id" :recipe="activeRecipe" :favorite="favoriteIds.includes(activeRecipe.id)" :busy="busy" :context="view === 'dinner' ? 'Today’s dinner' : 'From your favorites'" :outside-filters="view === 'dinner' && dinnerOutsideFilters" @favorite="toggleFavorite"/>
          <section v-else class="recipe-placeholder"><div class="placeholder-art" aria-hidden="true">{{ view === 'dinner' ? '🥗' : '📖' }}</div><p class="eyebrow">{{ view === 'dinner' ? 'Something delicious awaits' : 'Recipes to return to' }}</p><h2>{{ view === 'dinner' ? 'Dinner starts with a spin.' : 'Your favorites belong here.' }}</h2><p>{{ view === 'dinner' ? 'Pick your preferences, give it a spin, and we’ll bring the recipe. Ingredients and every step included.' : 'Choose a saved dinner to see its ingredients and step-by-step instructions.' }}</p><div class="placeholder-tags"><span>Simple ingredients</span><span>Complete recipes</span><span>Made for two</span></div></section>
        </div>
      </div>
      <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcement }}</div>
      <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ recipeAnnouncement }}</div>
    </main>
  </div>
</template>
<style scoped>
.app-shell { height: 100%; display: flex; flex-direction: column; min-width: 0; }
.app-bar { flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 22px; border-bottom: 1px solid var(--border); background: var(--bg-glass); }
.brand { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
.brand > span { font-size: 21px; }
.brand strong { font-size: 13px; font-weight: 600; }
nav { display: flex; gap: 4px; }
.view-button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid transparent; background: transparent; border-radius: var(--radius-sm); cursor: pointer; padding: 7px 10px; color: var(--text-dim); font-size: 12px; transition: background .15s ease, transform .1s ease; }
.view-button:hover { background: var(--bg-hover); color: var(--text); }
.view-button.active { background: var(--accent-soft); color: var(--text); border-color: var(--border); }
.view-button:active { transform: scale(.97); }
.view-button:focus-visible { outline: none; box-shadow: var(--ring); }
.view-button :deep(svg) { width: 14px; height: 14px; }
.favorite-count { font-size: 11px; color: var(--text-dim); }
.content { flex: 1; min-height: 0; overflow: auto; padding: 20px 22px 28px; }
.page-heading { display: flex; justify-content: space-between; gap: 12px; font-size: 12px; color: var(--text-dim); margin-bottom: 20px; }
.kitchen-note { color: var(--text-faint); }
.layout { display: grid; grid-template-columns: minmax(220px, .7fr) minmax(0, 1.5fr); gap: 28px; align-items: start; max-width: 1200px; margin: 0 auto; }
.details { min-width: 0; }
.details:focus { outline: 2px solid var(--accent); outline-offset: 3px; box-shadow: var(--ring); border-radius: var(--radius-lg); }
.recipe-placeholder { border: 1px dashed var(--border-strong); border-radius: var(--radius-lg); min-height: 480px; display: flex; align-items: center; justify-content: center; flex-direction: column; padding: 40px 28px; text-align: center; background: radial-gradient(ellipse at center, var(--accent-soft), transparent 75%); }
.placeholder-art { font-size: 72px; line-height: 1; margin-bottom: 28px; }
.eyebrow { text-transform: uppercase; letter-spacing: .12em; font-size: 11px; color: var(--text-dim); }
.recipe-placeholder h2 { font-size: 20px; margin: 4px 0 12px; }
.recipe-placeholder > p:not(.eyebrow) { max-width: 340px; line-height: 1.8; color: var(--text-dim); font-size: 13px; margin: 0; }
.placeholder-tags { display: flex; justify-content: center; flex-wrap: wrap; gap: 8px; margin-top: 28px; font-size: 11px; color: var(--text-dim); }
.placeholder-tags span { padding: 5px 9px; border: 1px solid var(--border); border-radius: 999px; }
.status { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; justify-content: space-between; margin-bottom: 14px; padding: 10px 12px; border-radius: var(--radius-sm); font-size: 12px; }
.info { background: var(--accent-soft); color: var(--text-dim); }
.warning { background: rgba(251,191,36,.14); color: #fde68a; }
.error { background: rgba(240,100,90,.15); color: #ff9d96; }
.loading { color: var(--text-dim); font-size: 12px; margin: 0 0 12px; }
@media (max-width: 600px) { .layout { grid-template-columns: minmax(0,1fr); gap: 20px; } .app-bar { flex-wrap: wrap; padding: 10px 16px; } .brand { flex: 1 1 auto; } nav { flex: 1 1 auto; justify-content: flex-end; } .content { padding: 16px; } .kitchen-note { display: none; } .recipe-placeholder { min-height: 300px; padding: 28px 20px; } .placeholder-art { font-size: 52px; margin-bottom: 16px; } }
@media (pointer: coarse) { .view-button { min-height: 44px; } }
</style>
