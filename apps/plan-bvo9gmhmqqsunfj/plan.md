Pending Application Name: "Binary Roundtrip Tester" 🔄

A test utility that verifies the full cycle of creating, saving, reading, and rendering a binary PNG file through the OS file APIs.

Features:
- Draw a procedural test pattern (gradient + shapes) on an HTML5 canvas
- Export canvas as base64 PNG using `canvas.toDataURL('image/png')`
- Save base64 to disk via `os.fs.writeBinary`
- Read file back with `os.fs.readBinary`
- Convert base64 to blob URL with `os.assets.createUrl`
- Display result image and track completion status of each step

Bridge & data:
- `os.fs.writeBinary`, `os.fs.readBinary`, `os.assets.createUrl`
- No persistent storage needed

Layout:
Vertical stack: canvas (top), step status checklist (middle), result image + "Run Test" button (bottom).

Build steps:
1. Create canvas, draw test pattern (gradient background, circle, text label)
2. Export to base64 PNG: `canvas.toDataURL('image/png')`
3. Save via `os.fs.writeBinary('/tmp/roundtrip-test.png', base64)` and mark step complete
4. Read back via `os.fs.readBinary('/tmp/roundtrip-test.png')`
5. Create blob URL: `os.assets.createUrl(readBase64, 'image/png')`
6. Render in `<img>` tag, update step indicators as each operation completes; add "Run Test" button to restart cycle