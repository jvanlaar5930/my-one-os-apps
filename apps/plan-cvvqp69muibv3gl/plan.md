Pending Application Name: "Previously On…" 🎮

A dark, cinematic save-state journal for games: it logs where you stopped in each game and shows a TV-style "Previously, in <Game>…" recap when you come back.

Features:
- **Game backlog**
  - Add, edit and remove games with title, platform and status (playing, paused, backlog, finished, abandoned).
  - Each game also has a length/type (short session, medium, long haul) and a mood tag (chill, sweaty, story).
  - `lastPlayed` updates automatically whenever a save-note is logged.
- **Quick save-note**
  - A 30-second "I'm stopping now" form with: where I am, what I was about to do, things I'll forget, and an optional level/progress.
  - Each note is timestamped and kept as a history for that game.
  - The prose fields each have a mic button for dictation.
- **Recap card**
  - A bold, dark, letterboxed card with a big title: "Previously, in <Game>…".
  - A short narrative paragraph is composed from the latest note, e.g. "It's been 23 days. You were in the Sunken Archive, about to take on the Warden. Remember: boss weak to fire."
  - Older notes appear below in a collapsible timeline.
- **"What should I play tonight?" picker**
  - Choose available time (30 min / 1–2 hrs / whole evening) and a mood.
  - It suggests one game with a one-line reason and a Reroll button.
  - Selection is a weighted random pick: it favours games that match the time and mood and games untouched the longest, and excludes finished and abandoned games.
- **Backlog honesty**
  - Lists games sorted by days since last played.
  - Anything past the threshold (30 days by default) shows "Going back, or letting go?" with buttons for Playing and Abandoned.
- **Home screen and first run**
  - Home shows recently played games as recap cards, plus a prominent "What should I play?" button and a quick "+ Add game" button.
  - Empty states walk you through a first run ("Add your first game → log a save-note when you stop"). No sample data is included.

Bridge & data:
- **`os.database`** (capability `database`), because games and notes are related and the app needs sorted queries.
  - `games(id, title, platform, status, length, mood, createdAt, lastPlayed)`
  - `notes(id, gameId, createdAt, location, nextAction, reminders, progress)`
  - "Recent" and "Honesty" are sorted with `ORDER BY lastPlayed`, and each game's timeline is `WHERE gameId = ?`.
- **`os.speech`** (capability `speech`) powers the dictate buttons on the "where I am", "about to do" and "things I'll forget" fields. It also handles `onLevel` `'transcript'`/`'ended'` events and cancels on unmount.
- **`os.storage`** holds preferences only:
  - `staleDays` (number, default 30), `recentCount` (number, default 6)
  - `lastPickerTime` and `lastPickerMood`, so the picker remembers your last choices
- **`settings.json`** exposes `staleDays` ("Days before a game counts as neglected") and `recentCount` ("Recap cards on home").
- **`os.notify`** shows a confirmation toast when a save-note is logged.
- All `os.*` calls are guarded, and the app falls back to in-memory data when it runs outside one_OS.

Layout: A top bar with tabs (Home · Backlog · Honesty), a main content area with cards in a responsive grid, and overlay panels for the Add/Edit game form, the Quick save-note form, the Recap detail view and the Picker. The theme is dark with neon accent colours per mood tag, and it scrolls within a small window.

Build steps:
1. **Data layer & backlog CRUD** — Create the database schema and a games/notes repository, then build the Backlog tab where users add, edit, delete and filter games by status and mood, with empty-state guidance.
2. **Quick save-note with dictation** — Add the fast stop-session form (with a mic button on each prose field) that saves a timestamped note and bumps the game's `lastPlayed`.
3. **Recap card & timeline** — Build the cinematic "Previously, in…" card with a "days since" line and a composed narrative paragraph, plus the collapsible history of older notes.
4. **Home screen** — Show recent recap cards, the prominent "What should I play?" button, the "+ Add game" button, and a first-run onboarding state when no games exist.
5. **Tonight picker** — Build the time and mood selector and the weighted suggestion (time/mood fit × staleness, excluding finished and abandoned games), with a reason string and Reroll, remembering the last choices.
6. **Backlog honesty & settings** — Build the days-since-played view, which prompts "Going back, or letting go?" past `staleDays` with one-tap Playing/Abandoned, and wire up `settings.json`.