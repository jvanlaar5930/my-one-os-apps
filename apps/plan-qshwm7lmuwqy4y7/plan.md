Pending Application Name: "Code Snippet Manager" 💻

A developer utility to store, tag, and copy code snippets with syntax highlighting.

Features:
- Create/Edit/Delete snippets with title, language, and tags.
- Syntax highlighting using Prism.js.
- One-click copy to clipboard.
- Export snippets to JSON file.
- Persistent storage via OS bridge.

Bridge & data: `os.storage` (key: 'snippets' for array, 'settings' for defaults), `os.fs.saveDialog` (export), `os.clipboard.write` (copy).

Layout: Sidebar list of snippets, Main area with code editor and preview, Toolbar for actions.

Build steps:
1. **Storage Layer** — Persist snippet list and user preferences in os.storage.
2. **Snippet List** — Render a searchable sidebar of saved snippets with tags.
3. **Code Editor** — Build an input area with Prism.js highlighting for code content.
4. **Quick Actions** — Implement copy-to-clipboard and export-to-file dialogs.