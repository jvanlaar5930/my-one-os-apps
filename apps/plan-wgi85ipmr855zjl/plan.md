Pending Application Name: "KanbanTeam Pro" 📋

A professional-grade Kanban board application for managing tasks through columns and draggable cards, featuring persistent relational storage and data portability.

**Features:**
- Drag-and-drop task movement between columns and reordering within columns using native HTML5 API.
- Full CRUD operations for tasks (Title, Description, Priority, Labels) and columns via SQLite.
- JSON Import/Export functionality for board backups and sharing via OS file dialogs.
- Task detail modal for advanced editing and priority/label management.
- Customizable column ordering and app theme preferences via OS App Settings.
- Responsive horizontal scrolling layout optimized for small window sizes.

**Bridge & data:**
- `os.database`: Relational schema with `columns` (`id`, `name`, `order`) and `tasks` (`id`, `column_id`, `title`, `description`, `priority`, `order`, `created_at`).
- `os.storage`: User preferences like `theme` and `defaultColumns`.
- `os.fs.openDialog` / `os.fs.saveDialog`: For importing/exporting board state as `.json` files.
- `os.notify`: To confirm task updates, column moves, and export completions.

**Layout:**
A horizontally scrollable viewport containing a flex-row of vertical columns, each hosting an ordered list of interactive cards, with a modal overlay for task details.

**Build steps:**
1. **Database Schema & Composable** — Define the SQLite schema and create a `useKanban` composable to manage reactive state, drag-and-drop logic, and database synchronization for columns and tasks.
2. **Core Components** — Implement `Column.vue` and `TaskCard.vue` SFCs with native HTML5 drag-and-drop attributes, ensuring smooth reordering and visual feedback.
3. **Task Editor Modal** — Build `TaskModal.vue` to handle detailed editing of task properties, including priority selection and label management, with real-time database updates.
4. **Data Portability System** — Implement JSON serialization logic to export the full board state via `os.fs.saveDialog` and reconstruct the database from imported files via `os.fs.openDialog`.
5. **Assembly & Settings** — Wire up `app.ts` to mount the Vue app, add CSS transitions for card movement, and configure `settings.json` for theme and layout preferences.