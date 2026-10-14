# 🧪 Pillar 4 Test

Build a "Pillar 4 Test" app that tests four things with clearly labeled buttons:

Download — generates a small text file and triggers an <a download> link to save it
Fullscreen — buttons to call os.window.requestFullscreen(), os.window.exitFullscreen(), and os.window.isFullscreen() with the result shown on screen
Blob Worker — spawns an inline new Worker(URL.createObjectURL(blob)) that computes a sum on a large array and posts the result back; show "Worker result: X"
Pointer Lock — a click target that calls document.body.requestPointerLock(); show current lock state via the pointerlockchange event

## Documentation

- [Build plan](plan.md)
- [Change history](CHANGELOG.md)
- [App manifest](manifest.json)

Built with **one_OS**. Install this app from this repository using the one_OS App Store.
