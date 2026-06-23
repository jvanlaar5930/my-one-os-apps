Pending Application Name: "Bridge Tester" 🧪

A simple test harness that demonstrates each major OS bridge API with individual buttons and result displays.

**Features:**
- AI chat button: call os.ai.chat with a sample prompt, display response
- File read button: open file dialog, read and display file content
- Clipboard read button: paste system clipboard content
- Notify button: show an OS toast notification
- Error handling: display any API errors below each button
- Works offline for non-AI features

**Bridge & data:**
- APIs: os.ai.chat, os.fs.read, os.fs.openDialog, os.clipboard.read, os.notify
- Capabilities: 'ai', 'clipboard'
- Storage: none

**Layout:**
Grid of 4 test cards, each with a button and a result output area.

**Build steps:**
1. Create 4 test sections (AI, File, Clipboard, Notify) with buttons
2. Implement click handlers that call each API
3. Render results or error messages in output areas
4. Guard all API calls with `if (window.os)` check
5. Style with glass/button utilities, ensure window fits small sizes

---

Here's the complete app:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bridge Tester</title>
  <!--APP {"name":"Bridge Tester","icon":"🧪","capabilities":["ai","clipboard"]}-->
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #0f0f23 0%, #1a0f3f 100%);
      color: #e0e0e0;
      min-height: 100vh;
    }
    h1 {
      margin: 0 0 24px 0;
      font-size: 20px;
      color: #fff;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px;
      backdrop-filter: blur(10px);
    }
    .card h2 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
    }
    button {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      transition: opacity 0.2s;
      width: 100%;
    }
    button:hover {
      opacity: 0.9;
    }
    button:active {
      opacity: 0.8;
    }
    .output {
      margin-top: 12px;
      padding: 10px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
      min-height: 40px;
      font-size: 12px;
      line-height: 1.4;
      max-height: 120px;
      overflow-y: auto;
      color: #90ee90;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .output.error {
      color: #ff6b6b;
    }
    .output.empty {
      color: #808080;
      font-style: italic;
    }
    @media (max-width: 600px) {
      .grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <h1>🧪 Bridge Tester</h1>
  <div class="grid">
    <div class="card">
      <h2>AI Chat</h2>
      <button onclick="testAI()">Ask AI</button>
      <div id="ai-output" class="output empty">No result yet</div>
    </div>

    <div class="card">
      <h2>File Read</h2>
      <button onclick="testFileRead()">Open & Read</button>
      <div id="file-output" class="output empty">No result yet</div>
    </div>

    <div class="card">
      <h2>Clipboard</h2>
      <button onclick="testClipboard()">Read Clipboard</button>
      <div id="clipboard-output" class="output empty">No result yet</div>
    </div>

    <div class="card">
      <h2>Notification</h2>
      <button onclick="testNotify()">Show Toast</button>
      <div id="notify-output" class="output empty">No result yet</div>
    </div>
  </div>

  <script>
    function setOutput(id, content, isError = false) {
      const el = document.getElementById(id);
      el.textContent = content;
      el.classList.remove('empty', 'error');
      if (isError) el.classList.add('error');
    }

    async function testAI() {
      if (!window.os) {
        setOutput('ai-output', 'os not available (run in OneOS)', true);
        return;
      }
      setOutput('ai-output', 'Calling AI...');
      try {
        const result = await os.ai.chat('What is 2 + 2?');
        setOutput('ai-output', result);
      } catch (e) {
        setOutput('ai-output', `Error: ${e.message}`, true);
      }
    }

    async function testFileRead() {
      if (!window.os) {
        setOutput('file-output', 'os not available (run in OneOS)', true);
        return;
      }
      setOutput('file-output', 'Opening file dialog...');
      try {
        const file = await os.fs.openDialog({ title: 'Pick a file to read' });
        if (!file) {
          setOutput('file-output', 'No file selected');
          return;
        }
        setOutput('file-output', `Read ${file.path}:\n\n${file.content.substring(0, 300)}${file.content.length > 300 ? '...' : ''}`);
      } catch (e) {
        setOutput('file-output', `Error: ${e.message}`, true);
      }
    }

    async function testClipboard() {
      if (!window.os) {
        setOutput('clipboard-output', 'os not available (run in OneOS)', true);
        return;
      }
      setOutput('clipboard-output', 'Reading clipboard...');
      try {
        const text = await os.clipboard.read();
        setOutput('clipboard-output', text || '(clipboard is empty)');
      } catch (e) {
        setOutput('clipboard-output', `Error: ${e.message}`, true);
      }
    }

    async function testNotify() {
      if (!window.os) {
        setOutput('notify-output', 'os not available (run in OneOS)', true);
        return;
      }
      try {
        await os.notify('🎉 Hello from Bridge Tester!');
        setOutput('notify-output', 'Notification sent!');
      } catch (e) {
        setOutput('notify-output', `Error: ${e.message}`, true);
      }
    }
  </script>
</body>
</html>
```

Ready to install. Copy the HTML into OneOS and it will test all four API capabilities individually.