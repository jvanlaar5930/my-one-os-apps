export function runRampageLevel(game) {
  // Request: The ball seems to always be moving, give it some weight so it slows down, also I'd like to be able to jump. Give me a little animation when jumping
  // ===== Rampage Level =====
  var _unsub = function() {}; _unsub();
  var _unsubJump = function() {}; _unsubJump();
  
  // ---------- Config ----------
  var GROUND_SIZE = 60;
  var PLAYER_RADIUS = 0.6;
  var BASE_MAX_SPEED = 9;
  var ACCEL = 11;                // slightly slower to build up speed — feels heavier
  var FRICTION_DIRT = 0.62;      // per-second multiplicative decay (lower = slows down faster)
  var FRICTION_GRAVEL = 0.4;
  var FRICTION_RAMP = 0.97;      // ramps keep momentum going downhill
  var RAMP_BOOST = 10;           // extra accel while in ramp zone (downhill dir)
  var TIMER_START = 75;
  var HEALTH_START = 100;
  var HIT_COOLDOWN = 0.6;
  var COMBO_WINDOW = 3.0;
  var STOP_RESET_TIME = 1.6;
  var GROWTH_THRESHOLD = 8;
  var GROWTH_STAGES = [1.0, 1.35, 1.7, 2.1];
  var JUMP_FORCE = 8.5;
  var GRAVITY = -24;
  
  function rand(a, b) { return a + Math.random() * (b - a); }
  
  // ---------- Ground ----------
  if (!game.scene.getEntity('ground')) {
    game.scene.addEntity({
      name: 'ground', shape: 'plane', dims: [GROUND_SIZE, GROUND_SIZE],
      color: '#5a7a3a', position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0],
    });
    game.scene.setTexture('ground', 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/aerial_grass_rock/aerial_grass_rock_diff_1k.jpg', { repeat: [10, 10] });
    game.scene.setMaterial('ground', { roughness: 0.95 });
  }
  
  // Gravel zone (rough patch that slows player)
  var GRAVEL = { xMin: -26, xMax: -10, zMin: -26, zMax: -10 };
  if (!game.scene.getEntity('gravelZone')) {
    var gw = GRAVEL.xMax - GRAVEL.xMin, gd = GRAVEL.zMax - GRAVEL.zMin;
    game.scene.addEntity({
      name: 'gravelZone', shape: 'plane', dims: [gw, gd], color: '#8a8578',
      position: [(GRAVEL.xMin + GRAVEL.xMax) / 2, 0.02, (GRAVEL.zMin + GRAVEL.zMax) / 2],
      rotation: [-Math.PI / 2, 0, 0],
    });
    game.scene.setTexture('gravelZone', 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/aerial_ground_rock/aerial_ground_rock_diff_1k.jpg', { repeat: [4, 4] });
    game.scene.setMaterial('gravelZone', { roughness: 1.0 });
  }
  
  // Ramp zones: bounding box + downhill boost direction
  // Textured with real CC0 asphalt scans (Poly Haven) so ramps read as paved surfaces.
  var RAMP_TEXTURES = [
    'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/asphalt_02/asphalt_02_diff_1k.jpg',
    'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/asphalt_04/asphalt_04_diff_1k.jpg',
    'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/asphalt_07/asphalt_07_diff_1k.jpg',
  ];
  var RAMPS = [
    { xMin: 10, xMax: 20, zMin: -22, zMax: -10, dir: [0, 0, -1], pos: [15, 0.3, -16], dims: [10, 0.6, 12], rot: [-0.28, 0, 0] },
    { xMin: -22, xMax: -10, zMin: 10, zMax: 20, dir: [0, 0, 1], pos: [-16, 0.3, 15], dims: [12, 0.6, 10], rot: [0.28, 0, 0] },
    { xMin: 14, xMax: 26, zMin: 6, zMax: 16, dir: [1, 0, 0], pos: [20, 0.3, 11], dims: [12, 0.6, 10], rot: [0, 0, -0.28] },
  ];
  RAMPS.forEach(function(r, i) {
    var name = 'ramp_' + i;
    if (!game.scene.getEntity(name)) {
      game.scene.addEntity({ name: name, shape: 'box', dims: r.dims, color: '#3a3a3a', position: r.pos, rotation: r.rot });
    }
    game.scene.setTexture(name, RAMP_TEXTURES[i % RAMP_TEXTURES.length], { repeat: [3, 3] });
    game.scene.setMaterial(name, { roughness: 0.9 });
  });
  
  // Lighting
  if (!game.scene.getEntity('__ambientLight')) {
    game.scene.addLight('ambient', { color: '#dfe8ff', intensity: 0.55 });
    game.scene.addLight('directional', { color: '#fff2d0', intensity: 0.9, position: [10, 18, 8] });
  }
  game.scene.setBackground('#9fd0f0');
  
  // ---------- Player ----------
  if (!game.scene.getEntity('player')) {
    game.scene.addEntity({
      name: 'player', shape: 'sphere', dims: [PLAYER_RADIUS], color: '#c19a6b',
      position: [0, PLAYER_RADIUS, 2], tags: ['player'], scale: [1, 1, 1],
    });
    game.scene.setMaterial('player', { roughness: 0.85, metalness: 0.05 });
  }
  
  // ---------- Destructibles ----------
  var DEST_TYPES = [
    { type: 'crate', count: 8, points: 10, tier: 1, radius: 0.55, color: '#c9a066', shape: 'box', dims: [0.9, 0.9, 0.9] },
    { type: 'cone', count: 8, points: 15, tier: 1, radius: 0.45, color: '#ff7a1a', shape: 'cylinder', dims: [0.4, 0.9, 0.4] },
    { type: 'rock', count: 8, points: 8, tier: 1, radius: 0.5, color: '#8a8a8a', shape: 'sphere', dims: [0.5] },
    { type: 'cart', count: 5, points: 35, tier: 2, radius: 0.9, color: '#c0392b', shape: 'box', dims: [1.6, 1.4, 1.0] },
    { type: 'mailbox', count: 5, points: 45, tier: 2, radius: 0.55, color: '#2255aa', shape: 'box', dims: [0.6, 0.7, 0.6] },
  ];
  
  var destructibles = [];
  var destructiblesReady = window.__rampageDestructibles;
  var TOTAL_DESTRUCTIBLES = 0;
  if (!destructiblesReady) {
    var idCounter = 0;
    DEST_TYPES.forEach(function(def) {
      TOTAL_DESTRUCTIBLES += def.count;
      for (var i = 0; i < def.count; i++) {
        var x, z, tries = 0;
        do {
          x = rand(-27, 27); z = rand(-27, 27); tries++;
        } while ((Math.abs(x) < 4 && Math.abs(z - 2) < 5) && tries < 20);
        var name = 'dest_' + def.type + '_' + (idCounter++);
        var pos = def.type === 'mailbox' ? [x, def.dims[1] / 2 + 0.5, z] : [x, def.dims[1] ? def.dims[1] / 2 : def.radius, z];
        game.scene.addEntity({ name: name, shape: def.shape, dims: def.dims, color: def.color, position: pos, tags: ['destructible'] });
        if (def.type === 'mailbox') {
          var postName = name + '_post';
          game.scene.addEntity({ name: postName, shape: 'cylinder', dims: [0.06, 0.8, 0.06], color: '#555555', position: [x, 0.4, z] });
        }
        destructibles.push({ id: name, post: def.type === 'mailbox' ? name + '_post' : null, type: def.type, points: def.points, tier: def.tier, pos: pos, radius: def.radius, color: def.color });
      }
    });
  } else {
    destructibles = window.__rampageDestructibles.filter(function(d) { return game.scene.getEntity(d.id); });
    TOTAL_DESTRUCTIBLES = window.__rampageTotalDestructibles || destructibles.length;
  }
  window.__rampageDestructibles = destructibles;
  window.__rampageTotalDestructibles = TOTAL_DESTRUCTIBLES;
  
  // ---------- Obstacles (immovable) ----------
  var OBST_TYPES = [
    { type: 'tree', count: 6, radius: 1.0 },
    { type: 'boulder', count: 6, radius: 1.4 },
  ];
  var obstacles = window.__rampageObstacles;
  if (!obstacles) {
    obstacles = [];
    var oid = 0;
    OBST_TYPES.forEach(function(def) {
      for (var i = 0; i < def.count; i++) {
        var x, z, tries = 0;
        do { x = rand(-27, 27); z = rand(-27, 27); tries++; } while (Math.abs(x) < 5 && Math.abs(z - 2) < 6 && tries < 20);
        var name = 'obst_' + def.type + '_' + (oid++);
        if (def.type === 'tree') {
          game.scene.addEntity({ name: name + '_trunk', shape: 'cylinder', dims: [0.3, 2.4, 0.3], color: '#5a3d1f', position: [x, 1.2, z], tags: ['obstacle'] });
          game.scene.addEntity({ name: name + '_canopy', shape: 'sphere', dims: [1.3], color: '#1f5c2a', position: [x, 3.0, z] });
        } else {
          game.scene.addEntity({ name: name, shape: 'sphere', dims: [def.radius], color: '#777d80', position: [x, def.radius, z], tags: ['obstacle'] });
        }
        obstacles.push({ id: name, type: def.type, pos: [x, def.radius, z], radius: def.radius });
      }
    });
    window.__rampageObstacles = obstacles;
  }
  
  // ---------- Real CC0 material pass ----------
  var DEST_DIFF = {
    crate: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/black_painted_planks/black_painted_planks_diff_1k.jpg',
    mailbox: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/blue_plaster_weathered/blue_plaster_weathered_diff_1k.jpg',
    rock: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/anti_slip_concrete/anti_slip_concrete_diff_1k.jpg',
  };
  var DEST_NORM = {
    crate: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/black_painted_planks/black_painted_planks_nor_gl_1k.jpg',
    mailbox: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/blue_plaster_weathered/blue_plaster_weathered_nor_gl_1k.jpg',
    rock: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/anti_slip_concrete/anti_slip_concrete_nor_gl_1k.jpg',
  };
  var DEST_ROUGH = { crate: 0.75, mailbox: 0.55, rock: 1.0 };
  
  destructibles.forEach(function(d) {
    var diff = DEST_DIFF[d.type];
    if (diff && game.scene.getEntity(d.id)) {
      game.scene.setTexture(d.id, diff, { repeat: [1, 1] });
      if (DEST_NORM[d.type]) game.scene.setNormalMap(d.id, DEST_NORM[d.type]);
      game.scene.setMaterial(d.id, { roughness: DEST_ROUGH[d.type] || 0.85 });
    }
    if (d.type === 'mailbox' && d.post && game.scene.getEntity(d.post)) {
      game.scene.setTexture(d.post, 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/black_painted_planks/black_painted_planks_diff_1k.jpg');
      game.scene.setMaterial(d.post, { roughness: 0.6, metalness: 0.2 });
    }
  });
  
  obstacles.forEach(function(o) {
    if (o.type === 'boulder' && game.scene.getEntity(o.id)) {
      game.scene.setTexture(o.id, 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/anti_slip_concrete/anti_slip_concrete_diff_1k.jpg', { repeat: [2, 2] });
      game.scene.setNormalMap(o.id, 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/anti_slip_concrete/anti_slip_concrete_nor_gl_1k.jpg');
      game.scene.setMaterial(o.id, { roughness: 1.0 });
    }
  });
  
  // ---------- State ----------
  var score = 0;
  var combo = 1;
  var comboTimer = 0;
  var stopTimer = 0;
  var timeLeft = TIMER_START;
  var health = HEALTH_START;
  var vx = 0, vz = 0;
  var px = 0, py = PLAYER_RADIUS, pz = 2;
  var vy = 0, onGround = true;
  var rotX = 0, rotZ = 0;
  var growthStage = 0;
  var smashCount = 0;
  var hitCooldown = 0;
  var pulseTimer = 0;
  var shakeTimer = 0, shakeMag = 0;
  var gameEnded = false;
  var particles = [];
  var popupText = '', popupTimer = 0, popupColor = '#ffd54a';
  var bounceMsgTimer = 0;
  var introTimer = 5.0;
  
  // Fixed camera offset — camera stays SOUTH of the player looking north, so
  // on-screen "forward" always matches the same world direction (no spin/wonk).
  var CAM_OFFSET = [0, 6, 11];
  
  function scaleForStage() { return GROWTH_STAGES[Math.min(growthStage, GROWTH_STAGES.length - 1)]; }
  function maxSpeedForStage() { return BASE_MAX_SPEED + growthStage * 1.5; }
  
  function spawnDebris(x, y, z, color, count) {
    for (var i = 0; i < (count || 6); i++) {
      var name = 'chip_' + Date.now() + '_' + i + '_' + Math.floor(Math.random() * 1000);
      game.scene.addEntity({ name: name, shape: 'box', dims: [0.18, 0.18, 0.18], color: color, position: [x, y, z] });
      particles.push({
        id: name,
        vx: (Math.random() - 0.5) * 6, vy: 2.5 + Math.random() * 3.5, vz: (Math.random() - 0.5) * 6,
        life: 0.5 + Math.random() * 0.4, age: 0,
      });
    }
  }
  
  function screenShake(mag, dur) { shakeMag = Math.max(shakeMag, mag); shakeTimer = Math.max(shakeTimer, dur); }
  
  function playSmashSound() {
    try { game.audio.play('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=', { volume: 0.7 }); } catch (e) {}
  }
  
  function playJumpSound() {
    try { game.audio.play('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=', { volume: 0.35 }); } catch (e) {}
  }
  
  var stopRumble = null;
  function updateRumble(speed) {
    if (speed > 1.0 && !stopRumble) {
      try { stopRumble = game.audio.play('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=', { loop: true, volume: 0.15 }); } catch (e) {}
    } else if (speed <= 1.0 && stopRumble) {
      stopRumble(); stopRumble = null;
    }
  }
  
  function endGame() {
    if (gameEnded) return;
    gameEnded = true;
    if (stopRumble) { stopRumble(); stopRumble = null; }
    try { game.audio.stopAll(); } catch (e) {}
    var prevBest = 0;
    try { prevBest = parseInt(localStorage.getItem('rampage_high_score') || '0', 10) || 0; } catch (e) {}
    window.__rampageResult = { score: score, prevBest: prevBest };
    window.__rampageDestructibles = null;
    window.__rampageObstacles = null;
    window.__rampageTotalDestructibles = null;
    _unsub();
    _unsubJump();
    game.gotoScene('Results');
  }
  
  // ---------- Input state ----------
  function keyDown(k) { return game.input.isDown(k); }
  
  // Jump — Space, only when grounded
  _unsubJump = game.input.onKey(' ', function(ev) {
    if (ev !== 'press' || gameEnded) return;
    if (onGround) {
      vy = JUMP_FORCE;
      onGround = false;
      pulseTimer = 0.15; // quick squash-down as it launches
      playJumpSound();
    }
  });
  
  // ---------- Main loop ----------
  _unsub = game.onUpdate(function(dt) {
    if (gameEnded) return;
    var s = dt / 1000;
  
    // Timer
    timeLeft -= s;
    if (timeLeft <= 0) { timeLeft = 0; endGame(); return; }
  
    if (introTimer > 0) introTimer -= s;
  
    // Input -> acceleration.
    // Fixed world-space axes matched to a NON-ROTATING camera below, so
    // W/Up always moves the same screen direction (away from camera) — no more spin-out.
    var ax = 0, az = 0;
    if (keyDown('a') || keyDown('ArrowLeft')) ax -= 1;
    if (keyDown('d') || keyDown('ArrowRight')) ax += 1;
    if (keyDown('w') || keyDown('ArrowUp')) az -= 1;
    if (keyDown('s') || keyDown('ArrowDown')) az += 1;
    var alen = Math.sqrt(ax * ax + az * az);
    if (alen > 0) { ax /= alen; az /= alen; vx += ax * ACCEL * s; vz += az * ACCEL * s; }
  
    // Zone detection
    var inGravel = px >= GRAVEL.xMin && px <= GRAVEL.xMax && pz >= GRAVEL.zMin && pz <= GRAVEL.zMax;
    var inRamp = null;
    for (var ri = 0; ri < RAMPS.length; ri++) {
      var r = RAMPS[ri];
      if (px >= r.xMin && px <= r.xMax && pz >= r.zMin && pz <= r.zMax) { inRamp = r; break; }
    }
  
    var frictionFactor = FRICTION_DIRT;
    if (inGravel) frictionFactor = FRICTION_GRAVEL;
    else if (inRamp) frictionFactor = FRICTION_RAMP;
  
    if (inRamp) { vx += inRamp.dir[0] * RAMP_BOOST * s; vz += inRamp.dir[2] * RAMP_BOOST * s; }
  
    // Apply friction decay (per-second factor) — this is the "weight": with no
    // input held, momentum bleeds off noticeably instead of coasting forever.
    var decay = Math.pow(frictionFactor, s);
    vx *= decay; vz *= decay;
    if (Math.abs(vx) < 0.02) vx = 0;
    if (Math.abs(vz) < 0.02) vz = 0;
  
    // Clamp speed
    var speed = Math.sqrt(vx * vx + vz * vz);
    var maxSp = maxSpeedForStage();
    if (speed > maxSp) { var sc = maxSp / speed; vx *= sc; vz *= sc; speed = maxSp; }
  
    // Combo timing
    if (comboTimer > 0) { comboTimer -= s; if (comboTimer <= 0) combo = 1; }
    if (speed < 0.25) { stopTimer += s; if (stopTimer > STOP_RESET_TIME) { combo = 1; comboTimer = 0; } }
    else stopTimer = 0;
  
    // Move player (horizontal)
    px += vx * s; pz += vz * s;
    var half = GROUND_SIZE / 2 - PLAYER_RADIUS;
    if (px > half) { px = half; vx *= -0.3; }
    if (px < -half) { px = -half; vx *= -0.3; }
    if (pz > half) { pz = half; vz *= -0.3; }
    if (pz < -half) { pz = -half; vz *= -0.3; }
  
    // Vertical physics — gravity + jump
    var wasAirborne = !onGround;
    vy += GRAVITY * s;
    py += vy * s;
    if (py <= PLAYER_RADIUS) {
      if (wasAirborne) {
        // just landed — squash on impact
        pulseTimer = 0.2;
        screenShake(0.06, 130);
      }
      py = PLAYER_RADIUS;
      vy = 0;
      onGround = true;
    } else {
      onGround = false;
    }
  
    // Rolling rotation
    rotX += vz * s * 1.2;
    rotZ -= vx * s * 1.2;
  
    // Growth-based & pulse scale
    var baseScale = scaleForStage();
    var pulseMult = 1;
    if (pulseTimer > 0) {
      pulseTimer -= s;
      var t = Math.max(0, pulseTimer / 0.18);
      pulseMult = 1 + t * 0.35;
    }
    // Jump stretch: elongate while rising, compress slightly while falling
    var jumpStretch = 0;
    if (!onGround) {
      var vyNorm = Math.max(-1, Math.min(1, vy / JUMP_FORCE));
      jumpStretch = vyNorm * 0.28;
    }
    var sx = baseScale * pulseMult * (1 - jumpStretch * 0.5);
    var sy = baseScale * (2 - pulseMult) * (1 + jumpStretch);
    var sz = baseScale * pulseMult * (1 - jumpStretch * 0.5);
  
    game.scene.setPosition('player', [px, py, pz]);
    game.scene.setRotation('player', [rotX, 0, rotZ]);
    game.scene.setScale('player', [sx, sy, sz]);
  
    updateRumble(speed);
  
    // hit cooldown
    if (hitCooldown > 0) hitCooldown -= s;
    if (popupTimer > 0) popupTimer -= s;
    if (bounceMsgTimer > 0) bounceMsgTimer -= s;
  
    // Destructible collisions
    for (var di = destructibles.length - 1; di >= 0; di--) {
      var d = destructibles[di];
      var dx = px - d.pos[0], dz = pz - d.pos[2];
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < d.radius + PLAYER_RADIUS + 0.15) {
        if (d.tier === 2 && growthStage < 1) {
          // too small — bounce off, no break
          var nlen = dist || 1;
          var nx = dx / nlen, nz = dz / nlen;
          vx = nx * 4; vz = nz * 4;
          px += nx * 0.3; pz += nz * 0.3;
          pulseTimer = 0.18;
          screenShake(0.08, 150);
          bounceMsgTimer = 1.4;
        } else {
          // break it
          var pts = Math.round(d.points * (0.5 + Math.min(speed, maxSp) / maxSp) * combo);
          score += pts;
          combo += 1;
          comboTimer = COMBO_WINDOW;
          smashCount += 1;
          popupText = '+' + pts + (combo > 1 ? '  x' + combo : '');
          popupColor = combo > 3 ? '#ff6666' : '#ffd54a';
          popupTimer = 0.9;
          if (smashCount % GROWTH_THRESHOLD === 0 && growthStage < GROWTH_STAGES.length - 1) {
            growthStage += 1;
            popupText = 'GREW BIGGER!  +' + pts;
            popupColor = '#66ff99';
            popupTimer = 1.3;
          }
          pulseTimer = 0.18;
          screenShake(0.12 + Math.min(speed / maxSp, 1) * 0.15, 220);
          playSmashSound();
          spawnDebris(d.pos[0], d.pos[1], d.pos[2], d.color, 6);
          game.scene.removeEntity(d.id);
          if (d.post) game.scene.removeEntity(d.post);
          destructibles.splice(di, 1);
        }
      }
    }
  
    // Obstacle collisions (trees/boulders)
    if (hitCooldown <= 0) {
      for (var oi = 0; oi < obstacles.length; oi++) {
        var o = obstacles[oi];
        var odx = px - o.pos[0], odz = pz - o.pos[2];
        var odist = Math.sqrt(odx * odx + odz * odz);
        if (odist < o.radius + PLAYER_RADIUS + 0.1) {
          health -= 20;
          hitCooldown = HIT_COOLDOWN;
          var onlen = odist || 1;
          var onx = odx / onlen, onz = odz / onlen;
          vx = onx * 6; vz = onz * 6;
          px += onx * 0.6; pz += onz * 0.6;
          pulseTimer = 0.2;
          screenShake(0.35, 400);
          combo = 1; comboTimer = 0;
          popupText = 'OUCH! -20 HP';
          popupColor = '#ff4444';
          popupTimer = 1.0;
          if (health <= 0) { health = 0; endGame(); return; }
          break;
        }
      }
    }
  
    // Debris particles
    particles = particles.filter(function(p) {
      p.age += s;
      if (p.age >= p.life) { game.scene.removeEntity(p.id); return false; }
      var e = game.scene.getEntity(p.id);
      if (!e) return false;
      p.vy -= 9.8 * s;
      game.scene.setPosition(p.id, [e.position[0] + p.vx * s, e.position[1] + p.vy * s, e.position[2] + p.vz * s]);
      var fade = Math.max(0.05, 1 - p.age / p.life);
      game.scene.setScale(p.id, [fade, fade, fade]);
      return true;
    });
  
    // Camera — FIXED world-space offset (does not rotate with velocity/heading).
    // This makes controls predictable: pressing the same key always moves the
    // same screen direction, instead of the old heading-based cam that spun
    // around and made "forward" keep changing.
    var camX = px + CAM_OFFSET[0], camY = py + CAM_OFFSET[1], camZ = pz + CAM_OFFSET[2];
    if (shakeTimer > 0) {
      shakeTimer -= dt;
      var decayS = Math.max(0, shakeTimer / 400);
      camX += (Math.random() - 0.5) * shakeMag * decayS;
      camY += (Math.random() - 0.5) * shakeMag * decayS;
    } else { shakeMag = 0; }
    game.camera.setPosition(camX, camY, camZ);
    game.camera.lookAt(px, py, pz);
  
    // HUD
    game.hud.clear();
    game.hud.text('Score: ' + score, 16, 16, { color: '#fff', size: 24 });
    game.hud.text('Combo x' + combo, 16, 46, { color: '#ffd54a', size: 18 });
    game.hud.text('Smashed: ' + smashCount + ' / ' + TOTAL_DESTRUCTIBLES, 16, 70, { color: '#aad', size: 14 });
    game.hud.text('Size: ' + (growthStage + 1) + '/' + GROWTH_STAGES.length, 16, 90, { color: '#aad', size: 14 });
    game.hud.text('Time: ' + Math.ceil(timeLeft) + 's', game.hud.width / 2, 16, { color: '#fff', size: 22, align: 'center' });
  
    var barW = 200, barX = game.hud.width - barW - 16, barY = 16;
    game.hud.rect(barX, barY, barW, 18, { fill: '#333', stroke: '#666' });
    var hpPct = Math.max(0, health / HEALTH_START);
    var hpColor = hpPct > 0.5 ? '#44dd44' : hpPct > 0.25 ? '#dddd44' : '#dd4444';
    game.hud.rect(barX, barY, Math.round(barW * hpPct), 18, { fill: hpColor });
    game.hud.text('HP', barX, barY + 24, { color: '#fff', size: 14 });
  
    if (health <= 30) {
      game.hud.rect(0, 0, game.hud.width, game.hud.height, { fill: 'rgba(200,30,30,' + (0.12 * (1 - hpPct)) + ')' });
    }
  
    // Score/hit popup feedback
    if (popupTimer > 0) {
      game.hud.text(popupText, game.hud.width / 2, 60, { color: popupColor, size: 26, align: 'center' });
    }
    if (bounceMsgTimer > 0) {
      game.hud.text('Too small to smash that — keep growing!', game.hud.width / 2, 96, { color: '#ffaa55', size: 16, align: 'center' });
    }
  
    // Goal / how-to-play banner for the first few seconds
    if (introTimer > 0) {
      game.hud.rect(game.hud.width / 2 - 320, game.hud.height - 96, 640, 66, { fill: 'rgba(0,0,0,0.5)' });
      game.hud.text('GOAL: Roll into crates, cones, carts, mailboxes & rocks to SMASH them for points!', game.hud.width / 2, game.hud.height - 78, { color: '#fff', size: 15, align: 'center' });
      game.hud.text('WASD/Arrows to roll • SPACE to jump • Avoid trees & boulders • Grow bigger to smash tougher stuff', game.hud.width / 2, game.hud.height - 54, { color: '#ffd54a', size: 14, align: 'center' });
    }
  });
}
