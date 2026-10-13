import { recipes } from './src/utility/recipes';
import { recipeIssues } from './src/utility/recipeValidation';
import { chooseRecipe, DEFAULT_FILTERS, filterRecipes, matchFeedback, normalizeFilters, totalMinutes, validTimeLimit } from './src/utility/selection';
import { displayDate, isCalendarDate, localDateKey } from './src/utility/dates';
import { hasInvalidStoredValue, normalizeDailySelections, normalizeFavoriteIds, restoreDinnerId, saveDinnerSelection, setFavoriteId, toggleFavoriteId } from './src/utility/persistence';
import { useDinner } from './src/composables/useDinner';
import { useRecipeView } from './src/composables/useRecipeView';
import { revealRecipeInPane } from './src/utility/recipeNavigation';
import { ref } from 'vue';

const clone = value => value === undefined ? undefined : JSON.parse(JSON.stringify(value));
const makeStorage = (initial = {}) => {
  const values = clone(initial);
  const writes = [];
  return {
    values,
    writes,
    get: async key => clone(values[key] ?? null),
    set: async (key, value) => { values[key] = clone(value); writes.push({ key, value: clone(value) }); return true; },
  };
};
const today = () => new Date(2026, 9, 13, 18, 30);
const first = recipes[0];
const second = recipes[1];
const createDinner = (storage = null, collection = [first, second], now = today, random = () => 0) => useDinner(collection, storage, now, random);

