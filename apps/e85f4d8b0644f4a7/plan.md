A 2D side-scrolling endless runner where Randy the cowboy navigates a desert landscape to collect coins and avoid obstacles.
Features:
- Physics-based jumping and movement for Randy.
- Procedurally generated desert obstacles (cacti, rocks) and three tiers of coins (Large, Medium, Small).
- Dynamic difficulty scaling where game speed increases every 100 points.
- Score calculation based on the product of elapsed time and total coins collected.
- Start menu with control instructions and a post-game summary screen.
- High score persistence for the best score achieved.
Bridge & data: `os.storage` to persist high scores; `os.notify` for game-over notifications.
Layout: A single `<canvas>` element for the game world with HTML overlays for the menu and death summary.