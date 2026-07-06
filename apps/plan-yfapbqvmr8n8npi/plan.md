Pending Application Name: "Kanban Pro" 📋

A professional Kanban board for managing tasks with drag-and-drop, persistent relational storage, and JSON data portability.

Features:
- Drag-and-drop task movement between columns with visual feedback and reordering.
- Full CRUD for tasks (title, description, priority, labels) and columns.
- SQLite-backed persistence for robust state management across reloads.
- JSON import/export for board backups and sharing.
- Task detail modal for advanced editing and label management.
- Customizable column ordering and priority-based sorting.

Bridge & data:
- `os.database`: `columns` (id, name, order) and `tasks` (id, column_id, title, description, priority, order) tables.
- `os.storage`: `theme`, `defaultColumnOrder`, `lastBoardPath`.
- `os.fs.openDialog` / `os.fs.saveDialog`: JSON file handling.
- `os.notify`: User feedback for imports/exports.

Layout:
Horizontally scrollable board (`KanbanBoard`) with vertical columns (`Column`) containing draggable task cards (`TaskCard`), all built with Vue 3 Composition API and responsive flex/grid layouts.

Build steps:
1. **Database Schema & Persistence** — Initialize SQLite tables and create a composable for CRUD operations and ordering logic.
2. **Drag-and-Drop & State Management** — Implement native HTML5 drag-and-drop with Vue composables to sync UI state to the database.
3. **Core Components** — Build `KanbanBoard`, `Column`, and `TaskCard` SFCs with responsive CSS and focus states.
4. **Task Editor Modal** — Create a modal form with validation for editing titles, descriptions, priorities, and labels.
5. **Data Portability** — Wire up JSON serialization/deserialization with `os.fs.saveDialog` and `os.fs.openDialog`, including error handling.
6. **Integration & Settings** — Assemble the app in `app.ts`, add `settings.json` for theme/layout preferences, and run final regression testing.