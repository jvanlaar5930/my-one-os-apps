Pending Application Name: "Card Match Champion" 🎮

A memory-matching card game with a persistent leaderboard tracking player performance across difficulty levels and sessions.

**Features:**
- Flipping card pairs game with 4 difficulty levels (easy 4×4 to hard 8×8)
- In-game timer, move counter, and automatic win detection
- Post-game dialog: player name input + auto-save to leaderboard
- Leaderboard table: sortable by time, score, difficulty; filter by mode and show top 10
- Quick stats dashboard: best time, average score, total games played

**Bridge & data:**
- `os.database`: Table `games` (id, playerName, score, timeSeconds, difficulty, dateCreated). Queries: SELECT with ORDER BY timeSeconds/score, WHERE difficulty = ?, COUNT aggregates.
- `os.storage`: none

**Layout:**
Tabs: Game | Leaderboard. Game side: difficulty picker → card grid → timer + move count. Leaderboard side: filter dropdowns (difficulty, top-10 toggle) → sortable table.

**Build steps:**
1. Create DB schema on load: `CREATE TABLE games (id INTEGER PRIMARY KEY, playerName TEXT, score INTEGER, timeSeconds REAL, difficulty TEXT, dateCreated TEXT)`
2. Build card grid: shuffle pairs, render face-down cards, flip on click with match logic
3. Add game flow: difficulty select → start timer → detect win (all pairs matched) → show results dialog
4. Post-game: prompt player name, INSERT into games, reset for next round
5. Build leaderboard: query games with ORDER BY and WHERE filters, render sortable table
6. Add stats: query aggregates (MIN timeSeconds, AVG score, COUNT(*)) grouped by difficulty