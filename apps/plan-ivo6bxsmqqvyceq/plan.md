Pending Application Name: "Pillar 4 Test" 🧪

One-sentence: Validates four critical sandbox features—file download, fullscreen control, blob workers, and pointer lock—each with interactive buttons and live result display.

Features:
- Download: generate a text file and trigger `<a download>` to save it locally
- Fullscreen: request/exit fullscreen via `os.window.*()` methods and display current state
- Blob Worker: spawn an inline `new Worker(URL.createObjectURL(blob))` that sums a 1M-element array and posts result back
- Pointer Lock: request lock via `document.body.requestPointerLock()` and show lock state via `pointerlockchange` event

Bridge & data:
- APIs: `os.window.requestFullscreen()`, `os.window.exitFullscreen()`, `os.window.isFullscreen()`
- Native APIs: `document.requestPointerLock()`, `URL.createObjectURL`, `Worker`, `Blob`
- Storage: none
- Capabilities: none required

Layout:
Four sections stacked vertically, each with a button row and result display area. Fixed max-width, responsive padding.

Build steps:
1. Create `index.html` with four labeled sections (Download, Fullscreen, Blob Worker, Pointer Lock) and buttons
2. Style in `styles.css` with card layout, button styling, result boxes
3. Implement in `app.js`: download handler (blob → click), fullscreen handlers (call os.window methods), worker handler (blob code → Worker → postMessage), pointer lock handler (request + pointerlockchange listener)

---

## index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pillar 4 Test</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="app">
    <h1>Pillar 4 Test 🧪</h1>
    
    <section>
      <h2>Download</h2>
      <button id="download-btn">Generate & Download Text File</button>
      <div class="result" id="download-result">Ready</div>
    </section>
    
    <section>
      <h2>Fullscreen</h2>
      <button id="fullscreen-request">Request</button>
      <button id="fullscreen-exit">Exit</button>
      <button id="fullscreen-check">Check State</button>
      <div class="result" id="fullscreen-result">Not fullscreen</div>
    </section>
    
    <section>
      <h2>Blob Worker</h2>
      <button id="worker-spawn">Spawn & Compute Sum</button>
      <div class="result" id="worker-result">Idle</div>
    </section>
    
    <section>
      <h2>Pointer Lock</h2>
      <button id="pointerlock-request">Request Lock</button>
      <div class="result" id="pointerlock-result">Unlocked</div>
      <p class="hint">(Press ESC to unlock)</p>
    </section>
  </div>

  <script src="app.js"></script>
</body>
</html>
```

## styles.css
```css
* {
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f5f5f5;
  color: #333;
  margin: 0;
  padding: 12px;
  overflow-y: auto;
}

#app {
  max-width: 500px;
  margin: 0 auto;
}

h1 {
  margin: 0 0 16px;
  font-size: 20px;
  text-align: center;
}

section {
  background: white;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #ddd;
}

h2 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
  color: #555;
}

button {
  padding: 6px 10px;
  margin-right: 6px;
  margin-bottom: 8px;
  background: #0066cc;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
}

button:hover {
  background: #0052a3;
}

button:active {
  background: #003d7a;
}

.result {
  padding: 8px;
  background: #f9f9f9;
  border-left: 3px solid #0066cc;
  border-radius: 3px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-word;
  min-height: 20px;
}

.hint {
  font-size: 11px;
  color: #999;
  margin: 4px 0 0;
}
```

## app.js
```javascript
// Download test
document.getElementById('download-btn').addEventListener('click', () => {
  const content = `Pillar 4 Test\nGenerated: ${new Date().toISOString()}\n\nDownloaded via <a download> in sandbox.`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pillar4-test.txt';
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById('download-result').textContent = '✓ pillar4-test.txt downloaded';
});

// Fullscreen tests
const updateFullscreenState = async () => {
  if (window.os?.window) {
    const isFs = await window.os.window.isFullscreen();
    document.getElementById('fullscreen-result').textContent = `${isFs ? 'IN' : 'NOT IN'} fullscreen`;
  }
};

document.getElementById('fullscreen-request').addEventListener('click', async () => {
  if (window.os?.window) {
    await window.os.window.requestFullscreen();
    await updateFullscreenState();
  }
});

document.getElementById('fullscreen-exit').addEventListener('click', async () => {
  if (window.os?.window) {
    await window.os.window.exitFullscreen();
    await updateFullscreenState();
  }
});

document.getElementById('fullscreen-check').addEventListener('click', updateFullscreenState);

// Blob worker test
document.getElementById('worker-spawn').addEventListener('click', () => {
  document.getElementById('worker-result').textContent = 'Computing...';
  
  const workerCode = `
    self.onmessage = function(e) {
      const arr = e.data.array;
      let sum = 0;
      for (let i = 0; i < arr.length; i++) {
        sum += arr[i];
      }
      self.postMessage({ sum, count: arr.length });
    };
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(blob));
  
  worker.onmessage = (e) => {
    const { sum, count } = e.data;
    document.getElementById('worker-result').textContent = `✓ Sum of ${count.toLocaleString()} numbers = ${sum.toLocaleString()}`;
    worker.terminate();
  };
  
  worker.onerror = (err) => {
    document.getElementById('worker-result').textContent = `✗ Error: ${err.message}`;
  };
  
  const largeArray = Array.from({ length: 1000000 }, (_, i) => i + 1);
  worker.postMessage({ array: largeArray });
});

// Pointer lock test
const updateLockState = () => {
  const locked = document.pointerLockElement === document.body;
  document.getElementById('pointerlock-result').textContent = locked ? '🔒 LOCKED' : 'Unlocked';
};

document.getElementById('pointerlock-request').addEventListener('click', () => {
  document.body.requestPointerLock();
});

document.addEventListener('pointerlockchange', updateLockState);
document.addEventListener('pointerlockerror', () => {
  document.getElementById('pointerlock-result').textContent = '✗ Lock denied';
});

updateLockState();
```