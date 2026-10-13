import type { Filters, Recipe } from '../types/recipe';

export const DEFAULT_FILTERS: Filters = { vegetarianOnly: false, maxTotalMinutes: 0 };
export const MAX_MINUTES = 1440;
export const totalMinutes = (recipe: Recipe): number => recipe.prepMinutes + recipe.cookMinutes;
export const validTimeLimit = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= MAX_MINUTES;
export const normalizeFilters = (vegetarianOnly: unknown, maxTotalMinutes: unknown): Filters => ({
  vegetarianOnly: typeof vegetarianOnly === 'boolean' ? vegetarianOnly : DEFAULT_FILTERS.vegetarianOnly,
  maxTotalMinutes: validTimeLimit(maxTotalMinutes) ? maxTotalMinutes : DEFAULT_FILTERS.maxTotalMinutes,
});
export const filterRecipes = (collection: Recipe[], filters: Filters): Recipe[] => collection.filter(recipe =>
  (!filters.vegetarianOnly || recipe.vegetarian) && (filters.maxTotalMinutes === 0 || totalMinutes(recipe) <= filters.maxTotalMinutes));

export const chooseRecipe = (matches: Recipe[], currentId: string | null, random: () => number = Math.random): Recipe | null => {
  const alternatives = matches.filter(recipe => recipe.id !== currentId);
  const pool = alternatives.length ? alternatives : matches;
  if (!pool.length) return null;
  const sample = random();
  const clamped = Number.isFinite(sample) ? Math.max(0, Math.min(sample, 1 - Number.EPSILON)) : 0;
  return pool[Math.floor(clamped * pool.length)];
};

export const matchFeedback = (count: number, currentMatches = false): string => count === 0
  ? 'No dinners match these filters. Try a longer time limit or clear your filters.'
  : count === 1 ? currentMatches
    ? 'One dinner matches. Another spin will choose this same recipe.'
    : 'One dinner matches. Spin to choose it; further spins will choose this same recipe.'
  : currentMatches ? `${count} dinners match. Your next spin will pick a different dinner.`
    : `${count} dinners match. Spin to choose today's dinner.`;
