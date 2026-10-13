import { computed, ref } from 'vue';
import type { Ref } from 'vue';
import type { Recipe } from '../types/recipe';
import { totalMinutes } from '../utility/selection';

export const useRecipeView = (dinner: Ref<Recipe | null>, favorites: Ref<Recipe[]>) => {
  const view = ref<'dinner' | 'favorites'>('dinner');
  const selectedFavoriteId = ref<string | null>(null);
  const activeRecipe = computed(() => view.value === 'dinner' ? dinner.value : favorites.value.find(recipe => recipe.id === selectedFavoriteId.value) ?? favorites.value[0] ?? null);
  const recipeAnnouncement = computed(() => view.value !== 'favorites' ? '' : activeRecipe.value
    ? `Viewing ${activeRecipe.value.name}. Serves ${activeRecipe.value.servings}. ${totalMinutes(activeRecipe.value)} minutes total.`
    : 'Your recipe box is empty. Save a dinner from Tonight to add a favorite.');
  const selectFavorite = (id: string) => { selectedFavoriteId.value = id; };
  const showDinner = () => { view.value = 'dinner'; };
  return { view, activeRecipe, recipeAnnouncement, selectFavorite, showDinner };
};