__selfTest.test('collection includes at least 30 complete dinners', assert => {
  assert(recipes.length >= 30, 'The dinner collection must contain at least 30 recipes');
});
__selfTest.test('recipe IDs are unique', assert => {
  assert(new Set(recipes.map(recipe => recipe.id)).size === recipes.length, 'Every dinner needs a unique ID');
});
__selfTest.test('recipe names are unique', assert => {
  assert(new Set(recipes.map(recipe => recipe.name)).size === recipes.length, 'Dinner names should be varied');
});
__selfTest.test('collection offers a substantial vegetarian selection', assert => {
  assert(recipes.filter(recipe => recipe.vegetarian).length >= 10, 'Include at least ten vegetarian dinners');
});
__selfTest.test('collection offers a substantial meat and seafood selection', assert => {
  assert(recipes.filter(recipe => !recipe.vegetarian).length >= 10, 'Include at least ten meat or seafood dinners');
});
__selfTest.test('rice stir-fry timing includes rice cooking and resting', assert => {
  assert(recipes.find(recipe => recipe.id === 'tofu-stir-fry').cookMinutes >= 17, 'Rice needs twelve minutes cooking plus five resting');
});
__selfTest.test('sheet-pan chicken timing includes its resting step', assert => {
  assert(recipes.find(recipe => recipe.id === 'lemon-chicken').cookMinutes >= 40, 'Allow thirty-five minutes roasting and five minutes resting');
});
recipes.forEach(recipe => {
  ['Missing identity', 'Invalid servings', 'Invalid timing', 'Missing dietary label', 'Unquantified ingredients', 'Incomplete instructions'].forEach(issue => {
    __selfTest.test(`${recipe.name}: no ${issue.toLowerCase()}`, assert => {
      assert(!recipeIssues(recipe).includes(issue), `${recipe.name}: ${issue}`);
    });
  });
});
[
  ['coconut-lentil-dal', 5 + 1 + 20],
  ['mushroom-risotto', 6 + 4 + 1 + 22 + 2],
  ['shakshuka', 7 + 1 + 10 + 8],
  ['tomato-white-beans', Math.ceil(0.5 + 8 + 10)],
  ['turkey-chili', Math.ceil(5 + 8 + 0.5 + 18)],
].forEach(([id, requiredMinutes]) => {
  __selfTest.test(`${id}: cook time covers sequential timed steps`, assert => {
    assert(recipes.find(recipe => recipe.id === id).cookMinutes >= requiredMinutes, 'Include the longest stated cooking durations and resting time');
  });
});
__selfTest.test('recipe validation catches missing quantities', assert => {
  assert(recipeIssues({ ...first, ingredients: ['pasta', 'olive oil', 'salt'] }).includes('Unquantified ingredients'), 'Bare ingredient names are incomplete');
});
__selfTest.test('recipe validation catches an incomplete method', assert => {
  assert(recipeIssues({ ...first, instructions: ['Cook it.'] }).includes('Incomplete instructions'), 'A recipe needs a complete method');
});
__selfTest.test('total cooking time includes preparation', assert => {
  assert(totalMinutes({ ...first, prepMinutes: 12, cookMinutes: 18 }) === 30, 'Both time components must count');
});
__selfTest.test('vegetarian filter excludes meat dinners', assert => {
  const collection = [{ ...first, id: 'veg', vegetarian: true }, { ...first, id: 'meat', vegetarian: false }];
  assert(filterRecipes(collection, { vegetarianOnly: true, maxTotalMinutes: 0 }).map(recipe => recipe.id).join() === 'veg', 'Only vegetarian dinners should remain');
});
__selfTest.test('zero time limit means unrestricted time', assert => {
  assert(filterRecipes(recipes, { vegetarianOnly: false, maxTotalMinutes: 0 }).length === recipes.length, 'Zero means any time');
});
__selfTest.test('time filter includes an exact boundary', assert => {
  const recipe = { ...first, prepMinutes: 10, cookMinutes: 20 };
  assert(filterRecipes([recipe], { vegetarianOnly: false, maxTotalMinutes: 30 }).length === 1, 'Thirty-minute recipe must match a thirty-minute cap');
});
__selfTest.test('time filter excludes a recipe one minute above the boundary', assert => {
  const recipe = { ...first, prepMinutes: 10, cookMinutes: 21 };
  assert(filterRecipes([recipe], { vegetarianOnly: false, maxTotalMinutes: 30 }).length === 0, 'Prep plus cook cannot exceed the cap');
});
__selfTest.test('diet and time filters are combined', assert => {
  const collection = [{ ...first, id: 'slow', vegetarian: true, prepMinutes: 20, cookMinutes: 30 }, { ...second, id: 'fast', vegetarian: false, prepMinutes: 5, cookMinutes: 10 }];
  assert(filterRecipes(collection, { vegetarianOnly: true, maxTotalMinutes: 30 }).length === 0, 'Both constraints must match');
});
__selfTest.test('filtering leaves the collection intact', assert => {
  const collection = [first, second];
  filterRecipes(collection, { vegetarianOnly: true, maxTotalMinutes: 1 });
  assert(collection.length === 2 && collection[0] === first, 'Filtering must not mutate recipes');
});
__selfTest.test('invalid saved preferences fall back safely', assert => {
  assert(JSON.stringify(normalizeFilters('true', -5)) === JSON.stringify(DEFAULT_FILTERS), 'Malformed preferences use safe defaults');
});
__selfTest.test('custom saved time limits survive normalization', assert => {
  assert(normalizeFilters(true, 37).maxTotalMinutes === 37, 'Custom App Settings time limits must be supported');
});
[NaN, Infinity, 1.5, -1, 1441, '30', null].forEach(value => {
  __selfTest.test(`time limit rejects ${String(value)} (${typeof value})`, assert => {
    assert(!validTimeLimit(value), 'Time limits must be whole numbers from 0 to 1440');
  });
});
__selfTest.test('maximum supported time limit is inclusive', assert => {
  assert(validTimeLimit(1440), '1440 minutes must be accepted');
});
__selfTest.test('empty match feedback explains how to recover', assert => {
  assert(/No dinners/.test(matchFeedback(0)) && /clear your filters/.test(matchFeedback(0)), 'An empty match needs a clear explanation');
});
__selfTest.test('single match feedback explains repeat behavior', assert => {
  assert(/same recipe/.test(matchFeedback(1)), 'A single recipe necessarily repeats');
});
__selfTest.test('first-spin feedback invites a selection', assert => {
  assert(matchFeedback(2) === "2 dinners match. Spin to choose today's dinner.", 'Do not promise a different dinner before one is selected');
});
__selfTest.test('matching current dinner feedback promises an alternative', assert => {
  assert(/different dinner/.test(matchFeedback(2, true)), 'Explain repeat prevention when alternatives exist');
});
__selfTest.test('single unselected match feedback invites choosing it', assert => {
  assert(/Spin to choose it/.test(matchFeedback(1, false)), 'A sole match remains available for the first spin');
});
__selfTest.test('single selected match feedback explains the next spin repeats', assert => {
  assert(/Another spin will choose this same recipe/.test(matchFeedback(1, true)), 'Do not promise a new recipe when the pool has one dinner');
});
__selfTest.test('random selection excludes the current dinner', assert => {
  assert(chooseRecipe([first, second], first.id, () => 0)?.id === second.id, 'An alternative must prevent immediate repetition');
});
__selfTest.test('one match can repeat', assert => {
  assert(chooseRecipe([first], first.id, () => 0)?.id === first.id, 'The only matching dinner must remain selectable');
});
__selfTest.test('no matches produce no selection', assert => {
  assert(chooseRecipe([], null, () => { throw new Error('Random should not be called'); }) === null, 'An empty pool returns null');
});
__selfTest.test('a current dinner outside the pool does not restrict selection', assert => {
  assert(chooseRecipe([first, second], 'other', () => 0.99)?.id === second.id, 'Any matching dinner may be drawn');
});
__selfTest.test('random endpoint cannot yield an undefined recipe', assert => {
  assert(chooseRecipe([first, second], null, () => 1)?.id === second.id, 'Clamp the upper endpoint into the pool');
});
__selfTest.test('negative random input cannot yield an undefined recipe', assert => {
  assert(chooseRecipe([first, second], null, () => -1)?.id === first.id, 'Clamp negative values');
});
__selfTest.test('nonfinite random input falls back safely', assert => {
  assert(chooseRecipe([first, second], null, () => NaN)?.id === first.id, 'Invalid randomness must remain safe');
});
__selfTest.test('local date keys use the local calendar', assert => {
  assert(localDateKey(new Date(2026, 0, 2, 0, 1)) === '2026-01-02', 'Do not use a UTC date or omit padding');
});
__selfTest.test('valid leap days are accepted', assert => {
  assert(isCalendarDate('2024-02-29'), 'Leap day must be accepted in a leap year');
});
['2026-02-29', '2026-02-30', '2026-13-01', '2026-00-10', '2026-1-2'].forEach(value => {
  __selfTest.test(`saved date rejects ${value}`, assert => {
    assert(!isCalendarDate(value), 'Only real, padded calendar dates may be restored');
  });
});
__selfTest.test('daily normalization retains valid selections', assert => {
  assert(normalizeDailySelections({ '2026-10-13': first.id }, recipes)['2026-10-13'] === first.id, 'Valid saved dinner should survive');
});
__selfTest.test('daily normalization drops unknown recipes', assert => {
  assert(Object.keys(normalizeDailySelections({ '2026-10-13': 'missing' }, recipes)).length === 0, 'Unknown IDs cannot be displayed');
});
__selfTest.test('daily normalization drops invalid calendar entries', assert => {
  assert(Object.keys(normalizeDailySelections({ '2026-02-30': first.id }, recipes)).length === 0, 'Invalid dates must not restore');
});
__selfTest.test('daily normalization handles malformed shapes', assert => {
  assert(Object.keys(normalizeDailySelections([first.id], recipes)).length === 0, 'An array is not a date map');
});
__selfTest.test('favorites normalization deduplicates IDs', assert => {
  assert(normalizeFavoriteIds([first.id, first.id], recipes).length === 1, 'Duplicate favorites should collapse');
});
__selfTest.test('favorites normalization excludes invalid IDs', assert => {
  assert(normalizeFavoriteIds([first.id, 42, 'missing', null], recipes).join() === first.id, 'Only known string IDs may remain');
});
__selfTest.test('favorites normalization handles a malformed saved value', assert => {
  assert(normalizeFavoriteIds('wrong', recipes).length === 0, 'Malformed favorites should fall back to an empty array');
});
__selfTest.test('saving dinner preserves other calendar days', assert => {
  const original = { '2026-10-12': first.id };
  const result = saveDinnerSelection(original, '2026-10-13', second.id);
  assert(result['2026-10-12'] === first.id && result['2026-10-13'] === second.id && !original['2026-10-13'], 'Add today without changing history or mutating input');
});
__selfTest.test('missing today never restores yesterday', assert => {
  assert(restoreDinnerId({ '2026-10-12': first.id }, '2026-10-13') === null, 'Restoration is date-specific');
});
__selfTest.test('favorite toggle adds an unsaved dinner', assert => {
  assert(toggleFavoriteId([], first.id).join() === first.id, 'Saving should add the ID');
});
__selfTest.test('favorite toggle removes a saved dinner', assert => {
  assert(toggleFavoriteId([first.id, second.id], first.id).join() === second.id, 'Remove just the requested favorite');
});
__selfTest.test('setting an existing favorite is idempotent', assert => {
  assert(setFavoriteId([first.id], first.id, true).join() === first.id, 'A requested save must not invert an already-saved favorite');
});
__selfTest.test('favorite transforms do not mutate input', assert => {
  const input = [first.id];
  toggleFavoriteId(input, first.id);
  assert(input.join() === first.id, 'Keep the original favorite list intact');
});
__selfTest.test('missing storage values are normal first-run data', assert => {
  assert(!hasInvalidStoredValue('favoriteIds', null, []), 'An absent key should not be called corrupt');
});
__selfTest.test('malformed stored values trigger recoverable feedback', assert => {
  assert(hasInvalidStoredValue('vegetarianOnly', 'yes', false), 'Malformed preference should be reported');
});
__selfTest.test('first run has no forced selection', async assert => {
  const app = createDinner(makeStorage());
  await app.load();
  assert(app.dinner.value === null && !app.loading.value, 'First run should finish loading and invite a spin');
});
__selfTest.test('today’s dinner restores from the required date map', async assert => {
  const app = createDinner(makeStorage({ dailySelections: { '2026-10-13': second.id } }));
  await app.load();
  assert(app.dinner.value?.id === second.id, 'Restore the saved dinner for the local date');
});
__selfTest.test('saved dinner remains visible outside new filters', async assert => {
  const app = createDinner(makeStorage({ dailySelections: { '2026-10-13': first.id }, maxTotalMinutes: 1 }));
  await app.load();
  assert(app.dinner.value?.id === first.id && app.dinnerOutsideFilters.value, 'Filters affect future spins without hiding today’s saved choice');
});
__selfTest.test('spin persists the specified dailySelections shape', async assert => {
  const storage = makeStorage();
  const app = createDinner(storage);
  await app.load(); await app.spin();
  assert(JSON.stringify(storage.values.dailySelections) === JSON.stringify({ '2026-10-13': first.id }), 'Store a date-to-ID map');
});
__selfTest.test('subsequent spins avoid the current recipe', async assert => {
  const app = createDinner();
  await app.load(); await app.spin(); await app.spin();
  assert(app.dinner.value?.id === second.id, 'The second spin must use an alternative');
});
__selfTest.test('spin draws only from dinners satisfying both filters', async assert => {
  const collection = [
    { ...first, id: 'quick-veg', vegetarian: true, prepMinutes: 10, cookMinutes: 20 },
    { ...first, id: 'slow-veg', vegetarian: true, prepMinutes: 10, cookMinutes: 21 },
    { ...first, id: 'quick-meat', vegetarian: false, prepMinutes: 5, cookMinutes: 10 },
  ];
  const app = createDinner(makeStorage({ vegetarianOnly: true, maxTotalMinutes: 30 }), collection, today, () => 0.99);
  await app.load(); await app.spin();
  assert(app.dinner.value?.id === 'quick-veg', 'Diet and total time must constrain the actual random draw');
});
__selfTest.test('reopened filtered spins exclude the restored dinner', async assert => {
  const collection = [
    { ...first, id: 'veg-a', vegetarian: true, prepMinutes: 10, cookMinutes: 20 },
    { ...first, id: 'veg-b', vegetarian: true, prepMinutes: 5, cookMinutes: 20 },
    { ...first, id: 'meat', vegetarian: false, prepMinutes: 5, cookMinutes: 10 },
  ];
  const storage = makeStorage({ vegetarianOnly: true, maxTotalMinutes: 30 });
  const original = createDinner(storage, collection);
  await original.load(); await original.spin();
  const reopened = createDinner(storage, collection);
  await reopened.load(); await reopened.spin();
  assert(reopened.dinner.value?.id === 'veg-b', 'Exclude the persisted current pick while keeping nonmatching recipes out');
});
__selfTest.test('zero matches keep the current daily dinner intact', async assert => {
  const app = createDinner(makeStorage({ dailySelections: { '2026-10-13': first.id }, maxTotalMinutes: 1 }));
  await app.load(); await app.spin();
  assert(app.dinner.value?.id === first.id && /No dinners/.test(app.announcement.value), 'An empty spin must explain the result without erasing today');
});
__selfTest.test('single match can be selected and selected again', async assert => {
  const app = createDinner(null, [first]);
  await app.load(); await app.spin(); await app.spin();
  assert(app.dinner.value?.id === first.id && /only matching/.test(app.announcement.value), 'Allow the sole match and announce the constraint');
});
__selfTest.test('date rollover clears a previous day’s visible selection', async assert => {
  let clock = new Date(2026, 9, 13, 23, 59);
  const app = createDinner(null, [first, second], () => clock);
  await app.load(); await app.spin();
  clock = new Date(2026, 9, 14, 0, 1); app.checkDate();
  assert(app.dinner.value === null && app.dateKey.value === '2026-10-14', 'A new local day requires its own dinner');
});
__selfTest.test('date rollover restores a dinner already saved for the new day', async assert => {
  let clock = new Date(2026, 9, 13, 23, 59);
  const app = createDinner(makeStorage({ dailySelections: { '2026-10-14': second.id } }), [first, second], () => clock);
  await app.load(); clock = new Date(2026, 9, 14, 0, 1); app.checkDate();
  assert(app.dinner.value?.id === second.id, 'Revisit the saved selection for the new local day');
});
__selfTest.test('a spin checks rollover before saving', async assert => {
  let clock = new Date(2026, 9, 13, 23, 59);
  const storage = makeStorage();
  const app = createDinner(storage, [first, second], () => clock);
  await app.load(); clock = new Date(2026, 9, 14, 0, 1); await app.spin();
  assert(storage.values.dailySelections['2026-10-14'] === first.id && !storage.values.dailySelections['2026-10-13'], 'Save to the date at action time');
});
__selfTest.test('initial date key and label use one clock snapshot', assert => {
  let reads = 0;
  const beforeMidnight = new Date(2026, 9, 13, 23, 59);
  const app = createDinner(null, [first], () => reads++ === 0 ? beforeMidnight : new Date(2026, 9, 14, 0, 1));
  assert(app.dateKey.value === '2026-10-13' && app.dateLabel.value === displayDate(beforeMidnight), 'The date label must describe the same local day as the storage key');
});
__selfTest.test('restoration uses the local day when delayed loading finishes', async assert => {
  let clock = new Date(2026, 9, 13, 23, 59);
  let release;
  const storage = {
    get: async key => key === 'dailySelections' ? await new Promise(resolve => { release = resolve; }) : null,
    set: async () => true,
  };
  const app = createDinner(storage, [first, second], () => clock);
  const pending = app.load();
  clock = new Date(2026, 9, 14, 0, 1);
  release({ '2026-10-13': first.id, '2026-10-14': second.id });
  await pending;
  assert(app.dinner.value?.id === second.id, 'Restore the new local day if midnight passed while reading storage');
});
__selfTest.test('favorites survive a reload', async assert => {
  const storage = makeStorage();
  const app = createDinner(storage);
  await app.load(); await app.toggleFavorite(second.id);
  const reopened = createDinner(storage); await reopened.load();
  assert(reopened.favoriteIds.value.join() === second.id, 'Favorite IDs must restore after reopening');
});
__selfTest.test('favorite removal persists', async assert => {
  const storage = makeStorage({ favoriteIds: [first.id, second.id] });
  const app = createDinner(storage);
  await app.load(); await app.toggleFavorite(first.id);
  assert(storage.values.favoriteIds.join() === second.id, 'Persist removal without losing other favorites');
});
__selfTest.test('failed favorite saves retain the session favorite with recovery feedback', async assert => {
  const storage = { get: async () => null, set: async () => { throw new Error('Denied'); } };
  const app = createDinner(storage); await app.load(); await app.toggleFavorite(first.id);
  assert(app.favoriteIds.value.includes(first.id) && app.unsaved.value && !!app.error.value, 'A failed favorite save must stay visible and offer retry');
});
__selfTest.test('retry persists a failed favorite removal', async assert => {
  const storage = makeStorage({ favoriteIds: [first.id, second.id] });
  let fail = true;
  const port = { get: storage.get, set: async (key, value) => { if (fail) throw new Error('Denied'); return await storage.set(key, value); } };
  const app = createDinner(port); await app.load(); await app.toggleFavorite(first.id);
  fail = false; await app.retrySave();
  const reopened = createDinner(storage); await reopened.load();
  assert(reopened.favoriteIds.value.join() === second.id, 'Retry must persist the removal while preserving other favorites');
});
__selfTest.test('unknown favorite actions cannot corrupt storage', async assert => {
  const storage = makeStorage();
  const app = createDinner(storage); await app.load(); await app.toggleFavorite('missing');
  assert(storage.writes.length === 0, 'Unknown recipe IDs must be ignored');
});
__selfTest.test('filter preferences use the same keys as App Settings', async assert => {
  const storage = makeStorage();
  const app = createDinner(storage); await app.load(); await app.updateFilters({ vegetarianOnly: true, maxTotalMinutes: 30 });
  assert(storage.values.vegetarianOnly === true && storage.values.maxTotalMinutes === 30, 'Write the shared preference keys');
});
__selfTest.test('filter preferences restore after reopening', async assert => {
  const app = createDinner(makeStorage({ vegetarianOnly: true, maxTotalMinutes: 37 }));
  await app.load();
  assert(app.filters.value.vegetarianOnly && app.filters.value.maxTotalMinutes === 37, 'Restore diet and a custom time limit');
});
__selfTest.test('clearing filters restores the full matching collection', async assert => {
  const app = createDinner(makeStorage({ vegetarianOnly: true, maxTotalMinutes: 1 }));
  await app.load(); await app.updateFilters({ ...DEFAULT_FILTERS });
  assert(app.matches.value.length === 2, 'Clear filters must recover the full pool');
});
__selfTest.test('invalid filter input leaves the old preferences intact', async assert => {
  const app = createDinner(); await app.load(); await app.updateFilters({ vegetarianOnly: true, maxTotalMinutes: -2 });
  assert(app.filters.value.maxTotalMinutes === 0 && !app.filters.value.vegetarianOnly && app.error.value.length > 0, 'Reject the entire invalid change with visible feedback');
});
__selfTest.test('storage-free mode supports dinner selection', async assert => {
  const app = createDinner(null); await app.load(); await app.spin();
  assert(app.dinner.value?.id === first.id && !app.error.value, 'The picker must remain usable without the OS');
});
__selfTest.test('storage-free mode supports favorite changes', async assert => {
  const app = createDinner(null); await app.load(); await app.toggleFavorite(first.id);
  assert(app.favoriteIds.value.includes(first.id) && !app.unsaved.value, 'Session favorites should work without claiming an OS save');
});
__selfTest.test('storage-free mode supports filters', async assert => {
  const app = createDinner(null); await app.load(); await app.updateFilters({ vegetarianOnly: true, maxTotalMinutes: 1 });
  assert(app.matches.value.length === 0, 'Session filters must remain functional');
});
__selfTest.test('unavailable storage does not leave initialization pending', async assert => {
  const storage = { get: async () => { throw new Error('Unavailable'); }, set: async () => { throw new Error('Unavailable'); } };
  const app = createDinner(storage); await app.load();
  assert(!app.loading.value && app.notice.value.includes('Could not load'), 'Failed reads should finish loading and show feedback');
});
__selfTest.test('failed save keeps the new dinner usable with an unsaved status', async assert => {
  const storage = { get: async () => null, set: async () => { throw new Error('Denied'); } };
  const app = createDinner(storage); await app.load(); await app.spin();
  assert(app.dinner.value?.id === first.id && app.unsaved.value && !!app.error.value && !app.saving.value, 'Keep session changes and expose a retry');
});
__selfTest.test('retry saves the latest pending dinner and clears failure state', async assert => {
  const storage = makeStorage();
  let fail = true;
  const port = { get: storage.get, set: async (key, value) => { if (fail) throw new Error('Denied'); return await storage.set(key, value); } };
  const app = createDinner(port); await app.load(); await app.spin(); await app.spin();
  fail = false; await app.retrySave();
  assert(storage.values.dailySelections['2026-10-13'] === second.id && !app.unsaved.value && !app.error.value, 'Retry must save current session state');
});
__selfTest.test('partial preference writes remain retryable', async assert => {
  const storage = makeStorage();
  let failTime = true;
  const port = { get: storage.get, set: async (key, value) => { if (key === 'maxTotalMinutes' && failTime) throw new Error('Denied'); return await storage.set(key, value); } };
  const app = createDinner(port); await app.load(); await app.updateFilters({ vegetarianOnly: true, maxTotalMinutes: 30 });
  failTime = false; await app.retrySave();
  assert(storage.values.vegetarianOnly === true && storage.values.maxTotalMinutes === 30 && !app.unsaved.value, 'Retry must finish a partially saved preference update');
});
__selfTest.test('rapid duplicate spins are ignored while a save is pending', async assert => {
  let release;
  const storage = { get: async () => null, set: async () => await new Promise(resolve => { release = resolve; }) };
  const app = createDinner(storage); await app.load();
  const pending = app.spin(); await app.spin();
  const id = app.dinner.value?.id; release(true); await pending;
  assert(id === first.id, 'A second click must not start a competing spin');
});
__selfTest.test('favorite changes are ignored while a save is pending', async assert => {
  let release;
  const storage = { get: async () => null, set: async () => await new Promise(resolve => { release = resolve; }) };
  const app = createDinner(storage); await app.load();
  const pending = app.toggleFavorite(first.id); await app.toggleFavorite(first.id);
  release(true); await pending;
  assert(app.favoriteIds.value.join() === first.id, 'A repeated click must not invert a pending favorite change');
});
__selfTest.test('spinning during initialization cannot overwrite stored selections', async assert => {
  let resolveDaily;
  let writes = 0;
  const storage = { get: async key => key === 'dailySelections' ? await new Promise(resolve => { resolveDaily = resolve; }) : null, set: async () => { writes += 1; } };
  const app = createDinner(storage); const pending = app.load(); await app.spin();
  resolveDaily({ '2026-10-13': second.id }); await pending;
  assert(writes === 0 && app.dinner.value?.id === second.id, 'Wait for restoration before enabling actions');
});
__selfTest.test('a recovered daily read merges historical data before saving', async assert => {
  const storage = makeStorage({ dailySelections: { '2026-10-12': second.id } });
  let failRead = true;
  const port = { get: async key => { if (key === 'dailySelections' && failRead) throw new Error('Unavailable'); return await storage.get(key); }, set: storage.set };
  const app = createDinner(port); await app.load(); failRead = false; await app.spin();
  assert(storage.values.dailySelections['2026-10-12'] === second.id && storage.values.dailySelections['2026-10-13'] === first.id, 'Protect history after a failed startup read');
});
__selfTest.test('an unread daily collection is never overwritten', async assert => {
  const storage = makeStorage({ dailySelections: { '2026-10-12': second.id } });
  const port = { get: async key => { if (key === 'dailySelections') throw new Error('Unavailable'); return await storage.get(key); }, set: storage.set };
  const app = createDinner(port); await app.load(); await app.spin();
  assert(storage.writes.length === 0 && app.unsaved.value, 'Keep changes pending until existing daily data can be read');
});
__selfTest.test('recovering favorites preserves existing favorites', async assert => {
  const storage = makeStorage({ favoriteIds: [second.id] });
  let failRead = true;
  const port = { get: async key => { if (key === 'favoriteIds' && failRead) throw new Error('Unavailable'); return await storage.get(key); }, set: storage.set };
  const app = createDinner(port); await app.load(); failRead = false; await app.toggleFavorite(first.id);
  assert(storage.values.favoriteIds.includes(first.id) && storage.values.favoriteIds.includes(second.id), 'Merge a newly saved favorite with recovered favorites');
});
__selfTest.test('saving an already-persisted favorite after a failed read does not remove it', async assert => {
  const storage = makeStorage({ favoriteIds: [first.id] });
  let failRead = true;
  const port = { get: async key => { if (key === 'favoriteIds' && failRead) throw new Error('Unavailable'); return await storage.get(key); }, set: storage.set };
  const app = createDinner(port); await app.load(); failRead = false; await app.toggleFavorite(first.id);
  assert(storage.values.favoriteIds.join() === first.id, 'Apply the requested saved state instead of blindly toggling recovered data');
});
__selfTest.test('App Settings preferences refresh when the app returns to focus', async assert => {
  const storage = makeStorage();
  const app = createDinner(storage); await app.load(); storage.values.vegetarianOnly = true; storage.values.maxTotalMinutes = 37;
  await app.refreshPreferences();
  assert(app.filters.value.vegetarianOnly && app.filters.value.maxTotalMinutes === 37, 'External preference edits must become visible');
});
__selfTest.test('a delayed preference refresh cannot override a later user change', async assert => {
  const storage = makeStorage();
  let hold = false;
  const releases = [];
  const port = { get: async key => hold ? await new Promise(resolve => releases.push(() => resolve(null))) : await storage.get(key), set: storage.set };
  const app = createDinner(port); await app.load(); hold = true;
  const refresh = app.refreshPreferences(); await app.updateFilters({ vegetarianOnly: true, maxTotalMinutes: 30 });
  releases.forEach(release => release()); await refresh;
  assert(app.filters.value.vegetarianOnly && app.filters.value.maxTotalMinutes === 30, 'A stale settings response must not undo an explicit change');
});
__selfTest.test('overlapping preference refreshes keep the newest response', async assert => {
  const storage = makeStorage();
  let hold = false;
  const releases = [];
  const port = { get: async key => hold ? await new Promise(resolve => releases.push({ key, resolve })) : await storage.get(key), set: storage.set };
  const app = createDinner(port); await app.load(); hold = true;
  const older = app.refreshPreferences();
  const newer = app.refreshPreferences();
  releases.slice(2).forEach(({ key, resolve }) => resolve(key === 'vegetarianOnly' ? true : 37));
  await newer;
  releases.slice(0, 2).forEach(({ key, resolve }) => resolve(key === 'vegetarianOnly' ? false : 0));
  await older;
  assert(app.filters.value.vegetarianOnly && app.filters.value.maxTotalMinutes === 37, 'An older response must not restore stale settings');
});
__selfTest.test('external preference changes announce the updated matching result', async assert => {
  const storage = makeStorage();
  const app = createDinner(storage); await app.load(); storage.values.maxTotalMinutes = 1;
  await app.refreshPreferences();
  assert(app.announcement.value.includes('Filters updated from App Settings.') && app.announcement.value.includes('No dinners'), 'Announce changed settings and their empty result');
});
__selfTest.test('preference refresh leaves unsaved local filters intact', async assert => {
  const storage = { get: async () => null, set: async () => { throw new Error('Denied'); } };
  const app = createDinner(storage); await app.load(); await app.updateFilters({ vegetarianOnly: true, maxTotalMinutes: 30 });
  await app.refreshPreferences();
  assert(app.filters.value.vegetarianOnly && app.filters.value.maxTotalMinutes === 30, 'Pending local preferences must survive refresh until retry succeeds');
});
__selfTest.test('favorites browsing does not replace the saved daily dinner', async assert => {
  const app = createDinner(makeStorage({ dailySelections: { '2026-10-13': first.id }, favoriteIds: [second.id] }));
  await app.load(); const views = useRecipeView(app.dinner, app.favorites); views.view.value = 'favorites'; views.selectFavorite(second.id);
  assert(views.activeRecipe.value?.id === second.id && app.dinner.value?.id === first.id, 'Favorite details must be separate from daily selection');
});
__selfTest.test('returning to Tonight shows the daily recipe again', async assert => {
  const app = createDinner(makeStorage({ dailySelections: { '2026-10-13': first.id }, favoriteIds: [second.id] }));
  await app.load(); const views = useRecipeView(app.dinner, app.favorites); views.view.value = 'favorites'; views.selectFavorite(second.id); views.showDinner();
  assert(views.activeRecipe.value?.id === first.id, 'Tonight must always show the daily dinner');
});
__selfTest.test('removing the selected favorite chooses a remaining favorite', async assert => {
  const app = createDinner(makeStorage({ favoriteIds: [first.id, second.id] }));
  await app.load(); const views = useRecipeView(app.dinner, app.favorites); views.view.value = 'favorites'; views.selectFavorite(first.id); await app.toggleFavorite(first.id);
  assert(views.activeRecipe.value?.id === second.id, 'A removed favorite cannot stay as the selected favorite');
});
__selfTest.test('favorites view has no detail after removing the final favorite', async assert => {
  const app = createDinner(makeStorage({ favoriteIds: [first.id] }));
  await app.load(); const views = useRecipeView(app.dinner, app.favorites); views.view.value = 'favorites'; await app.toggleFavorite(first.id);
  assert(views.activeRecipe.value === null, 'The last removal should lead to the deliberate empty state');
});
__selfTest.test('favorites browsing ignores spin filters', async assert => {
  const app = createDinner(makeStorage({ favoriteIds: [first.id], maxTotalMinutes: 1 }));
  await app.load();
  assert(app.matches.value.length === 0 && app.favorites.value.length === 1, 'Filters must not hide saved recipes');
});
__selfTest.test('revealing a recipe scrolls the content pane without scrolling the whole window', assert => {
  let scrolledTo;
  const pane = { scrollTop: 100, getBoundingClientRect: () => ({ top: 60 }), scrollTo: options => { scrolledTo = options.top; } };
  const target = { getBoundingClientRect: () => ({ top: 500 }), focus: () => {} };
  revealRecipeInPane(pane, target);
  assert(scrolledTo === 540, 'Scroll the content pane relative to its own position');
});
__selfTest.test('revealing recipe details preserves the intentional scroll during focus', assert => {
  let focusOptions;
  const pane = { scrollTop: 0, getBoundingClientRect: () => ({ top: 60 }), scrollTo: () => {} };
  const target = { getBoundingClientRect: () => ({ top: 500 }), focus: options => { focusOptions = options; } };
  revealRecipeInPane(pane, target);
  assert(focusOptions.preventScroll === true, 'Keyboard focus must not move another scroll container');
});
__selfTest.test('revealing an absent recipe is safe', assert => {
  assert(revealRecipeInPane(null, null) === false, 'A missing pane or detail must be harmless');
});
__selfTest.test('a spin announces the selected dinner with servings and total time', async assert => {
  const app = createDinner(null, [first]);
  await app.load(); await app.spin();
  assert(app.announcement.value === `Today's dinner is ${first.name}. Serves ${first.servings}. ${totalMinutes(first)} minutes total. This is the only matching dinner.`, 'Announce the complete selection summary');
});
__selfTest.test('opening a favorite announces its recipe summary', assert => {
  const views = useRecipeView(ref(first), ref([first, second]));
  views.view.value = 'favorites'; views.selectFavorite(second.id);
  assert(views.recipeAnnouncement.value === `Viewing ${second.name}. Serves ${second.servings}. ${totalMinutes(second)} minutes total.`, 'Announce the favorite being viewed');
});
__selfTest.test('removing the viewed favorite announces the replacement', assert => {
  const favorites = ref([first, second]);
  const views = useRecipeView(ref(null), favorites);
  views.view.value = 'favorites'; views.selectFavorite(first.id);
  favorites.value = [second];
  assert(views.recipeAnnouncement.value.startsWith(`Viewing ${second.name}.`), 'The announcement must follow the displayed remaining recipe');
});
__selfTest.test('an empty favorites view announces how to add a recipe', assert => {
  const views = useRecipeView(ref(null), ref([]));
  views.view.value = 'favorites';
  assert(views.recipeAnnouncement.value === 'Your recipe box is empty. Save a dinner from Tonight to add a favorite.', 'Explain the empty recipe box');
});
__selfTest.test('Tonight clears the favorites browsing announcement', assert => {
  const views = useRecipeView(ref(first), ref([second]));
  views.view.value = 'favorites'; views.selectFavorite(second.id); views.showDinner();
  assert(views.recipeAnnouncement.value === '', 'Tonight uses the dinner selection announcement');
});
__selfTest.test('a zero-minute cap also remains unrestricted for vegetarian meals', assert => {
  const collection = [
    { ...first, id: 'slow-veg', vegetarian: true, prepMinutes: 30, cookMinutes: 90 },
    { ...first, id: 'meat', vegetarian: false, prepMinutes: 5, cookMinutes: 5 },
  ];
  assert(filterRecipes(collection, { vegetarianOnly: true, maxTotalMinutes: 0 }).map(recipe => recipe.id).join() === 'slow-veg', 'Any time must retain slow vegetarian dinners while applying the diet filter');
});
__selfTest.test('every random interval excludes the current dinner when alternatives exist', assert => {
  const collection = [first, second, { ...first, id: 'third' }];
  const picks = [0, 0.25, 0.5, 0.75, 1].map(sample => chooseRecipe(collection, second.id, () => sample).id);
  assert(picks.every(id => id !== second.id), 'Repeat prevention must hold across the entire random range');
});
[
  [new Date(2026, 9, 31, 23, 59), new Date(2026, 10, 1, 0, 1), '2026-11-01'],
  [new Date(2026, 11, 31, 23, 59), new Date(2027, 0, 1, 0, 1), '2027-01-01'],
  [new Date(2024, 1, 28, 23, 59), new Date(2024, 1, 29, 0, 1), '2024-02-29'],
].forEach(([before, after, expectedKey]) => {
  __selfTest.test(`rollover saves a new dinner under ${expectedKey}`, async assert => {
    let clock = before;
    const storage = makeStorage();
    const app = createDinner(storage, [first], () => clock);
    await app.load(); await app.spin();
    clock = after; await app.spin();
    assert(storage.values.dailySelections[expectedKey] === first.id, 'Use the new local date across calendar boundaries');
  });
});
__selfTest.test('midnight leaves persisted favorites intact', async assert => {
  let clock = new Date(2026, 9, 13, 23, 59);
  const storage = makeStorage({ favoriteIds: [second.id] });
  const app = createDinner(storage, [first, second], () => clock);
  await app.load();
  clock = new Date(2026, 9, 14, 0, 1); app.checkDate();
  const reopened = createDinner(storage, [first, second], () => clock);
  await reopened.load();
  assert(reopened.favoriteIds.value.join() === second.id, 'Favorites belong to the recipe box rather than a calendar day');
});
__selfTest.test('an unread favorites collection is never overwritten', async assert => {
  const storage = makeStorage({ favoriteIds: [second.id] });
  const port = { get: async key => { if (key === 'favoriteIds') throw new Error('Unavailable'); return await storage.get(key); }, set: storage.set };
  const app = createDinner(port); await app.load(); await app.toggleFavorite(first.id);
  assert(storage.writes.length === 0, 'A failed favorites read must prevent replacing existing saved favorites');
});
__selfTest.test('retry recovers favorites without losing the session addition', async assert => {
  const storage = makeStorage({ favoriteIds: [second.id] });
  let unavailable = true;
  const port = { get: async key => { if (key === 'favoriteIds' && unavailable) throw new Error('Unavailable'); return await storage.get(key); }, set: storage.set };
  const app = createDinner(port); await app.load(); await app.toggleFavorite(first.id);
  unavailable = false; await app.retrySave();
  const reopened = createDinner(storage); await reopened.load();
  assert(reopened.favoriteIds.value.includes(first.id) && reopened.favoriteIds.value.includes(second.id), 'Retry must merge existing favorites with the pending addition');
});
__selfTest.test('session-only favorites are not claimed by a new instance', async assert => {
  const app = createDinner(null); await app.load(); await app.toggleFavorite(first.id);
  const reopened = createDinner(null); await reopened.load();
  assert(reopened.favoriteIds.value.length === 0, 'Without storage, favorites last only for the current session');
});
__selfTest.test('root app mounts', async assert => {
  await __selfTest.tick();
  assert(!!document.querySelector('#app .app-shell'), 'Root app should render');
});
__selfTest.test('spin and both view switches are reachable', async assert => {
  await __selfTest.tick();
  assert(!!document.querySelector('.spin') && document.querySelectorAll('nav[aria-label="Recipe views"] button').length === 2, 'Expose the primary action and both views');
});
__selfTest.test('selection announcements have mounted polite live regions', async assert => {
  await __selfTest.tick();
  assert(document.querySelectorAll('.sr-only[role="status"][aria-live="polite"][aria-atomic="true"]').length === 2, 'Dinner and favorites announcements must be available to assistive technology');
});

__selfTest.report();
