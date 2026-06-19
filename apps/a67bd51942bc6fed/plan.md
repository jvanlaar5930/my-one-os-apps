- A self-contained CSV spreadsheet editor with inline editing, block selection, safe formula evaluation, and formatting.
- Features:
  - Open/Save/Save-As CSV via file dialog with proper quote escaping and line-break handling.
  - Click-to-edit cells with click-and-drag block selection and real-time value updates.
  - One-click header toggle that bolds/stylizes the first row and adjusts formula ranges.
  - Safe formula engine parsing `=A1+B2` syntax, resolving cell references, and evaluating without `eval()`.
  - Cell background/text color pickers, bold toggle, and built-in alignment presets.
  - Direct CSV export that serializes the current grid state back to standard RFC 4180 format.
- Bridge & data: `os.fs.openFile('csv')`, `os.fs.saveFile()`, `os.fs.saveAsFile()`, `os.notify()`; `os.storage` key `csv_editor` stores `{headers: bool, styles: {row,col: {bg, fg, bold}}, lastPath: string}`.
- Layout: Top toolbar (file actions, format controls, formula bar), middle scrollable table grid with sticky header, bottom status bar (cell address, row/col count).
- Build steps:
  1. Scaffold HTML/CSS: toolbar, grid container, status bar; implement CSS table with sticky header, selection overlay, and cell input styling.
  2. Implement CSV parser/serializer: handle commas, quotes, newlines; create `parseCSV(str)` and `toCSV(grid)` functions.
  3. Build grid engine: render dynamic `<td>` elements, attach `contenteditable` or `<input>`, implement mousedown/mousemove/mouseup for drag selection.
  4. Code safe formula evaluator: regex extract `=A1+B2`, map cell references to current values, use `Function('return ' + expr)` or manual token parsing to avoid `eval()`.
  5. Wire formatting & headers: bind color pickers/bold toggle to cell styles, implement header row toggle that applies CSS classes and adjusts formula bounds.
  6. Connect file I/O: bind toolbar to `os.fs.*` calls, handle save-as flow, add `os.notify()` for success/error, persist styles to `os.storage` on change.