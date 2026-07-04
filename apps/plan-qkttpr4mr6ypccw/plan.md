Pending Application Name: "Kanban Pro" 📋

A professional-grade Kanban board application for managing tasks through columns and draggable cards, featuring persistent relational storage and data portability.

Features:
- Drag-and-drop task movement between columns.
- Full CRUD operations for tasks (Title, Description, Labels) and columns.
- Persistent SQLite database for robust task/column relationships.
- JSON Import/Export functionality for board backups and sharing.
- Task detail modal for advanced editing.
- Customizable column ordering and task priorities.

Bridge & data:
- `os.database`: Relational schema with `columns` (id, name, order) and `tasks` (id, column_id, title, description, priority, order) tables.
- `os.storage`: User preferences like `theme` or `defaultColumnOrder`.
- `os.fs.openDialog` / `os.fs.saveDialog`: For importing/exporting board state as `.json` files.
- `os.notify`: To confirm task updates and export completions.

Layout:
A horizontally scrollable viewport (`KanbanBoard.vue`) containing a flex-row of vertical columns (`Column.vue`), each hosting an ordered list of interactive cards (`TaskCard.vue`).

Build steps:
1. **Database Schema & Persistence Layer** — Set up the SQLite schema and a TypeScript utility to handle relational queries for tasks, columns, and their ordering.
2. **Kanban Logic Composable** — Develop `useKanban.ts` using Vue 3 Composition API to manage reactive state, drag-and-drop logic (using native HTML5 Drag/Drop), and database synchronization.
3. **Task & Column Components** — Implement the visual architecture using `.vue` SFCs: `Column.vue` for vertical containers and `TaskCard.vue` for individual task items.
4. **Task Editor Modal** — Build a `TaskModal.vue` component to handle detailed editing of task descriptions, labels, and priority levels.
5. **Data Portability System** — Implement the logic to serialize the entire database state into JSON for export via `os.fs.saveDialog` and reconstruct it from files via `os.fs.openDialog`.
6. **Final Integration & Settings** — Assemble the application in `app.ts`, add smooth CSS transitions for card movement, and implement `settings.json` for UI preferences like dark/light mode.