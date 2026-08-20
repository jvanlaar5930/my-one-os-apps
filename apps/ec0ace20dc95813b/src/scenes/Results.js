export function runResults(game) {
  // Request: Build the **Results** scene now. Use the Approved Plan above for all context — do not ask questions. Scene goal: - HUD display of the final Score in large text, with "New Best!" text shown if it beats the previously saved high score (and the saved high score is updated) - HUD display of the previous best score for comparison - The player's animal (at whatever size it grew to) sits idle in view, slowly spinning, echoing the Main Menu preview - HUD prompt "Press SPACE or Click to Roll Again" - HUD prompt "Press ESC to return to Main Menu" - Transition: Space key press or click on retry prompt → game.gotoScene('Rampage Level') - Transition: Escape key press → game.gotoScene('Main Menu')
  // ── Results Scene ─────────────────────────────────────────────────────────────
  
  // Shared cross-scene state (Phaser/OneOS registry doesn't survive scene swaps)
  var shared = window.__gameShared = window.__gameShared || { score: 0, highScore: 0, playerScale: 1 };
  
  // Safe persistence
  function saveHighScore(v) {
    try { localStorage.setItem('rampage_roller_highscore', JSON.stringify(v)); } catch (e) {}
  }
  function loadHighScore() {
    try {
      var v = JSON.parse(localStorage.getItem('rampage_roller_highscore') || 'null');
      return typeof v === 'number' ? v : 0;
    } catch (e) { return 0; }
  }
  
  var savedBest = loadHighScore();
  if (shared.highScore < savedBest) shared.highScore = savedBest;
  
  var finalScore = shared.score || 0;
  var previousBest = shared.highScore || 0;
  var isNewBest = finalScore > previousBest;
  if (isNewBest) {
    shared.highScore = finalScore;
    saveHighScore(finalScore);
  }
  
  // ── Scene setup ────────────────────────────────────────────────────────────────
  game.scene.setBackground('#2a2f1a');
  
  if (!game.scene.getEntity('resultsGround')) {
    game.scene.addEntity({
      name: 'resultsGround',
      shape: 'plane',
      dims: [30, 30],
      color: '#4a7c39',
      position: [0, 0, 0],
      rotation: [-Math.PI / 2, 0, 0],
    });
    game.scene.setTexture('resultsGround', 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/aerial_beach_02/aerial_beach_02_diff_1k.jpg', { repeat: [4, 4] });
  }
  
  game.scene.addLight('ambient', { color: '#c8d8ff', intensity: 0.55 });
  game.scene.addLight('directional', { color: '#fff4d0', intensity: 0.85, position: [6, 12, 5] });
  
  // Player animal — echo whatever size it grew to in the level (fallback small)
  var playerScale = shared.playerScale && shared.playerScale > 0 ? shared.playerScale : 1;
  if (!game.scene.getEntity('player')) {
    game.scene.addEntity({
      name: 'player',
      shape: 'sphere',
      dims: [0.6],
      color: '#c8a06a',
      position: [0, 0.6 * playerScale, 0],
      scale: [playerScale, playerScale, playerScale],
      tags: ['player'],
    });
    game.scene.setMaterial('player', { roughness: 0.85, metalness: 0.0 });
  } else {
    game.scene.setPosition('player', [0, 0.6 * playerScale, 0]);
  }
  
  game.camera.setPosition(0, 2.4 * playerScale + 1.5, 4.5 * playerScale + 2);
  game.camera.lookAt(0, 0.6 * playerScale, 0);
  
  // ── Idle spin ──────────────────────────────────────────────────────────────────
  var _unsubSpin = function() {}; _unsubSpin();
  _unsubSpin = game.onUpdate(function(dt) {
    var p = game.scene.getEntity('player');
    if (!p) return;
    game.scene.setRotation('player', [0.3, game.time.elapsed * 0.6, 0]);
  });
  
  // ── HUD ──────────────────────────────────────────────────────────────────────
  var _unsubHud = function() {}; _unsubHud();
  _unsubHud = game.onUpdate(function(dt) {
    game.hud.clear();
    var w = game.hud.width, h = game.hud.height;
  
    game.hud.rect(0, 0, w, h, { fill: 'rgba(0,0,0,0.25)' });
  
    game.hud.text('RESULTS', w / 2, 60, { color: '#ffdd66', size: 26, align: 'center', baseline: 'middle' });
  
    game.hud.text('Score: ' + finalScore, w / 2, h / 2 - 90, { color: '#ffffff', size: 52, align: 'center', baseline: 'middle' });
  
    if (isNewBest) {
      game.hud.text('New Best!', w / 2, h / 2 - 30, { color: '#44dd44', size: 30, align: 'center', baseline: 'middle' });
    }
  
    game.hud.text('Previous Best Smash Score: ' + previousBest, w / 2, h / 2 + 20, { color: '#cccccc', size: 20, align: 'center', baseline: 'middle' });
  
    game.hud.text('Press SPACE or Click to Roll Again', w / 2, h - 90, { color: '#ffffff', size: 20, align: 'center', baseline: 'middle' });
    game.hud.text('Press ESC to return to Main Menu', w / 2, h - 60, { color: '#aaaaaa', size: 16, align: 'center', baseline: 'middle' });
  });
  
  // ── Transitions ────────────────────────────────────────────────────────────────
  function retryGame() {
    // Reset run-specific shared state; keep highScore and let level manage its own score.
    shared.score = 0;
    game.gotoScene('Rampage Level');
  }
  
  function toMenu() {
    game.gotoScene('Main Menu');
  }
  
  var _unsubSpace = function() {}; _unsubSpace();
  _unsubSpace = game.input.onKey(' ', function(ev) {
    if (ev === 'press') retryGame();
  });
  
  var _unsubEsc = function() {}; _unsubEsc();
  _unsubEsc = game.input.onKey('Escape', function(ev) {
    if (ev === 'press') toMenu();
  });
  
  // Click-to-retry
  var _unsubClick = function() {}; _unsubClick();
  _unsubClick = game.input.onKey('Mouse0', function(ev) {
    if (ev !== 'press') return;
    retryGame();
  });
}
