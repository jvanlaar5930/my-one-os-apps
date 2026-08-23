Pending Application Name: "Tiny Check" 🔍

A minimal single-page app that displays "chain test ok" and changes it to "clicked" when a button is pressed — essentially an OS bridge smoke test.

**Features:**
- Displays the text "chain test ok" by default
- One button labeled "Click me"
- Clicking the button swaps the text to "clicked"
- Works both inside one_OS and standalone (no `os.*` calls needed)

**Bridge & data:** none — no OS APIs required.

**Layout:** Centered single-column layout: a `<h1>` heading for the status text, then a centered `<button>`. Built as Vue 3 Composition API in `app.js`.

**Build steps:**
1. **index.html scaffold** — HTML shell with CDN Vue 3 script tag, root `<div id="app">`, and linked CSS/JS.
2. **Vue app (src/app.js)** — reactive `status` ref initialized to `"chain test ok"`, a `click()` handler that sets it to `"clicked"`, and the template rendering the text + button.
3. **styles.css** — minimal centering layout so the content looks tidy in any window size.