Pending Application Name: Tiny Check 🖱️

A bare-minimum single-page app with one line of text and one button — click the button to toggle the displayed text. Nothing more.

Features:
- Displays "chain test ok" as centered text on load.
- One button that, when clicked, changes the text to "clicked".
- Minimal styling; fits in a small window.
- No storage, no settings, no extra screens.

Bridge & data: none — no os.* APIs needed.

Layout: single Vue component, centered flex layout with text + button stacked vertically.

Build steps:
1. **index.html + app comment** — set up the HTML shell with native mode declaration and load Vue 3 from CDN.
2. **src/app.js** — write a minimal Vue 3 app that holds `text` in reactive state, renders "chain test ok" or "clicked" based on whether the button was clicked, and mounts it to `#app`.