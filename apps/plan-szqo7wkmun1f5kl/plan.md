Pending Application Name: "Screenshot Tool" 📸

A lightweight tool for capturing and organizing screenshots with snipping support, clipboard integration, and a clean minimal interface.

Features:
- Full-window capture button that saves screenshots to /Downloads as PNG images
- Snip mode: click to activate, then drag a rectangle to capture just that region
- Copy captured screenshot to system clipboard with one click
- Auto-preview and toast notification after each capture
- Recent captures list with thumbnails, delete, and re-copy options
- Keyboard shortcuts (Ctrl+Shift+S for full capture, Ctrl+Shift+X for snip mode)

Bridge & data:
- `os.fs.writeBinary()` (save PNG images), `os.assets.createUrl()` (preview thumbnails), `os.clipboard.write()` (copy to clipboard), `os.notify()` (toast notifications)
- Requires: 'clipboard' capability
- Persists in `os.storage`: recent captures list as `{ id, timestamp, size, path }` objects (binary image data saved via `os.fs`)

Layout:
Top bar with Capture / Snip / Clear buttons and mode indicator; main panel shows scrollable recent captures grid with thumbnails, delete buttons, and re-copy action. Snip mode overlays a translucent selection rectangle with dimension labels and a click-to-save prompt.

Build steps:
1. **Capture & Preview** — Full-window capture using canvas snapshot, convert to PNG, save via `os.fs.writeBinary()`, and display preview with `os.assets.createUrl()`.
2. **Snip Selection** — Toggle snip mode, render drag-to-select overlay on canvas with real-time rectangle feedback and dimension display.
3. **Storage & List** — Persist capture metadata in `os.storage`, render recent captures as a scrollable thumbnail grid with timestamp and file size.
4. **Clipboard & Notifications** — Add copy-to-clipboard action for each capture via `os.clipboard.write()` and show success toast via `os.notify()`.
5. **Keyboard Shortcuts** — Listen for Ctrl+Shift+S (full) and Ctrl+Shift+X (snip) to trigger capture modes without clicking.
6. **Polish & Cleanup** — Add delete actions to remove old captures from list and disk, ensure smooth mode transitions, test preview rendering for various image sizes.