Pending Application Name: "Click Counter" 🎯

A simple clicker game where users tap a large button to increment a counter, watch it change colors with each click, and aim to reach 10 to unlock a goal message.

Features:
- Large interactive button that increments a counter on each click
- Button background changes to a random color after every click
- Counter display shows current click count
- Goal reached message appears when counter hits 10, then resets to 0
- Counter state persists across app reloads

Bridge & data:
- `os.storage` to persist counter value (key: `count`)
- No other APIs required

Layout:
- Centered vertical stack: title at top, large colorful button in middle, counter display below, goal message overlay when threshold reached

Build steps:
1. **Counter State & Persistence** — initialize counter from os.storage, update os.storage on each increment
2. **Button & Display** — render large centered button with current counter, click handler that increments
3. **Random Colors** — generate and apply random background color to button on each click
4. **Goal Logic & Reset** — detect when counter === 10, show goal message overlay, auto-reset counter to 0 after brief delay