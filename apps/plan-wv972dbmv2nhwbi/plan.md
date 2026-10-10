Pending Application Name: "Political Trends Dashboard" 📊

A polished news-style dashboard that surfaces simulated political headlines across categories (US Politics, International, Policy/Legislation, Elections) with search/filtering, trending tags, source attribution, and timestamps — all in a responsive card-based layout.

**Features:**
- Category-filtered card grid: US Politics, International, Policy/Legislation, Elections — each with color-coded badges
- Search bar that filters by keyword across title, summary, and tags (works on phone tap too)
- Trending topic chips at the top; clicking a chip filters to matching articles
- Source attribution + relative timestamps (e.g. "2h ago · Reuters") on every card
- Sentiment indicator dot (🟢 positive / 🟡 mixed / 🔴 negative) per article
- Collapsible category sections on phone; single-column fold at <600px

**Bridge & data:**
- `os.storage` keys: `{ lastSearch, collapsedCategories }` — persists search term and which categories the user collapsed between reloads
- No database needed (small static dataset); no file I/O; no network/speech/clipboard capabilities required
- All article data is embedded as a TypeScript constant in `src/data/articles.ts`

**Layout:**
Top bar with app title + live search input; below that, a horizontal scrollable strip of trending chips; main area is a 2-column CSS grid of category sections (each section header clickable to collapse on phone), each containing card rows. Below 600px everything stacks to one column, chips become scrollable, and cards fill the full width.

**Build steps:**
1. **Skeleton & data layer** — Create `index.html`, `styles.css`, `app.js`, `src/types/politics.ts`, and `src/data/articles.ts` with ~20 realistic simulated articles spanning all four categories, sources, timestamps, tags, and sentiment values.
2. **SearchBar component** — Build `src/components/SearchBar.vue` bound to a reactive search string; wire it into the root so filtering works on every keystroke and survives reload via `os.storage`.
3. **TrendingTags component** — Build `src/components/TrendingTags.vue` that derives unique tags from all articles, renders them as clickable chips, and emits a selected tag event to the parent for combined filtering (search ∩ tag).
4. **NewsCard + CategorySection components** — Build `src/components/NewsCard.vue` (title, summary, source, timestamp, sentiment dot, tag pills) and `src/components/CategorySection.vue` (collapsible header with article count, grid of NewsCards); wire both into the root layout.
5. **Root App.vue + persistence** — Assemble the full dashboard in `src/App.vue`, implement combined search+tag filtering logic, save/load `lastSearch` and `collapsedCategories` through `os.storage`, add responsive CSS for phone fold, and verify all cards render with proper attribution.