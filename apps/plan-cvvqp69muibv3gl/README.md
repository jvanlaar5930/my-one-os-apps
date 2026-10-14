# 🎮 Previously On…

Build "Previously On…", a save-state for your brain for video games. Joel plays a lot of games and loses track of where he was when he comes back after weeks away.

Core features:
1. Game backlog: add, edit and remove games with title, platform, status (playing, paused, backlog, finished, abandoned), rough length or type, and a mood tag (chill, sweaty, story). Track the last-played date automatically.
2. Quick save-note: a fast 'I'm stopping now' form that takes about 30 seconds. Fields are where I am, what I was about to do, things I'll forget (for example 'don't sell the weird amulet' or 'boss weak to fire'), and an optional level or progress. Each note is timestamped and kept as a history per game.
3. Recap card: opening a game shows a TV-style 'Previously, in <Game>…' card built from the latest save-note plus how long it has been since the last session. Give it a bold, cinematic, dark style with a big title and a short narrative paragraph. Show older notes below in a collapsible timeline.
4. 'What should I play tonight?' picker: the user enters available time (30 min, 1–2 hrs, a whole evening) and a mood (chill, sweaty, story). The picker suggests one game with a reason and a reroll button, and weights toward games that have been untouched for a long time but aren't abandoned.
5. Backlog honesty: a view that sorts games by days since last played. For anything over about 30 days it gently asks 'Going back, or letting go?' with buttons to set the game to playing or abandoned.

Persist everything locally so it survives reloads. The home screen shows the recently played games as recap cards, a prominent 'What should I play?' button, and a quick 'Add game' button. Use a dark, gamer-friendly UI with good empty states and sample-free first run guidance. Keep the code clean and syntactically valid, and make sure all hooks and functions it references actually exist.

## Documentation

- [Build plan](plan.md)
- [Change history](CHANGELOG.md)
- [App manifest](manifest.json)

Built with **one_OS**. Install this app from this repository using the one_OS App Store.
