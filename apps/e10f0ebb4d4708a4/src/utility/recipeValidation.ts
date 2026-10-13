import type { Recipe } from '../types/recipe';

export const recipeIssues = (recipe: Recipe): string[] => {
  const issues: string[] = [];
  if (!recipe.id.trim() || !recipe.name.trim() || !recipe.description.trim() || !recipe.emoji.trim()) issues.push('Missing identity');
  if (!Number.isInteger(recipe.servings) || recipe.servings <= 0) issues.push('Invalid servings');
  if (!Number.isInteger(recipe.prepMinutes) || recipe.prepMinutes < 0 || !Number.isInteger(recipe.cookMinutes) || recipe.cookMinutes <= 0) issues.push('Invalid timing');
  if (typeof recipe.vegetarian !== 'boolean') issues.push('Missing dietary label');
  if (recipe.ingredients.length < 3 || recipe.ingredients.some(ingredient => !/^[\d¼½¾]/.test(ingredient) || ingredient.trim().length < 4)) issues.push('Unquantified ingredients');
  if (recipe.instructions.length < 3 || recipe.instructions.some(step => step.trim().length < 25)) issues.push('Incomplete instructions');
  return issues;
};
