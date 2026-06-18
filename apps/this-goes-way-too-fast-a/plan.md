- Roudy the Rancher is an endless platformer where you control a cowboy character jumping over obstacles while collecting coins to maximize your survival score.
- Features:
  - Endless scrolling platform gameplay with randomized obstacles
  - Three coin types (common=1 point, medium=5 points, rare=10 points) with increasing spawn rates as you progress
  - Cowboy character with basic jump and run animations
  - Real-time score calculation based on survival time and collected coins
  - Game over screen displaying final score, time survived, and coins collected
  - Progressive difficulty with faster scrolling as game duration increases
- Bridge & data:
  os.storage.save() and os.storage.load() for high score persistence
  os.window.resize() to set game window size
  os.notify() for game state notifications
- Layout: Single fullscreen game canvas with HUD overlay showing coins, time, and score in top-left corner