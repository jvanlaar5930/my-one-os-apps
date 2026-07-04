Pending Application Name: "Kanban Board" 📋

A multi-board kanban app with draggable cards, column management, and rich card detail editing — built as Vue SFCs with TypeScript composables.

**Features:**
- Multiple named boards with a sidebar switcher
- Draggable cards between columns via HTML5 drag-and-drop
- Card details: title, description, due date, and color label
- Column management — add, rename, delete columns
- Card count badge per column, collapsed empty-column state
- Persistent across reloads via `os.database`

**Bridge & data:**
- `os.database` — three tables: `boards (id, name, created_at)`, `columns (id, board_id, title, position)`, `cards (id, column_id, title, description, due_date, label_color, position)`
- `os.storage` — `activeBoard` (string), `openCardId` (string|null)
- `settings.json` — `defaultBoardName` (text, default `"My Board"`)

**Layout:** Sidebar (board list + new-board button) | scrollable column strip (KanbanColumn cards) | slide-over drawer (CardDetail), all wired via `App.vue` root in Vue-SFC mode.

**Build steps:**

1. **Schema & `useKanban` composable** — Create `src/composables/useKanban.ts` with `os.database` DDL, typed CRUD methods for boards/columns/cards, and reactive refs for the active board state.
2. **App shell & board sidebar** — `App.vue` entry wired to `app.js`, plus `BoardSidebar.vue` listing boards with add/rename/delete; reads `defaultBoardName` from `os.storage` on first launch.
3. **Column strip & KanbanColumn** — `KanbanBoard.vue` renders a horizontal scrolling strip of `KanbanColumn.vue` components, each with a header (rename inline, delete), card count badge, and an "Add card" button.
4. **Card & drag-and-drop** — `KanbanCard.vue` with `draggable` + `dragstart`/`dragover`/`drop` handlers; position updates write back via `useKanban`; visual drop-target highlight on columns.
5. **Card detail drawer** — `CardDetail.vue` slides in when a card is clicked: editable title, textarea description, date picker, 8-color label palette, and a delete button; saves on blur/change.