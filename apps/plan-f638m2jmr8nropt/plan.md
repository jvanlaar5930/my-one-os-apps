Pending Application Name: "Kanban Pro" 🔧

A diagnostic and repair pass for the Kanban Pro app to ensure robustness, data integrity, and accessibility per the provided checklist.

**Features:**
- Systematic audit and repair of all interactive elements, persistence logic, and error states.
- Fixes for drag-and-drop reliability, keyboard navigation, and responsive layout behavior.
- Expansion of `tests.js` with meaningful self-tests for core workflows and edge cases.
- Safe data migration handling for old or malformed storage/database entries.

**Bridge & data:**
- `os.database`: Verify schema safety, migration handling, and relational query correctness.
- `os.storage`: Ensure preferences persist across reloads and handle missing/malformed keys.
- `os.fs.openDialog` / `os.fs.saveDialog`: Validate import/export robustness and error feedback.
- `os.notify`: Confirm user feedback triggers correctly for key actions.

**Layout:**
- Review of the Kanban board's responsiveness across window sizes, focus states for keyboard nav, and handling of empty/loading/error states without broken UI.

**Build steps:**
1. **Interactive & Flow Audit** — Verify all buttons, forms, and links function as intended with no dead ends or unhandled promise rejections.
2. **Persistence & Migration Safety** — Ensure database and storage data survive reloads, and add safe defaults/migrations for malformed or old data.
3. **UX & Accessibility Repair** — Fix drag-and-drop reliability, keyboard navigation focus states, and responsive layout issues for small windows.
4. **Test Suite Expansion** — Add meaningful self-tests in `tests.js` covering core workflows, data persistence, and edge cases (empty board, import/export).
5. **Regression & Final Verification** — Run the full checklist against the repaired app to confirm stability, fix any remaining issues, and verify original workflows remain intact.