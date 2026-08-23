Pending Application Name: "Session Manager" 🔄

A profile-based session switcher that captures and restores entire desktop layouts (open apps, window positions, active documents) with one click or keyboard shortcut — letting users instantly toggle between workflows like Work, Gaming, and Creative.

**Features:**
- Create / edit / delete named profiles (e.g. "Work", "Gaming", "Creative") with custom icons and colors
- One-click **Capture Current Session** — records all open apps, their window positions/sizes, and active documents into the selected profile
- One-click **Restore Profile** — reopens saved apps in their saved layout via `os.window` commands and restores document focus
- Quick-switch toolbar with the active profile highlighted and a keyboard shortcut hint (Ctrl+1/2/3…)
- Visual session preview showing which apps are listed per profile, with app icons from the OS launcher
- Toast notifications on capture / restore events; empty-state guidance for first-time users

**Bridge & data:**
- `os.storage` — persist all profiles + `activeProfileId`; keys: `sm.profiles` (array), `sm.activeProfileId` (string)
- `os.window.getSize()` — snapshot current window dimensions on capture
- `os.window.move(x, y)` / `os.window.resize(w, h)` — apply saved layout on restore
- `os.messaging.listen(fn)` — register to receive OS-level "appOpened"/"appClosed" events so the manager can track what's running without polling
- `os.messaging.send(osShellAppId, { type: 'getSessionState' })` — attempt to query the OS shell for a full window list; fall back to manual capture if unresponsive
- `os.fs.list('/tmp/session-manager/')` + `os.fs.read/write` — optionally persist per-profile document refs (e.g. which files were open)
- `os.notify(msg)` — toast on restore / capture success/failure
- `os.system.openUrl(appId)` or equivalent launcher call to reopen apps on restore

**Layout:**
Vue 3 two-pane layout in a ~700×500 resizable window: left sidebar (scrollable profile cards with icon, name, app count badge); right panel (profile detail — session preview list, capture button, restore button, edit modal); top status bar showing the active profile and quick-switch shortcut hints.

**Build steps:**
1. **Data layer & storage bootstrap** — implement `useProfiles` composable wrapping `os.storage` reads/writes for `sm.profiles` (array of `{ id, name, icon, color, apps: [{ appId, x, y, w, h }], docs: [path] }`) and `sm.activeProfileId`; include seed data with three default profiles on first install.
2. **Profile list sidebar** — Vue component rendering a scrollable card list; each card shows icon, name, app count badge, active highlight; add "Add Profile" button opening an inline form (name, icon picker, color swatch).
3. **Session capture engine** — implement `captureCurrentSession()` that calls `os.window.getSize()`, attempts `os.messaging.send` to the OS shell for a window enumeration, and falls back to a manual checklist UI where users confirm which running apps belong in the profile; save results into the selected profile's `apps` array.
4. **Profile restore engine** — implement `restoreProfile(profile)` that iterates saved app entries, launches each via `os.system.openUrl(appId)`, then sequentially applies `os.window.move(x,y)` and `os.window.resize(w,h)` with a small delay between each; show progress toast per step and mark active profile in storage.
5. **Keyboard shortcuts & quick-switch toolbar** — render a thin top bar with the current profile badge and numbered shortcut hints (Ctrl+1 / Ctrl+2 / …); register keydown listener that maps to `restoreProfile(profiles[n])`; call `os.notify('Switched to Work')` on each switch.
6. **Polish & edge cases** — handle missing apps gracefully on restore (skip + log), prevent double-restore mid-animation, add confirm dialog before deleting a profile, wire up drag-reorder for profiles, and ensure the UI degrades gracefully when `window.os` is undefined (show static demo mode).