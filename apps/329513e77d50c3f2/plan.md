A lightweight, grid-based pixel art creation tool with color selection and project export/import.

Features:
*   **Drawing Engine**: Click/drag to draw pixels with a brush or eraser.
*   **Color Palette**: Custom color picker to select drawing color.
*   **Grid Controls**: Toggleable grid overlay and adjustable grid size (e.g., 16x16, 32x32).
*   **Project Management**: Save/Load `.pax` files (JSON) via OS dialogs to preserve layers/colors.
*   **Image Export**: Export the canvas as a PNG data URL.
*   **Undo/Redo**: Simple state stack for mistakes.

Bridge & data:
*   `os.fs.saveDialog` / `os.fs.openDialog`: For saving/loading `.pax` project files.
*   `os.storage`: To persist "Recent Colors" and the user's preferred grid size.
*   `os.notify`: To confirm "Saved", "Loaded", or "Copied to Clipboard".

Layout:
A vertical toolbar on the left for tools (Brush, Eraser, Clear, Grid Toggle) and color selection, a central canvas area with a scrollable workspace, and a bottom status bar showing current coordinates.

Build steps:
1.  **Setup Canvas**: Implement a high-DPI HTML5 Canvas using `image-rendering: pixelated` CSS to ensure sharp pixel edges.
2.  **Drawing Logic**: Create a coordinate mapping function (canvas pixel $\to$ grid cell) and an event listener for `mousedown`, `mousemove`, and `mouseup` to handle drawing/erasing.
3.  **UI Controls**: Build a color swatch selector and a toolbar using CSS Flexbox/Grid; use Unicode characters or inline SVGs for icons to avoid external assets.
4.  **State Management**: Implement a command pattern or a simple state stack (array of `ImageData`) to support undo/redo.
5.  **File I/O**: 
    *   Implement `saveProject`: Serialize the grid (2D array or flat TypedArray) and current settings to JSON $\to$ `os.fs.saveDialog`.
    *   Implement `loadProject`: `os.fs.openDialog` $\to$ Parse JSON $\to$ Re-populate canvas and UI.
6.  **Export**: Use `canvas.toDataURL()` to allow the user to "copy" or "save" the resulting art.