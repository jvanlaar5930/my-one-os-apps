Pending Application Name: "FlowBoard" 📋

A beautiful Kanban board app with draggable cards, multiple columns, color-coded labels, and persistent state — all in a single self-contained HTML file using Vue 3 (native mode).

**Features:**
- Horizontal scrollable columns (default: Backlog, To Do, In Progress, Review, Done) with subtle distinct background colors
- Native drag-and-drop card movement between columns with smooth visual feedback
- Add/edit/delete cards via a modal (title, description, assignee, color label)
- Double-click column header to rename; "+" button to add new columns; trash icon on headers to delete
- Color-coded labels (bug 🔴, feature 🟢, improvement 🟡, task 🔵, spike 🟣) rendered as badges on cards
- Dark-mode-friendly palette with soft shadows, rounded corners, and hover effects

**Bridge & data:**
- `os.storage` — key `"flowboard-board"` stores the full board state `{ columns: [{ id, title, color }, { cards: [{ id, title, description, assignee, label }] }] }`; loaded at startup, saved on every mutation
- No file dialogs needed (no user-named documents)
- No speech capability needed (structured data entry, not prose)
- No network or database APIs required

**Layout:**
Full-width flex row of vertically-scrollable columns; each column has a colored header bar, card list area (drop zone), and an "Add Card" button at the bottom. A Vue modal overlay handles card editing. Root layout uses `%`/flex so it fills any window size and scrolls horizontally if needed.

**Build steps:**
1. **HTML shell + Vue 3 mount** — scaffold `index.html` with a `<div id="app">`, embed a `<style>` block (CSS variables for light/dark theme, column/card styles, modal), and an inline `<script>` that imports Vue 3 from CDN in native mode and mounts the app.
2. **Board state + persistence** — implement `loadBoard()` / `saveBoard()` using `os.storage` with a default 5-column seed; expose reactive `columns` and `activeCard` (for editing) via Vue Composition API.
3. **Column rendering + management** — build the column layout: header with title, rename-on-double-click, delete button, card list area, and "Add Card" footer; add `addColumn()` / `renameColumn()` / `deleteColumn()` methods.
4. **Native drag-and-drop** — wire `draggable="true"` on cards with `dragstart`/`dragover`/`drop`/`dragend` handlers that reorder the `columns` array by moving the dragged card's ID into the target column; add CSS for drop-zone highlighting and a ghost-style drag preview.
5. **Card editing modal** — create a Vue modal component with fields for title, description (textarea), assignee (text input), and label selector (color badge picker); implement `addCard()`, `editCard()`, `deleteCard()` methods that mutate the reactive board state.
6. **Polish & dark mode** — apply the color-coded label system to card badges, add hover/transition effects on cards and columns, ensure the palette works in both light and dark contexts via CSS variables (`--bg`, `--card-bg`, `--text`, etc.), and verify horizontal scrolling and resize behavior.