import type { Recipe } from '../types/recipe';
import { isCalendarDate } from './dates';

export const STORAGE_KEYS = ['dailySelections', 'favoriteIds', 'vegetarianOnly', 'maxTotalMinutes'] as const;
export type StorageKey = typeof STORAGE_KEYS[number];
const isRecord = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);

export const normalizeDailySelections = (value: unknown, collection: Recipe[]): Record<string, string> => {
  if (!isRecord(value)) return {};
  const knownIds = new Set(collection.map(recipe => recipe.id));
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => isCalendarDate(entry[0]) && typeof entry[1] === 'string' && knownIds.has(entry[1])));
};

export const normalizeFavoriteIds = (value: unknown, collection: Recipe[]): string[] => {
  if (!Array.isArray(value)) return [];
  const knownIds = new Set(collection.map(recipe => recipe.id));
  return [...new Set(value.filter((id): id is string => typeof id === 'string' && knownIds.has(id)))];
};

export const setFavoriteId = (ids: string[], id: string, saved: boolean): string[] => saved
  ? ids.includes(id) ? [...ids] : [...ids, id]
  : ids.filter(favoriteId => favoriteId !== id);
export const toggleFavoriteId = (ids: string[], id: string): string[] => setFavoriteId(ids, id, !ids.includes(id));
export const restoreDinnerId = (selections: Record<string, string>, date: string): string | null => selections[date] ?? null;
export const saveDinnerSelection = (selections: Record<string, string>, date: string, id: string): Record<string, string> => ({ ...selections, [date]: id });

export const hasInvalidStoredValue = (key: StorageKey, raw: unknown, normalized: unknown): boolean => raw !== null && raw !== undefined &&
  (key === 'dailySelections' || key === 'favoriteIds' ? JSON.stringify(raw) !== JSON.stringify(normalized) : raw !== normalized);
