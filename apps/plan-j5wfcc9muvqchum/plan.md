Pending Application Name: "CodeSnippet Manager" 📝

Summary: A developer utility to store, tag, and retrieve code snippets with syntax highlighting.

Features:
- Create/Edit/Delete snippets with language selection.
- Real-time syntax highlighting using Highlight.js.
- Tag filtering and search functionality.
- Copy to clipboard and export to file capabilities.

Bridge & data:
- `os.database` for storing snippet records (table: `snippets`, cols: `id`, `title`, `content`, `language`, `tags`, `created_at`).
- `os.storage` keys: `theme` (string), `defaultLang` (string).
- `os.clipboard.write` for copying snippet content.
- `os.fs.saveDialog` for exporting snippets to local files.

Layout:
Vue 3 SPA with a responsive flex layout: top search bar, left sidebar for tags, and a main grid for snippet cards.

Build steps:
1. **Setup Project** — Initialize index.html, styles.css, app.js, and src/ tree with Vue 3 CDN and Highlight.js script.
2. **Database Schema** — Create `os.database` table for snippets and implement `useDatabase` composable for queries.
3. **Snippet CRUD** — Build component for adding, editing, and deleting snippets with language picker and text area.
4. **Syntax Highlighting** — Integrate Highlight.js from CDN and apply it to snippet content in the UI render loop.
5. **Search & Tags** — Implement filtering logic to sort snippets by tags and search text using database queries.
6. **Export & Copy** — Add `os.clipboard.write` and `os.fs.saveDialog` for sharing snippets and exporting to text files.