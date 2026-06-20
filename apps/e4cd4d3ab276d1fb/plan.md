A lightweight, single-file text editor for writing and saving code, featuring real-time syntax highlighting via a custom regex-based engine.

**Features:**
*   **Syntax Highlighting:** Real-time colorization for common languages (JS, HTML, CSS, Python) using an overlay technique.
*   **File Management:** Open existing files from the OS and save work to the filesystem.
*   **Line Numbering:** A synchronized gutter showing line numbers.
*   **Smart Indentation:** Basic support for Tab/Enter indentation logic.
*   **Theme Toggling:** Switch between Dark and Light modes via `os.storage`.

**Bridge & data:**
*   `os.fs.openDialog`: To load files into the editor.
*   `os.fs.saveDialog`: To export code to the filesystem.
*   `os.storage`: To persist user preference (`theme: 'dark'|'light'`).

**Layout:**
A vertical stack consisting of a top toolbar (File/Save/Theme) and a main container containing a synchronized dual-layer system: a transparent `<textarea>` for input and a `<pre><code>` block behind it for highlighting.

**Build steps:**
1.  **UI Setup:** Create a flexbox layout with a toolbar and a `relative`-positioned editor container. Implement the "layered" approach where the textarea is transparent but has identical font properties (size, padding, line-height) as the syntax layer to ensure perfect alignment.
2.  **Syntax Engine:** Write a function that takes raw text and applies regex replacements (e.g., `/\b(const|let|function|return)\b/g` $\rightarrow$ `<span class="keyword">$1</span>`) to create HTML-wrapped tokens for the background layer.
3.  **Sync Logic:** Implement an `oninput` event listener that updates the background `<code>` block's content and synchronizes scrolling between the textarea and the code layer.
4.  **File I/O:** Use `os.fs.openDialog` to read file content and populate the textarea; use `os.fs.saveDialog` to write the current textarea value to a user-chosen path.
5.  **Persistence:** On load, check `os.storage.get('theme')`; on theme toggle, update it using `os.storage.set`.