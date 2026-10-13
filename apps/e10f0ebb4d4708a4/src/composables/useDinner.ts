import { computed, ref } from 'vue';
import type { Filters, Recipe, StoragePort } from '../types/recipe';
import { displayDate, localDateKey } from '../utility/dates';
import { chooseRecipe, DEFAULT_FILTERS, filterRecipes, matchFeedback, normalizeFilters, totalMinutes, validTimeLimit } from '../utility/selection';
import { hasInvalidStoredValue, normalizeDailySelections, normalizeFavoriteIds, restoreDinnerId, saveDinnerSelection, setFavoriteId, STORAGE_KEYS, toggleFavoriteId } from '../utility/persistence';
import type { StorageKey } from '../utility/persistence';

export const useDinner = (collection: Recipe[], storage: StoragePort | null, now: () => Date = () => new Date(), random: () => number = Math.random) => {
  const initialDate = now();
  const dailySelections = ref<Record<string, string>>({});
  const favoriteIds = ref<string[]>([]);
  const filters = ref<Filters>({ ...DEFAULT_FILTERS });
  const dateKey = ref(localDateKey(initialDate));
  const dateLabel = ref(displayDate(initialDate));
  const loading = ref(true);
  const saving = ref(false);
  const error = ref('');
  const notice = ref('');
  const announcement = ref('');
  const pendingWrites = new Map<StorageKey, unknown>();
  const unreadKeys = new Set<StorageKey>();
  const pendingFavoriteChanges = new Map<string, boolean>();
  let preferenceRevision = 0;
  let preferenceRefresh = 0;
  const unsaved = ref(false);
  const busy = computed(() => loading.value || saving.value);
  const currentId = computed(() => restoreDinnerId(dailySelections.value, dateKey.value));
  const dinner = computed(() => collection.find(recipe => recipe.id === currentId.value) ?? null);
  const matches = computed(() => filterRecipes(collection, filters.value));
  const favorites = computed(() => collection.filter(recipe => favoriteIds.value.includes(recipe.id)));
  const feedback = computed(() => matchFeedback(matches.value.length, matches.value.some(recipe => recipe.id === currentId.value)));
  const dinnerOutsideFilters = computed(() => dinner.value !== null && !matches.value.some(recipe => recipe.id === currentId.value));

  const checkDate = () => {
    const date = now();
    const nextKey = localDateKey(date);
    if (nextKey === dateKey.value) return;
    dateKey.value = nextKey;
    dateLabel.value = displayDate(date);
    announcement.value = dinner.value ? `Restored today's dinner: ${dinner.value.name}.` : 'A new day, a new dinner. Spin to choose today’s meal.';
  };

  const load = async () => {
    loading.value = true;
    const warnings: string[] = [];
    const raw: Partial<Record<StorageKey, unknown>> = {};
    if (storage) {
      await Promise.all(STORAGE_KEYS.map(async key => {
        try { raw[key] = await storage.get(key); }
        catch { unreadKeys.add(key); warnings.push(`Could not load ${key}.`); }
      }));
    }
    dailySelections.value = normalizeDailySelections(raw.dailySelections, collection);
    favoriteIds.value = normalizeFavoriteIds(raw.favoriteIds, collection);
    filters.value = normalizeFilters(raw.vegetarianOnly, raw.maxTotalMinutes);
    const normalized = { dailySelections: dailySelections.value, favoriteIds: favoriteIds.value, ...filters.value };
    if (STORAGE_KEYS.some(key => hasInvalidStoredValue(key, raw[key], normalized[key]))) warnings.push('Some saved values were invalid; valid entries were kept and safe defaults are in use.');
    notice.value = warnings.length ? `${warnings.join(' ')} You can still choose dinner.` : '';
    checkDate();
    loading.value = false;
    if (dinner.value) announcement.value = `Restored today's dinner: ${dinner.value.name}.`;
  };

  const flush = async () => {
    if (saving.value || !pendingWrites.size) return;
    if (!storage) {
      pendingWrites.clear();
      unsaved.value = false;
      return;
    }
    saving.value = true;
    error.value = '';
    try {
      for (const [key, queuedValue] of pendingWrites) {
        let value = queuedValue;
        // Never overwrite a collection we could not read on startup.
        if (unreadKeys.has(key) && (key === 'dailySelections' || key === 'favoriteIds')) {
          const stored = await storage.get(key);
          if (key === 'dailySelections') {
            dailySelections.value = { ...normalizeDailySelections(stored, collection), ...dailySelections.value };
            value = { ...dailySelections.value };
          } else {
            favoriteIds.value = [...pendingFavoriteChanges].reduce((ids, [id, saved]) => setFavoriteId(ids, id, saved), normalizeFavoriteIds(stored, collection));
            value = [...favoriteIds.value];
            pendingFavoriteChanges.clear();
          }
          pendingWrites.set(key, value);
          unreadKeys.delete(key);
        }
        await storage.set(key, value);
        pendingWrites.delete(key);
      }
    } catch {
      error.value = 'Could not save your changes. They are kept for this session. Retry to keep them after reopening.';
    } finally {
      unsaved.value = pendingWrites.size > 0;
      saving.value = false;
    }
  };

  const queue = (key: StorageKey, value: unknown) => { pendingWrites.set(key, value); unsaved.value = !!storage; };

  const spin = async () => {
    if (busy.value) return;
    checkDate();
    const selected = chooseRecipe(matches.value, currentId.value, random);
    if (!selected) { announcement.value = feedback.value; return; }
    dailySelections.value = saveDinnerSelection(dailySelections.value, dateKey.value, selected.id);
    announcement.value = `Today's dinner is ${selected.name}. Serves ${selected.servings}. ${totalMinutes(selected)} minutes total.${matches.value.length === 1 ? ' This is the only matching dinner.' : ''}`;
    queue('dailySelections', { ...dailySelections.value });
    await flush();
  };

  const toggleFavorite = async (id: string) => {
    if (busy.value || !collection.some(recipe => recipe.id === id)) return;
    favoriteIds.value = toggleFavoriteId(favoriteIds.value, id);
    if (unreadKeys.has('favoriteIds')) {
      pendingFavoriteChanges.set(id, favoriteIds.value.includes(id));
    }
    announcement.value = favoriteIds.value.includes(id) ? 'Recipe saved to favorites.' : 'Recipe removed from favorites.';
    queue('favoriteIds', [...favoriteIds.value]);
    await flush();
  };

  const updateFilters = async (next: Filters) => {
    if (busy.value) return;
    if (typeof next.vegetarianOnly !== 'boolean' || !validTimeLimit(next.maxTotalMinutes)) {
      error.value = 'Enter a whole time limit from 0 to 1440 minutes. Use 0 for any time.';
      return;
    }
    filters.value = { ...next };
    preferenceRevision += 1;
    announcement.value = feedback.value;
    queue('vegetarianOnly', next.vegetarianOnly);
    queue('maxTotalMinutes', next.maxTotalMinutes);
    await flush();
  };

  const refreshPreferences = async () => {
    checkDate();
    if (!storage || busy.value || pendingWrites.has('vegetarianOnly') || pendingWrites.has('maxTotalMinutes')) return;
    const revision = preferenceRevision;
    const refresh = ++preferenceRefresh;
    try {
      const [vegetarianOnly, maxTotalMinutes] = await Promise.all([storage.get('vegetarianOnly'), storage.get('maxTotalMinutes')]);
      // A user action may have started while the bridge was responding.
      if (refresh === preferenceRefresh && revision === preferenceRevision && !busy.value && !pendingWrites.has('vegetarianOnly') && !pendingWrites.has('maxTotalMinutes')) {
        const next = normalizeFilters(vegetarianOnly, maxTotalMinutes);
        if (next.vegetarianOnly !== filters.value.vegetarianOnly || next.maxTotalMinutes !== filters.value.maxTotalMinutes) {
          filters.value = next;
          announcement.value = `Filters updated from App Settings. ${feedback.value}`;
        }
      }
    } catch {
      if (refresh === preferenceRefresh && revision === preferenceRevision) notice.value = 'Could not refresh preferences from App Settings. Current filters are still available.';
    }
  };

  return { dailySelections, favoriteIds, filters, dateKey, dateLabel, loading, saving, busy, error, notice, announcement, unsaved, dinner, matches, favorites, feedback, dinnerOutsideFilters, load, spin, toggleFavorite, updateFilters, checkDate, refreshPreferences, retrySave: flush };
};
