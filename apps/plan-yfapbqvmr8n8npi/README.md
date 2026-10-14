# 📋 Kanban Pro

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

## Later additions
- Run a full diagnostic bug review of "Kanban Pro".

Go through this checklist against the actual code and behavior, fix anything broken, then report what you checked and what (if anything) you fixed:
- Every interactive element (buttons, links, forms, inputs) does what it visually implies, with no dead ends.
- No console errors, unhandled promise rejections, or exceptions during normal use.
- Empty, loading, and error states are handled — nothing crashes or shows broken UI on first load or with no data.
- Data that should persist (via the OS storage bridge) actually survives a reload.
- Persisted storage/database data is treated compatibly: old or malformed data gets safe defaults or migration instead of being erased.
- Forms and inputs validate and give clear feedback instead of failing silently.
- Layout holds up at different window sizes — no overlapping, clipped, or cut-off content.
- Keyboard navigation and focus states work for the primary actions.
- Existing workflows still work after the repair or edit; do a regression sweep, not just a narrow symptom fix.
- tests.js contains meaningful self-tests for core workflows and is updated for any bug fix or behavior change.

When fixing a bug, repair the root cause, preserve unrelated behavior, and add or update at least one self-test in tests.js that would have caught the issue. Verify the original workflows still work after the change.

## Documentation

- [Build plan](plan.md)
- [Change history](CHANGELOG.md)
- [App manifest](manifest.json)

Built with **one_OS**. Install this app from this repository using the one_OS App Store.
