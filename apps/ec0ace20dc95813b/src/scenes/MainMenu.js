export function runMainMenu(game) {
  // Request: Add visual polish and juice: screen shake on impacts, particle effects, smooth tweens, and satisfying feedback for key game events.
  // ---------- Static scene setup (idempotent) ----------
  if (!game.scene.getEntity('menu_platform')) {
    game.scene.addEntity({
      name: 'menu_platform', shape: 'cylinder', dims: [3, 0.5, 3],
      color: '#4a9c4a', position: [0, -0.25, 0],
    });
    game.scene.setTexture('menu_platform', 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/aerial_grass_rock/aerial_grass_rock_diff_1k.jpg', { repeat: [2, 2] });
    game.scene.setBackground('#1a1a2e');
    game.scene.addLight('ambient', { color: '#c8d8ff', intensity: 0.5 });
    game.scene.addLight('directional', { color: '#fff4d0', intensity: 0.9, position: [6, 10, 6] });
  }
  
  if (!game.scene.getEntity('preview_animal')) {
    game.scene.addEntity({
      name: 'preview_animal', shape: 'sphere', dims: [0.9],
      color: '#b5895a', position: [0, 0.9, 0], tags: ['preview'],
    });
    game.scene.setMaterial('preview_animal', { roughness: 0.8, metalness: 0.0 });
  }
  
  // Ambient sparkle pool around the platform (bounded, reused — no per-frame spawn/leak)
  var SPARKLE_COUNT = 10;
  for (var si = 0; si < SPARKLE_COUNT; si++) {
    var sName = 'menu_sparkle_' + si;
    if (!game.scene.getEntity(sName)) {
      var ang = (si / SPARKLE_COUNT) * Math.PI * 2;
      var rad = 1.8 + Math.random() * 0.8;
      game.scene.addEntity({
        name: sName, shape: 'sphere', dims: [0.06],
        color: '#ffe9a8', position: [Math.cos(ang) * rad, 0.4 + Math.random() * 0.6, Math.sin(ang) * rad],
        tags: ['menuSparkle'],
      });
      game.scene.setMaterial(sName, { emissive: '#ffcc55', roughness: 0.4 });
    }
  }
  
  game.camera.setPosition(0, 2.2, 5);
  game.camera.lookAt(0, 0.7, 0);
  
  var highScore = 0;
  try {
    var saved = JSON.parse(localStorage.getItem('oneos_game_progress') || 'null');
    if (saved) highScore = saved.score || 0;
  } catch (e) {}
  
  var started = false;
  var camBaseX = 0, camBaseY = 2.2, camBaseZ = 5;
  var shakeTimer = 0, shakeMag = 0;
  var flashAlpha = 0;
  var burstParticles = [];
  var punchTimer = 0; // preview animal scale-punch juice
  
  function screenShake(mag, durMs) {
    shakeMag = mag;
    shakeTimer = durMs;
  }
  
  function spawnBurst(x, y, z, color, count) {
    for (var i = 0; i < (count || 14); i++) {
      var id = 'menu_burst_' + Date.now() + '_' + i;
      game.scene.addEntity({
        name: id, shape: 'sphere', dims: [0.1],
        color: color || '#ffdd55', position: [x, y, z], tags: ['menuBurst'],
      });
      burstParticles.push({
        id: id,
        vx: (Math.random() - 0.5) * 5,
        vy: 2.5 + Math.random() * 3.5,
        vz: (Math.random() - 0.5) * 5,
        life: 0.5 + Math.random() * 0.35,
        age: 0,
      });
    }
  }
  
  // ---------- Main update loop ----------
  var _unsub = function() {}; _unsub();
  _unsub = game.onUpdate(function(dt) {
    var t = game.time.elapsed;
    var s = dt / 1000;
  
    // Preview animal: spin + gentle idle squash/stretch bob, plus punch juice on start
    var e = game.scene.getEntity('preview_animal');
    if (e) {
      game.scene.setRotation('preview_animal', [0, t * 0.8, 0]);
      var bob = Math.sin(t * 2.2) * 0.06;
      var baseScale = 1 + bob;
      if (punchTimer > 0) {
        punchTimer -= dt;
        var punchT = Math.max(0, punchTimer / 260);
        var punch = 1 + punchT * 0.5;
        game.scene.setScale('preview_animal', [baseScale * (2 - punch), baseScale * punch, baseScale * (2 - punch)]);
      } else {
        game.scene.setScale('preview_animal', [baseScale, baseScale, baseScale]);
      }
      game.scene.setPosition('preview_animal', [0, 0.9 + Math.max(0, bob) * 0.5, 0]);
    }
  
    // Ambient sparkles: float, drift, twinkle
    for (var si2 = 0; si2 < SPARKLE_COUNT; si2++) {
      var sName2 = 'menu_sparkle_' + si2;
      var sp = game.scene.getEntity(sName2);
      if (!sp) continue;
      var ang2 = (si2 / SPARKLE_COUNT) * Math.PI * 2 + t * 0.15;
      var rad2 = 1.8 + Math.sin(t * 0.6 + si2) * 0.3;
      var yy = 0.4 + Math.sin(t * 1.5 + si2 * 1.3) * 0.35;
      game.scene.setPosition(sName2, [Math.cos(ang2) * rad2, yy, Math.sin(ang2) * rad2]);
      var tw = 0.7 + Math.sin(t * 4 + si2 * 2) * 0.5;
      var sc = Math.max(0.15, tw);
      game.scene.setScale(sName2, [sc, sc, sc]);
    }
  
    // Burst particles (start-press juice)
    burstParticles = burstParticles.filter(function(p) {
      p.age += s;
      if (p.age >= p.life) { game.scene.removeEntity(p.id); return false; }
      var pe = game.scene.getEntity(p.id);
      if (!pe) return false;
      p.vy -= 9.8 * s;
      game.scene.setPosition(p.id, [pe.position[0] + p.vx * s, pe.position[1] + p.vy * s, pe.position[2] + p.vz * s]);
      var sc2 = Math.max(0, 1 - p.age / p.life);
      game.scene.setScale(p.id, [sc2, sc2, sc2]);
      return true;
    });
  
    // Camera screen shake
    if (shakeTimer > 0) {
      shakeTimer -= dt;
      var decay = Math.max(0, shakeTimer / 300);
      var ox = (Math.random() - 0.5) * shakeMag * decay;
      var oy = (Math.random() - 0.5) * shakeMag * decay;
      game.camera.setPosition(camBaseX + ox, camBaseY + oy, camBaseZ);
      game.camera.lookAt(0, 0.7, 0);
    } else {
      game.camera.setPosition(camBaseX, camBaseY, camBaseZ);
      game.camera.lookAt(0, 0.7, 0);
    }
  
    // ---------- HUD ----------
    game.hud.clear();
    var w = game.hud.width;
  
    var titlePulse = 44 + Math.sin(t * 2) * 2;
    game.hud.text('Rampage Roller', w / 2, 60, { color: '#ffffff', size: titlePulse, align: 'center' });
    game.hud.text('Roll. Smash. Score.', w / 2, 104, { color: '#cccccc', size: 18, align: 'center' });
    game.hud.text('Best Smash Score: ' + highScore, w / 2, 140, { color: '#ffdd44', size: 18, align: 'center' });
  
    var promptGlow = 0.65 + Math.abs(Math.sin(t * 3)) * 0.35;
    var promptColor = 'rgba(255,255,255,' + promptGlow.toFixed(2) + ')';
    game.hud.text('Press SPACE or Click to Start Rolling', w / 2, game.hud.height - 40, { color: promptColor, size: 20, align: 'center' });
  
    if (flashAlpha > 0) {
      game.hud.rect(0, 0, game.hud.width, game.hud.height, { fill: 'rgba(255,220,120,' + flashAlpha.toFixed(2) + ')' });
      flashAlpha = Math.max(0, flashAlpha - dt / 300);
    }
  });
  
  // ---------- Start transition with juice ----------
  function startGame() {
    if (started) return;
    started = true;
  
    // Juice: burst, punch, shake, flash — then transition
    var pe = game.scene.getEntity('preview_animal');
    var pos = pe ? pe.position : [0, 0.9, 0];
    spawnBurst(pos[0], pos[1], pos[2], '#ffcc44', 18);
    punchTimer = 260;
    screenShake(0.18, 260);
    flashAlpha = 0.5;
  
    setTimeout(function() {
      game.gotoScene('Rampage Level');
    }, 260);
  }
  
  var _unsubKey = function() {}; _unsubKey();
  _unsubKey = game.input.onKey(' ', function(ev) {
    if (ev === 'press') startGame();
  });
  
  var _unsubClick = function() {}; _unsubClick();
  _unsubClick = game.input.onKey('Mouse0', function(ev) {
    if (ev === 'press') startGame();
  });
}
