**Pending Application Name: "Counter" 🔢**

A minimal counter app that displays a number and provides buttons to increment and decrement it, with persistent state across reloads.

**Features:**
- Display current count (starting at 0)
- Increment button to add 1
- Decrement button to subtract 1
- Reset button to return to 0
- Count persists across app reloads

**Bridge & data:**
- No special capabilities needed
- Uses os.storage for persistence: single key "count" (number)

**Layout:**
Centered vertical layout with large count display and three buttons below (Decrement, Reset, Increment) in a clean, minimal design.

**Build steps:**

1. **Counter display & button layout** — Create the component structure with a centered display of the current count and three buttons (Decrement, Reset, Increment).
2. **State and increment/decrement logic** — Implement reactive count state and wire button clicks to increment, decrement, and reset handlers.
3. **Persistence** — Load the saved count from os.storage on mount and save any changes whenever the count updates.