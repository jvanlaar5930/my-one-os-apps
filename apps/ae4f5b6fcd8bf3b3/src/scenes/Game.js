export function runGame(game) {
  // Request: Game scene is throwing error: 2026-06-26T18:33:48.349Z ERROR [game] Cannot read properties of undefined (reading '2')
  // ECHO PATHS: Temporal Runner - Game Scene
  // Auto-runner with temporal mechanics, era shifts, and echo paths.
  
  if (!game.scene.getEntity('player')) {
    game.scene.addEntity({ name: 'player', shape: 'cylinder', dims: [0.4, 1.8, 0.4], color: '#00ccff', position: [0, 0.9, 0], tags: ['player'] });
    game.scene.addEntity({ name: 'player_glow', shape: 'sphere', dims: [0.6], color: '#00ffff', position: [0, 0.9, 0], tags: ['player'] });
    game.scene.setMaterial('player_glow', { opacity: 0.3, emissive: '#00ffff' });
    game.scene.setBackground('#0a0a1a');
    game.scene.addLight('ambient', { color: '#88aaff', intensity: 0.6 });
    game.scene.addLight('directional', { color: '#ffffff', intensity: 0.8, position: [5, 10, 5] });
  }
  
  // Background music loop
  var stopMusic = game.audio.play('https://cdn.pixabay.com/audio/2022/10/25/audio_104776671c.mp3', { loop: true, volume: 0.3 });
  
  game.camera.setPosition(0, 6, 10);
  game.camera.lookAt(0, 1, 0);
  
  // Game State
  var score = 0, distance = 0, era = 0, speed = 8, maxSpeed = 18;
  var timeScale = 1, phaseActive = false, phaseTimer = 0;
  var echoActive = false, echoTimer = 0, echoDuration = 15;
  var isPaused = false, gameOver = false;
  var velY = 0, onGround = true, isSliding = false, slideTimer = 0;
  var dodgeDir = 0, dodgeTimer = 0, dodgeCooldown = 0;
  var lastMilestone = 0, echoCooldown = 0;
  var groundZ = 0, obstacleZ = 0, echoZ = 0, orbZ = 0;
  var GRAVITY = -25, JUMP_FORCE = 10, GROUND_Y = 0;
  
  // Era Definitions
  var ERAS = [
    { name: 'Neon Metropolis', bg: '#0a0a1a', ground: '#1a1a2e', obsColor: '#ff0055', obsShape: 'box', density: 0.02 },
    { name: 'Crystal Geodes', bg: '#1a0a2e', ground: '#2e1a4e', obsColor: '#aa00ff', obsShape: 'sphere', density: 0.025 },
    { name: 'Floating Archipelago', bg: '#0a1a2e', ground: '#1a3a5e', obsColor: '#00ffaa', obsShape: 'cylinder', density: 0.03 },
    { name: 'The Void', bg: '#000000', ground: '#111111', obsColor: '#ffffff', obsShape: 'box', density: 0.035 }
  ];
  
  function spawnGround(z) {
    if (game.scene.getEntity('ground_' + Math.floor(z))) return;
    game.scene.addEntity({ name: 'ground_' + Math.floor(z), shape: 'plane', dims: [20, 10], color: ERAS[era].ground, position: [0, GROUND_Y - 0.1, z], rotation: [-Math.PI / 2, 0, 0], tags: ['ground'] });
  }
  function spawnObstacle(z) {
    var e = ERAS[era];
    var x = (Math.random() - 0.5) * 14;
    var y = e.obsShape === 'sphere' ? 0.5 : 0.5;
    var s = e.obsShape === 'box' ? [1.2, 1.2, 1.2] : e.obsShape === 'sphere' ? [0.6] : [0.6, 1.5, 0.6];
    game.scene.addEntity({ name: 'obs_' + z.toFixed(1), shape: e.obsShape, dims: s, color: e.obsColor, position: [x, y, z], tags: ['obstacle'] });
  }
  function spawnEcho(z) {
    game.scene.addEntity({ name: 'echo_' + z.toFixed(1), shape: 'box', dims: [1.5, 0.1, 1.5], color: '#00ffff', position: [0, 0.2, z], tags: ['echo'] });
    game.scene.setMaterial('echo_' + z.toFixed(1), { opacity: 0.8, emissive: '#00ffff' });
  }
  function spawnOrb(z) {
    game.scene.addEntity({ name: 'orb_' + z.toFixed(1), shape: 'sphere', dims: [0.4], color: '#ffcc00', position: [(Math.random()-0.5)*10, 1.5, z], tags: ['orb'] });
  }
  
  // Initial Ground & Obstacles
  for (var i = 0; i < 10; i++) spawnGround(i * 10);
  for (var i = 0; i < 5; i++) spawnObstacle(20 + i * 15);
  for (var i = 0; i < 3; i++) spawnOrb(30 + i * 20);
  
  var _unsub = function() {}; _unsub();
  _unsub = game.onUpdate(function(dt) {
    if (isPaused || gameOver) return;
    
    var s = dt / 1000;
    var p = game.scene.getEntity('player');
    if (!p) return;
  
    // Time Scale (Thread Pull)
    var targetTimeScale = game.input.isDown('Shift') ? 0.6 : 1;
    timeScale += (targetTimeScale - timeScale) * 5 * s;
    
    // Phase Shift
    if (phaseActive) {
      phaseTimer -= s;
      game.scene.setMaterial('player', { opacity: 0.4 });
      game.scene.setMaterial('player_glow', { opacity: 0.6 });
      if (phaseTimer <= 0) {
        phaseActive = false;
        game.scene.setMaterial('player', { opacity: 1 });
        game.scene.setMaterial('player_glow', { opacity: 0.3 });
      }
    }
  
    // Auto Forward
    var moveZ = speed * timeScale * s;
    distance += moveZ;
    game.scene.setPosition('player', [p.position[0], p.position[1], p.position[2] + moveZ]);
    game.scene.setPosition('player_glow', [p.position[0], p.position[1], p.position[2]]);
  
    // Dodge
    if (dodgeTimer > 0) {
      dodgeTimer -= s;
      p.position[0] += dodgeDir * 12 * s;
    } else if (dodgeCooldown > 0) {
      dodgeCooldown -= s;
    } else {
      if (game.input.isDown('a') || game.input.isDown('ArrowLeft'))  { dodgeDir = -1; dodgeTimer = 0.3; dodgeCooldown = 0.4; }
      if (game.input.isDown('d') || game.input.isDown('ArrowRight')) { dodgeDir = 1;  dodgeTimer = 0.3; dodgeCooldown = 0.4; }
    }
  
    // Jump & Gravity
    if ((game.input.isDown('w') || game.input.isDown('ArrowUp') || game.input.isDown(' ')) && onGround) {
      velY = JUMP_FORCE;
      onGround = false;
    }
    velY += GRAVITY * timeScale * s;
    p.position[1] += velY * s;
    if (p.position[1] <= GROUND_Y) { p.position[1] = GROUND_Y; velY = 0; onGround = true; }
  
    // Slide
    if (game.input.isDown('s') || game.input.isDown('ArrowDown')) {
      if (!isSliding) { isSliding = true; slideTimer = 0.5; game.scene.setScale('player', [1, 0.5, 1]); }
    }
    if (isSliding) {
      slideTimer -= s;
      if (slideTimer <= 0) { isSliding = false; game.scene.setScale('player', [1, 1, 1]); }
    }
  
    // Spawn Logic
    groundZ = Math.floor(p.position[2] / 10) * 10;
    if (groundZ > obstacleZ - 50) {
      spawnGround(groundZ + 10);
      obstacleZ = groundZ + 10;
      if (Math.random() < ERAS[era].density) spawnObstacle(obstacleZ + 15);
      if (Math.random() < 0.005) spawnOrb(obstacleZ + 20);
    }
    
    // Cleanup behind (fixed position access for getByTag)
    var grounds = game.scene.getByTag('ground');
    for (var i = 0; i < grounds.length; i++) {
      var g = grounds[i];
      var pos = game.scene.getEntity(g.id).position;
      if (pos[2] < p.position[2] - 30) game.scene.removeEntity(g.id);
    }
    
    var obs = game.scene.getByTag('obstacle');
    for (var i = 0; i < obs.length; i++) {
      var o = obs[i];
      var pos = game.scene.getEntity(o.id).position;
      if (pos[2] < p.position[2] - 30) game.scene.removeEntity(o.id);
    }
    
    var orbs = game.scene.getByTag('orb');
    for (var i = 0; i < orbs.length; i++) {
      var o = orbs[i];
      var pos = game.scene.getEntity(o.id).position;
      if (pos[2] < p.position[2] - 30) game.scene.removeEntity(o.id);
    }
  
    // Echo Path Logic
    echoCooldown -= s;
    if (echoCooldown <= 0 && !echoActive) {
      echoActive = true;
      echoTimer = echoDuration;
      echoCooldown = 25;
      for (var i = 0; i < 15; i++) spawnEcho(p.position[2] + 5 + i * 3);
    }
    if (echoActive) {
      echoTimer -= s;
      var echoes = game.scene.getByTag('echo');
      for (var i = echoes.length - 1; i >= 0; i--) {
        var e = echoes[i];
        var fade = Math.max(0, echoTimer / echoDuration);
        game.scene.setMaterial(e.name, { opacity: fade * 0.8 });
        if (echoTimer <= 0) game.scene.removeEntity(e.id);
      }
      if (echoTimer <= 0) echoActive = false;
    }
  
    // Collisions
    var hits = game.physics.findOverlapping('player', 'obstacle');
    if (hits.length > 0 && !phaseActive) {
      gameOver = true;
      game.audio.stopAll();
      game.hud.clear();
      game.hud.text('RUN TERMINATED', game.hud.width/2, game.hud.height/2 - 40, { color: '#ff4444', size: 32, align: 'center' });
      game.hud.text('Score: ' + Math.floor(score), game.hud.width/2, game.hud.height/2, { color: '#ffffff', size: 24, align: 'center' });
      game.hud.text('Press R to Restart', game.hud.width/2, game.hud.height/2 + 40, { color: '#aaaaaa', size: 18, align: 'center' });
    }
  
    var collectedOrbs = game.physics.findOverlapping('player', 'orb');
    for (var i = 0; i < collectedOrbs.length; i++) {
      game.scene.removeEntity(collectedOrbs[i]);
      score += 50;
      if (echoActive) { echoTimer = Math.min(echoTimer + 3, echoDuration); }
    }
  
    // Score & Era Shifts
    score += moveZ * 0.5;
    speed = Math.min(maxSpeed, 8 + distance * 0.001);
    var milestone = Math.floor(score / 500);
    if (milestone > lastMilestone && milestone < 4) {
      era = milestone;
      lastMilestone = milestone;
      game.scene.setBackground(ERAS[era].bg);
      game.hud.clear();
      game.hud.text('ERA SHIFT: ' + ERAS[era].name, game.hud.width/2, 60, { color: '#ffffff', size: 28, align: 'center' });
    }
  
    // HUD
    game.hud.clear();
    game.hud.text('SCORE: ' + Math.floor(score), 20, 20, { color: '#ffffff', size: 20 });
    game.hud.text('DIST: ' + Math.floor(distance) + 'm', 20, 48, { color: '#aaaaff', size: 16 });
    game.hud.text('ERA: ' + ERAS[era].name, 20, 72, { color: '#ffcc00', size: 16 });
    
    // Echo Bar
    var echoPct = echoActive ? echoTimer / echoDuration : 0;
    game.hud.rect(game.hud.width - 120, 20, 100, 12, { fill: '#222', stroke: '#555' });
    game.hud.rect(game.hud.width - 120, 20, Math.round(100 * echoPct), 12, { fill: '#00ffff' });
    game.hud.text('ECHO', game.hud.width - 110, 30, { color: '#fff', size: 10, align: 'center' });
  
    // Cooldowns
    var dodgePct = dodgeCooldown > 0 ? 1 - dodgeCooldown / 0.4 : 1;
    game.hud.rect(game.hud.width - 120, 50, 100, 12, { fill: '#222', stroke: '#555' });
    game.hud.rect(game.hud.width - 120, 50, Math.round(100 * dodgePct), 12, { fill: '#4488ff' });
    game.hud.text('DODGE', game.hud.width - 110, 60, { color: '#fff', size: 10, align: 'center' });
  
    var phasePct = phaseActive ? phaseTimer / 1.5 : 1;
    game.hud.rect(game.hud.width - 120, 80, 100, 12, { fill: '#222', stroke: '#555' });
    game.hud.rect(game.hud.width - 120, 80, Math.round(100 * phasePct), 12, { fill: '#aa00ff' });
    game.hud.text('PHASE', game.hud.width - 110, 90, { color: '#fff', size: 10, align: 'center' });
  
    // Pause Overlay
    if (isPaused) {
      game.hud.rect(0, 0, game.hud.width, game.hud.height, { fill: 'rgba(0,0,0,0.6)' });
      game.hud.text('PAUSED', game.hud.width/2, game.hud.height/2 - 20, { color: '#ffffff', size: 36, align: 'center' });
      game.hud.text('Press ESC to Resume', game.hud.width/2, game.hud.height/2 + 20, { color: '#aaaaaa', size: 18, align: 'center' });
    }
  });
  
  // Input Handlers
  var unsubPause = game.input.onKey('Escape', function(ev) {
    if (ev === 'press') isPaused = !isPaused;
  });
  
  var unsubPhase = game.input.onKey('z', function(ev) {
    if (ev === 'press' && !phaseActive) { phaseActive = true; phaseTimer = 1.5; }
  });
  
  var unsubRestart = game.input.onKey('r', function(ev) {
    if (ev === 'press' && gameOver) {
      game.gotoScene('Game');
    }
  });
}
