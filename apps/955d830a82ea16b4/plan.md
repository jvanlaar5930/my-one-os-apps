A high-performance, single-file web IDE for local development within one_OS, featuring syntax highlighting and AI assistance.

### Features:
* **Monaco-lite Editor**: A custom-built, lightweight code editor with line numbers and real-time syntax highlighting (CSS/JS/HTML).
* **File System Integration**: Full access to the OS filesystem via `os.fs` for opening, creating, and saving projects.
* **AI Code Assistant**: Integrated "CodeStream AI" using `os.ai.chat` for code explanation, debugging, or generation.
* **Project Sidebar**: A file tree view of the current working directory.
* **Terminal Output**: A simulated console for logging errors or AI responses.

### Bridge & data:
* **Filesystem**: `os.fs.openDialog` (load files), `os.fs.saveDialog` (save files), `os.fs.list` (browse directories), `os.fs.write` (save changes).
* **AI**: `os.ai.chat` for the intelligence engine.
* **Storage**: `os.storage` to persist user preferences (theme, font size, cursor color).

### Layout:
A three-pane flexbox layout: a narrow left sidebar (File Explorer), a large central editor area with line numbers, and a bottom panel (Console/AI Output).

### Build steps:
1. **Core UI Framework**: Set up the CSS grid/flexbox layout with "Matrix Green" (#00FF41) accents on a dark `#0D0D0D` background.
2. **Editor Engine**: Implement a `contenteditable` or `<textarea>` synchronized with a syntax-highlighting overlay (using a hidden `<pre><code>` element).
3. **File Bridge**: Wire up the sidebar to use `os.fs.openDialog` and populate the editor; implement `os.fs.saveDialog` for "Save As" functionality.
4. **AI Integration**: Add a floating command palette or side panel that sends the current buffer text + user prompt to `os.ai.chat`.
5. **Persistence Layer**: Implement an initialization routine that loads theme settings from `os.storage` and applies them to CSS variables.