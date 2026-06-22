## Build Plan: 3D Battle Chess

**Summary:** A turn-based chess game with canvas-based 3D rendering, theme selection, AI opponent, and animated piece destruction. Players move pieces in 3D space; computer (or swapped player) responds. Win by capturing the enemy king.

**Features:**
- Theme menu (Classic, Animals, Vehicles, Ninjas, etc.) with color/character-style variants
- Canvas 3D board with perspective camera; click-to-move turn-based interaction
- Move highlighting: select piece → see all legal moves → click destination
- Capture animation: defeated pieces spin and fade with a "Destroy" effect
- Minimax AI opponent (3-move look-ahead with alpha-beta pruning)
- Running timer (pausable), turn indicator, captured pieces display
- Win condition: enemy king captured → Victorious! overlay with victory pose and "New Game" button

**Bridge & data:**
- `os.storage`: selected theme, timer state, move history (for undo/replay), AI difficulty setting
- No file I/O or AI chat needed

**Layout:**
- Full window: **Menu** (theme grid) → **Game** (canvas board left, sidebar right: timer + captured pieces + move log + pause button) → **Victory modal** (overlay with victory pose, "Victorious!" text, New Game button)
- Flexible sizing (canvas and sidebar scale with window)

**Build steps:**
1. **Menu & theme system:** Create a selectable theme grid (5–6 themes); on select, initialize board state and store theme choice.
2. **3D canvas setup & piece rendering:** Implement perspective projection math (3D → 2D canvas); draw board plane and pieces as 3D geometry (cubes/pyramids); add click-to-square input mapping.
3. **Chess rules & move validation:** Piece classes (Pawn, Rook, Knight, Bishop, Queen, King); validate legal moves per piece type; track whose turn it is.
4. **Move interaction & animation:** Highlight legal moves on piece click; execute move on square click; animate piece slide and capture "spin-fade" effect; detect check/checkmate.
5. **AI opponent:** Implement minimax search (depth 3–4); add 500ms delay so it doesn't play instantly; alternate turns.
6. **Timer, win detection & polish:** Add running timer (pausable button); check win condition after every move; display victory modal with king-over-king visual pose; persist game to storage; "New Game" resets.