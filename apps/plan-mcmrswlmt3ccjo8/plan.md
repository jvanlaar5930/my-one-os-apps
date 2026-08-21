Pending Application Name: "Deal Alert System" 🚨

A real-time deal monitoring dashboard that watches RSS feeds, matches incoming deals against user-defined alert rules, and surfaces the best finds with browser notifications.

**Features:**
- Feed Manager — add/edit/delete RSS feed URLs (pre-loaded with Slickdeals Hot Deals, Frontpage, DealNews)
- Alert Rules Builder — keyword matching, max price threshold, category/tag filter, new-only vs all-matching toggle
- Unified Deal Feed — card-based list sorted newest-first showing title, price, original price, discount %, source, time, and rule-match highlight (green glow for matches, gray for neutral)
- Matched Deals Panel — filtered view of only deals matching active rules with the triggering rule(s) labeled
- Browser notifications + optional sound on new matched deals
- Stats Dashboard — feeds monitored, active rules count, today's matches, best discount of the day
- Auto-refresh interval (5/10/15/30 min) via settings.json; manual refresh button

**Bridge & data:**
- `os.network.fetch(url)` — fetch RSS XML from feed URLs (requires 'network' capability)
- `os.notify(message)` — toast for matched deals (requires 'notifications' capability)
- `os.storage` keys:
  - `das_feeds` → `[{id, name, url}]`
  - `das_rules` → `[{id, keywords, maxPrice, category, matchType:'new'|'all'}]`
  - `das_prefs` → `{refreshInterval: 5|10|15|30, soundEnabled: true}`
- Deals kept in-memory only (re-fetched on each refresh cycle)

**Layout:**
Vue 3 dark-themed dashboard — left sidebar (feeds list + stats summary), main area with tabbed navigation (All Deals | Matched Deals), card grid for deals, modal dialogs for add/edit feeds and rules; settings.json drives the auto-refresh interval and sound toggle.

**Build steps:**
1. **Skeleton & settings** — Create `index.html` with Vue 3 CDN, dark CSS variables, sidebar+main layout structure; add `settings.json` with `refreshInterval` (select: 5/10/15/30) and `soundEnabled` (boolean); wire `os.storage` reads for prefs at startup.
2. **Feed Manager** — Build feed list component with add/edit/delete CRUD, pre-populate default feeds; persist to `das_feeds` via `os.storage`; handle fetch errors gracefully with per-feed status indicators.
3. **RSS Parser & Deal Fetcher** — Implement `fetchFeeds()` that uses `os.network.fetch()` for each feed URL, parses XML with DOMParser (supporting both RSS 2.0 `<item>` and Atom `<entry>`), normalizes to `{id, title, price, originalPrice, discountPct, source, postedAt, url}`; cache results in memory.
4. **Alert Rules Builder** — Build rule creation/edit modal with keyword input (comma-separated), max price number field, category text, and match-type radio toggle; persist rules to `das_rules`; implement matching logic that checks title/description against keywords and price below threshold.
5. **Deal Display & Matched Panel** — Render unified deal cards sorted by newest; apply green glow class when a deal matches any active rule (show triggering rule name); build tabbed view switching between All Deals and Matched-Only panel; handle empty states with friendly messages.
6. **Notifications, Sound & Auto-refresh** — Implement `requestNotificationPermission()`, trigger browser notification + optional Audio beep on new matched deals; set up `setInterval` based on prefs refresh interval; add manual refresh button with loading spinner; build stats dashboard showing feeds count, rules count, today's matches, and best discount.