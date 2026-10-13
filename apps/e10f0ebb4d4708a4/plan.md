Pending Application Name: "Recipe Roulette" 🍽️

A welcoming dinner picker with complete built-in recipes, daily selections, and saved favorites—no network or images required.

**Features:**
- Prominent **Spin for Dinner** button draws from at least 30 varied, complete dinner recipes.
- Readable recipe cards show servings, prep/cook times, quantified ingredients, and numbered instructions.
- Restore today’s dinner by local calendar date; subsequent spins avoid repeating the current recipe when alternatives exist.
- Save or remove favorites and browse them in a dedicated view.
- Filter by vegetarian meals and maximum combined prep/cook time; clearly explain empty results and offer **Clear filters**.
- Inviting food-themed interface using typography, food emoji, and accessible touch controls rather than photos.

**Bridge & data:** Use guarded, awaited `os.storage.get/set` calls. Persist `dailySelections` as `{[localDate]: recipeId}`, `favoriteIds` as an array, and filter preferences as `vegetarianOnly` and `maxTotalMinutes`. Declare these preferences in `settings.json`; main-screen filters update the same keys. Keep the recipe collection bundled; no network capability needed. Outside the OS, remain usable with in-memory state.

**Layout:** Main picker and recipe details sit alongside each other in wider windows, stacking into one scrollable column on phones; favorites remain reachable through a visible view switch.

**Build steps:**
1. **Complete Recipe Collection** — Deliver at least 30 varied dinners with consistent quantities, servings, timings, dietary labels, and tested instruction completeness.
2. **Dinner Selection** — Implement filter-aware random selection, local-date restoration, no immediate repeats when possible, and explicit zero-match or single-match feedback.
3. **Favorites & Preferences** — Add persistent favorite toggles, a favorites view, and synchronized filter preferences.
4. **Responsive Recipe Experience** — Deliver food-themed cards, visible touch controls, keyboard access, clear focus states, and announced selection changes.
5. **Behavior Tests** — Verify recipe completeness, filter boundaries, repeat prevention, date rollover, favorites persistence, and storage-unavailable behavior.