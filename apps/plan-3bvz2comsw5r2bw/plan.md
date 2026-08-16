Pending Application Name: "Dream Diary" 💭

A personal journal app for recording, organizing, and revisiting your dreams over time.

**Features:**
- Create new dream entries with date/time picker, title, mood selector (😊 😨 🌀 ✈️ 😢 etc.), and free-form narrative body
- Browse all saved dreams in a reverse-chronological list with date, title, and mood preview
- Search/filter entries by keyword, mood, or date range
- Edit existing entries and permanently delete them
- Export all dreams as a formatted text file via `os.fs.saveDialog`
- Optional tags field per dream (comma-separated)

**Bridge & data:**
- `os.database.exec/runk/query` — SQLite table `dreams(id INTEGER PRIMARY KEY, title TEXT, created_at TEXT, mood TEXT, tags TEXT, body TEXT)`
- `os.storage.get/set` — keys: `defaultMoods` (array), `theme` ('light'|'dark'), lastOutputDir (`/Documents/Dream Diary/`)
- `os.fs.saveDialog` — export dreams to `.txt`
- `os.notify` — brief confirmation on save/delete
- No `openDialog` needed; this is primarily write-first with export-only read

**Layout:**
Vue 3 two-panel layout (~800×600 min): left sidebar = search bar + scrollable dream list; right panel = selected entry detail or empty "New Dream" form. Modal for create mode. Fully responsive flexbox, no fixed px sizes.

**Build steps:**
1. **Scaffold Vue 3 app + DB schema** — scaffold `index.html` with inline Vue 3 CDN and `<style>`, run `os.database.exec` to CREATE TABLE if absent, define a `useDreams.js` composable wrapping all database calls.
2. **Dream list sidebar** — build the left panel with a text search input (filters by title/body/tags) plus a scrollable list of cards showing date, mood emoji, and truncated title.
3. **Create / edit form** — build the right panel as either an edit view (pre-filled fields) or a blank "New Dream" form with inputs for title, datetime, mood dropdown, tags textarea, and body textarea; wire save/delete to DB and toast via `os.notify`.
4. **Search & filter logic** — add keyword search across title/body/tags and a mood-filter dropdown; implement in `useDreams` with dynamic SQL LIKE queries.
5. **Export & polish** — add an export button calling `os.fs.saveDialog({ initialName: 'dreams_export.txt' })` that serializes entries chronologically; apply consistent dark dreamy styling with CSS variables tied to the stored theme preference.