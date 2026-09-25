function runLevel2(game) {
  // Request: Build the **Level 2** scene now. Use the Approved Plan above for all context — do not ask questions. Scene goal: - "Rusty Caverns": a dim underground level with brown rock platforms, orange lava pits at the bottom, dripping stalactites, and flickering torch light particles. It uses the same Loki controls, the same HUD, and a counter "Gears: 0/7". - New mechanics: horizontally moving metal platforms driven by yoyo tweens, and crumbling rock ledges that fall 0.5 seconds after Loki lands on them. - Monsters: 3 Slimes plus 3 purple "Bat" monsters that swoop in a sine wave and dive toward Loki when he is within range. Bats can be stomped. Touching lava is an instant loss of all hearts. - Objective: collect 7 gears and a blue keycard that unlocks a steel exit door at the end of the cave. The door slides open with a clank sound once both are collected. - Transition: entering the open exit door → game.gotoScene('Level 3') - Transition: hearts reach 0, or Loki touches lava or falls off the map → game.gotoScene('Game Over')
  if (window.__phaserGame) { window.__phaserGame.destroy(true); window.__phaserGame = null; }
  
  const studio = game;
  
  const WORLD_W = 3600;
  const WORLD_H = 600;
  const GROUND_TOP = 500;
  const CEILING_H = 40;
  const MAX_HEARTS = 3;
  const GEARS_NEEDED = 7;
  const RUN_SPEED = 200;
  const JUMP_VELOCITY = -560;
  const COYOTE_MS = 90;
  const BAT_AGGRO = 220;
  const DOOR_X = 3540;
  
  const GROUND = [[0, 520], [720, 380], [1420, 420], [2140, 460], [2960, 640]];
  const LAVA_PITS = [[520, 720], [1100, 1420], [1840, 2140], [2600, 2960]];
  const LEDGES = [[260, 390, 170], [860, 380, 180], [1500, 360, 200], [1650, 240, 160], [2250, 370, 200], [2420, 260, 150], [3020, 380, 180], [3340, 170, 130]];
  const MOVERS = [[1180, 1360, 460], [2680, 2880, 450], [3100, 3260, 250]];
  const CRUMBLES = [[620, 452], [1920, 442], [2060, 412]];
  const GEAR_SPOTS = [[345, 352], [620, 402], [950, 342], [1270, 408], [1730, 202], [2495, 222], [2780, 398]];
  const KEYCARD_SPOT = [3405, 135];
  const SLIMES = [[745, 1075], [1440, 1820], [2990, 3440]];
  const BATS = [[880, 200, 130], [2000, 220, 110], [2760, 210, 140]];
  const TORCHES = [180, 1000, 1600, 2330, 3000, 3420];
  
  let hearts = MAX_HEARTS;
  let gearsCollected = 0;
  let hasKey = false;
  let doorOpen = false;
  let ended = false;
  let invulnUntil = 0;
  let knockUntil = 0;
  let lastGrounded = -9999;
  let wasOnGround = false;
  let airVy = 0;
  let stalTips = [];
  let player, cursors, keys, groundGroup, movers, crumbles, slimes, bats, gears, keycard, door, doorLamp, lava;
  
  function tone(freq, dur, type, vol, slideTo) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = window.__lokiAudioCtx || (window.__lokiAudioCtx = new Ctx());
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
      gain.gain.setValueAtTime(vol || 0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur + 0.02);
    } catch (e) {}
  }
  
  function makeTex(scene, key, w, h, draw) {
    if (scene.textures.exists(key)) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    draw(g);
    g.generateTexture(key, w, h);
    g.destroy();
  }
  
  function drawHeart(g, color) {
    g.fillStyle(color);
    g.fillCircle(6, 6, 5.5);
    g.fillCircle(16, 6, 5.5);
    g.fillTriangle(1, 8, 21, 8, 11, 19);
  }
  
  function makeTextures(scene) {
    makeTex(scene, 'rock', 64, 64, (g) => {
      g.fillStyle(0x5a3f2b); g.fillRect(0, 0, 64, 64);
      g.fillStyle(0x4a3322);
      [[10, 12, 9], [40, 8, 7], [52, 40, 10], [20, 44, 11], [34, 28, 6]].forEach((c) => g.fillCircle(c[0], c[1], c[2]));
      g.fillStyle(0x6e5038);
      [[28, 14, 3], [8, 34, 2], [46, 54, 3], [58, 20, 2], [30, 58, 2]].forEach((c) => g.fillCircle(c[0], c[1], c[2]));
      g.lineStyle(2, 0x3a2618, 0.6);
      g.lineBetween(0, 32, 20, 30); g.lineBetween(36, 46, 60, 50);
    });
    makeTex(scene, 'rockEdge', 64, 8, (g) => {
      g.fillStyle(0x8a6a48); g.fillRect(0, 0, 64, 5);
      g.fillStyle(0x6b4f35); g.fillRect(0, 5, 64, 3);
      g.fillStyle(0xa8845c); g.fillRect(6, 1, 10, 2); g.fillRect(34, 1, 14, 2);
    });
    makeTex(scene, 'metal', 128, 20, (g) => {
      g.fillStyle(0x8a939c); g.fillRect(0, 0, 128, 20);
      g.fillStyle(0xc7d0d8); g.fillRect(0, 0, 128, 3);
      g.fillStyle(0x5b6168); g.fillRect(0, 17, 128, 3);
      g.fillStyle(0x4a4f55);
      for (let x = 10; x < 128; x += 24) g.fillCircle(x, 10, 2.5);
      g.fillStyle(0xf2c230); g.fillRect(0, 3, 6, 14); g.fillRect(122, 3, 6, 14);
    });
    makeTex(scene, 'crumble', 96, 24, (g) => {
      g.fillStyle(0x6b4a33); g.fillRoundedRect(0, 0, 96, 24, 5);
      g.fillStyle(0x8a6a48); g.fillRect(2, 0, 92, 4);
      g.lineStyle(2, 0x3a2616);
      g.lineBetween(20, 4, 28, 14); g.lineBetween(28, 14, 24, 22);
      g.lineBetween(56, 4, 50, 12); g.lineBetween(50, 12, 60, 20);
      g.lineBetween(78, 6, 84, 18);
    });
    makeTex(scene, 'slime', 40, 30, (g) => {
      g.fillStyle(0x3fbf4a); g.fillEllipse(20, 20, 38, 20); g.fillCircle(20, 14, 12);
      g.fillStyle(0x7ee07f); g.fillCircle(14, 9, 3);
      g.fillStyle(0xffffff); g.fillCircle(15, 16, 4); g.fillCircle(26, 16, 4);
      g.fillStyle(0x10220f); g.fillCircle(16, 17, 2); g.fillCircle(27, 17, 2);
    });
    makeTex(scene, 'bat', 52, 30, (g) => {
      g.fillStyle(0x5e2391); g.fillTriangle(0, 6, 22, 12, 14, 26); g.fillTriangle(52, 6, 30, 12, 38, 26);
      g.fillStyle(0x8a3fc7); g.fillCircle(26, 15, 10);
      g.fillTriangle(18, 8, 21, 0, 24, 8); g.fillTriangle(28, 8, 31, 0, 34, 8);
      g.fillStyle(0xffe14a); g.fillCircle(22, 14, 2.5); g.fillCircle(30, 14, 2.5);
      g.fillStyle(0xffffff); g.fillTriangle(23, 21, 25, 21, 24, 25); g.fillTriangle(27, 21, 29, 21, 28, 25);
    });
    makeTex(scene, 'gear', 32, 32, (g) => {
      g.fillStyle(0xf5c542);
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        g.fillCircle(16 + Math.cos(a) * 12, 16 + Math.sin(a) * 12, 4);
      }
      g.fillCircle(16, 16, 11);
      g.fillStyle(0xc9961d); g.fillCircle(16, 16, 6);
      g.fillStyle(0x6b4a10); g.fillCircle(16, 16, 3);
      g.fillStyle(0xfff2b0); g.fillCircle(11, 11, 2);
    });
    makeTex(scene, 'keycard', 30, 22, (g) => {
      g.fillStyle(0x2f7cf6); g.fillRoundedRect(0, 0, 30, 22, 4);
      g.fillStyle(0x9fd0ff); g.fillRect(0, 5, 30, 4);
      g.fillStyle(0xffd24a); g.fillRect(4, 12, 8, 6);
      g.fillStyle(0xdcecff); g.fillRect(15, 13, 11, 2); g.fillRect(15, 17, 8, 2);
    });
    makeTex(scene, 'door', 64, 128, (g) => {
      g.fillStyle(0x6f7880); g.fillRect(0, 0, 64, 128);
      g.fillStyle(0x88929b); g.fillRect(4, 4, 56, 112);
      g.lineStyle(3, 0x4f575e); g.strokeRect(9, 9, 46, 48); g.strokeRect(9, 64, 46, 46);
      g.fillStyle(0x4f575e);
      for (let y = 20; y < 52; y += 10) g.fillRect(14, y, 36, 3);
      g.fillStyle(0x3e444a);
      [[8, 8], [56, 8], [8, 112], [56, 112]].forEach((p) => g.fillCircle(p[0], p[1], 2.5));
      g.fillStyle(0xf2c230); g.fillRect(0, 116, 64, 12);
      g.fillStyle(0x222222);
      for (let x = 0; x < 64; x += 16) g.fillRect(x, 116, 8, 12);
    });
    makeTex(scene, 'doorFrame', 84, 140, (g) => {
      g.fillStyle(0x2e2b2e); g.fillRect(0, 0, 84, 140);
      g.fillStyle(0x07060a); g.fillRect(10, 10, 64, 130);
    });
    makeTex(scene, 'heart', 22, 20, (g) => drawHeart(g, 0xff3355));
    makeTex(scene, 'heartEmpty', 22, 20, (g) => drawHeart(g, 0x3a2a30));
    makeTex(scene, 'spark', 8, 8, (g) => { g.fillStyle(0xffffff); g.fillCircle(4, 4, 4); });
    makeTex(scene, 'glow', 128, 128, (g) => {
      for (let r = 64; r > 0; r -= 4) { g.fillStyle(0xffffff, 0.035); g.fillCircle(64, 64, r); }
    });
    makeTex(scene, 'stal', 24, 64, (g) => {
      g.fillStyle(0x4a3322); g.fillTriangle(0, 0, 24, 0, 12, 64);
      g.fillStyle(0x6a4a33); g.fillTriangle(4, 0, 10, 0, 11, 40);
    });
    makeTex(scene, 'drip', 4, 8, (g) => { g.fillStyle(0x9ad7ff); g.fillEllipse(2, 4, 4, 8); });
    makeTex(scene, 'lava', 64, 40, (g) => {
      g.fillStyle(0xe84a00); g.fillRect(0, 0, 64, 40);
      g.fillStyle(0xff8a1a); g.fillRect(0, 0, 64, 10);
      g.fillStyle(0xffc23a);
      for (let x = 0; x < 64; x += 16) g.fillEllipse(x + 8, 4, 14, 6);
      g.fillStyle(0xffe27a); g.fillCircle(12, 20, 3); g.fillCircle(40, 28, 2); g.fillCircle(54, 16, 2);
      g.fillStyle(0xb32d00); g.fillCircle(26, 32, 4); g.fillCircle(50, 36, 3);
    });
    makeTex(scene, 'torch', 12, 34, (g) => {
      g.fillStyle(0x4a2e1a); g.fillRect(4, 8, 4, 26);
      g.fillStyle(0x7a7f86); g.fillRect(0, 4, 12, 6);
    });
  }
  
  function popText(scene, x, y, str, color) {
    const t = scene.add.text(x, y, str, {
      fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', color: color, stroke: '#1a0f0a', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(20);
    scene.tweens.add({ targets: t, y: y - 40, alpha: 0, duration: 800, ease: 'Power2', onComplete: () => t.destroy() });
  }
  
  function burst(scene, x, y, tint, count) {
    const em = scene.add.particles(x, y, 'spark', {
      speed: { min: 60, max: 180 }, lifespan: 450, scale: { start: 0.9, end: 0 }, tint: tint, emitting: false, blendMode: 'ADD',
    }).setDepth(15);
    em.explode(count);
    scene.time.delayedCall(700, () => em.destroy());
  }
  
  function isOverGround(x) {
    return GROUND.some((seg) => x >= seg[0] && x <= seg[0] + seg[1]);
  }
  
  function addRock(scene, left, top, w, h, depth) {
    const ts = scene.add.tileSprite(left + w / 2, top + h / 2, w, h, 'rock').setDepth(depth);
    groundGroup.add(ts);
    return ts;
  }
  
  function addTopEdge(scene, left, top, w) {
    scene.add.tileSprite(left + w / 2, top + 3, w, 6, 'rockEdge').setDepth(6);
  }
  
  function buildBackdrop(scene) {
    const bg = scene.add.graphics().setDepth(-20);
    bg.fillGradientStyle(0x120a07, 0x120a07, 0x2a170d, 0x2a170d, 1);
    bg.fillRect(0, 0, WORLD_W, WORLD_H);
    bg.fillGradientStyle(0xff5a00, 0xff5a00, 0xff5a00, 0xff5a00, 0, 0, 0.28, 0.28);
    bg.fillRect(0, 380, WORLD_W, 220);
  
    const far = scene.add.graphics().setDepth(-15).setScrollFactor(0.5);
    far.fillStyle(0x1e130d, 1);
    for (let x = -40; x < WORLD_W; x += 140) {
      far.fillTriangle(x, 0, x + 140, 0, x + 70, Phaser.Math.Between(80, 200));
      far.fillTriangle(x + 30, WORLD_H, x + 170, WORLD_H, x + 100, WORLD_H - Phaser.Math.Between(90, 220));
    }
  }
  
  function buildLava(scene) {
    lava = scene.add.tileSprite(WORLD_W / 2, 578, WORLD_W, 44, 'lava').setDepth(0);
    LAVA_PITS.forEach((pit, i) => {
      const cx = (pit[0] + pit[1]) / 2;
      const w = pit[1] - pit[0];
      const glow = scene.add.image(cx, 545, 'glow').setTint(0xff6a00).setBlendMode(Phaser.BlendModes.ADD)
        .setDisplaySize(w * 1.3, 180).setAlpha(0.5).setDepth(-1);
      scene.tweens.add({ targets: glow, alpha: 0.3, duration: 600 + i * 90, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      scene.add.particles(cx, 562, 'spark', {
        x: { min: -w / 2, max: w / 2 }, speedY: { min: -70, max: -25 }, speedX: { min: -10, max: 10 },
        lifespan: 800, scale: { start: 0.8, end: 0 }, alpha: { start: 1, end: 0 },
        tint: [0xffd23a, 0xff7a1a, 0xff4a00], frequency: 140, blendMode: 'ADD',
      }).setDepth(1);
    });
  }
  
  function buildTorches(scene) {
    TORCHES.forEach((tx) => {
      const ty = 300;
      const glow = scene.add.image(tx, ty, 'glow').setTint(0xff8a2a).setBlendMode(Phaser.BlendModes.ADD)
        .setScale(2.4).setAlpha(0.45).setDepth(-6);
      scene.tweens.add({ targets: glow, alpha: 0.28, scale: 2.2, duration: Phaser.Math.Between(80, 160), yoyo: true, repeat: -1 });
      scene.add.image(tx, ty, 'torch').setOrigin(0.5, 0).setDepth(-5);
      const flame = scene.add.ellipse(tx, ty - 2, 12, 18, 0xffb640).setDepth(-4);
      scene.tweens.add({ targets: flame, scaleY: 1.3, scaleX: 0.85, duration: Phaser.Math.Between(70, 120), yoyo: true, repeat: -1 });
      scene.add.particles(tx, ty - 8, 'spark', {
        speedY: { min: -50, max: -20 }, speedX: { min: -12, max: 12 }, lifespan: 600,
        scale: { start: 0.6, end: 0 }, alpha: { start: 1, end: 0 }, tint: [0xffdd55, 0xff7722], frequency: 90, blendMode: 'ADD',
      }).setDepth(-4);
    });
  }
  
  function buildStalactites(scene) {
    for (let x = 50; x < 3460; x += Phaser.Math.Between(110, 210)) {
      const h = Phaser.Math.Between(28, 72);
      scene.add.image(x, CEILING_H - 2, 'stal').setOrigin(0.5, 0).setDisplaySize(Phaser.Math.Between(14, 26), h).setDepth(6);
      stalTips.push({ x: x, y: CEILING_H - 2 + h });
    }
    scene.time.addEvent({
      delay: 600, loop: true, callback: () => {
        const s = Phaser.Utils.Array.GetRandom(stalTips);
        const landY = isOverGround(s.x) ? GROUND_TOP - 2 : 560;
        const d = scene.add.image(s.x, s.y, 'drip').setDepth(6).setAlpha(0.85);
        scene.tweens.add({
          targets: d, y: landY, duration: 900, ease: 'Quad.In',
          onComplete: () => {
            const splash = scene.add.image(s.x, landY, 'spark').setTint(landY === 560 ? 0xff8a1a : 0x9ad7ff).setDepth(6);
            scene.tweens.add({ targets: splash, scale: 2, alpha: 0, duration: 250, onComplete: () => splash.destroy() });
            d.destroy();
          },
        });
      },
    });
  }
  
  function startCrumble(scene, c) {
    c.crumbling = true;
    c.setTint(0xb07a55);
    tone(180, 0.08, 'triangle', 0.08);
    scene.tweens.add({ targets: c, x: c.homeX + 3, duration: 45, yoyo: true, repeat: 4 });
    scene.time.delayedCall(500, () => {
      scene.tweens.killTweensOf(c);
      c.x = c.homeX;
      c.disableBody(false, false);
      burst(scene, c.x, c.y, 0x8a6a48, 10);
      tone(110, 0.2, 'sawtooth', 0.08, 60);
      scene.tweens.add({ targets: c, y: c.homeY + 260, angle: Phaser.Math.Between(-25, 25), alpha: 0, duration: 700, ease: 'Quad.In' });
      scene.time.delayedCall(3200, () => {
        c.clearTint().setAngle(0).setAlpha(0);
        c.enableBody(true, c.homeX, c.homeY, true, true);
        c.crumbling = false;
        scene.tweens.add({ targets: c, alpha: 1, duration: 400 });
      });
    });
  }
  
  function loseGame(scene, reason) {
    if (ended) return;
    ended = true;
    hearts = 0;
    scene.physics.pause();
    player.anims.stop();
    player.setTint(0xff5533);
    tone(300, 0.6, 'sawtooth', 0.18, 60);
    scene.cameras.main.shake(300, 0.012);
    studio.log(reason);
    scene.time.delayedCall(350, () => scene.cameras.main.fadeOut(600, 30, 0, 0));
    scene.time.delayedCall(1000, () => studio.gotoScene('Main Menu'));
  }
  
  function lavaDeath(scene) {
    if (ended) return;
    burst(scene, player.x, player.body.bottom, [0xffd23a, 0xff5a00], 24);
    scene.tweens.add({ targets: player, y: player.y + 30, alpha: 0.4, duration: 500 });
    loseGame(scene, 'Loki fell into the lava!');
  }
  
  function hurtPlayer(scene, fromX) {
    const now = scene.time.now;
    if (ended || now < invulnUntil) return;
    hearts -= 1;
    scene.cameras.main.flash(180, 255, 60, 60);
    scene.cameras.main.shake(180, 0.008);
    tone(220, 0.22, 'sawtooth', 0.18, 110);
    if (hearts <= 0) { loseGame(scene, 'Loki ran out of hearts in the Rusty Caverns.'); return; }
    studio.log('Ouch! Hearts left: ' + hearts);
    invulnUntil = now + 1000;
    knockUntil = now + 250;
    player.setVelocity(player.x < fromX ? -240 : 240, -260);
    scene.tweens.add({ targets: player, alpha: 0.25, duration: 90, yoyo: true, repeat: 5, onComplete: () => player.setAlpha(1) });
  }
  
  function stompEnemy(scene, e) {
    e.dead = true;
    scene.tweens.killTweensOf(e);
    e.disableBody(false, false);
    player.setVelocityY(-380);
    invulnUntil = Math.max(invulnUntil, scene.time.now + 150);
    burst(scene, e.x, e.y, e.stompTint, 12);
    popText(scene, e.x, e.y - 20, 'SQUASH!', '#b6ff8a');
    tone(520, 0.1, 'square', 0.12, 260);
    scene.tweens.add({
      targets: e, scaleY: 0.2, scaleX: 1.4, y: e.y + e.displayHeight * 0.35, alpha: 0, duration: 260,
      onComplete: () => e.destroy(),
    });
    studio.log(e.kind + ' stomped!');
  }
  
  function touchEnemy(scene, e) {
    if (ended || e.dead) return;
    const falling = player.body.velocity.y > 40;
    const fromAbove = player.body.bottom <= e.body.top + 16;
    if (falling && fromAbove) stompEnemy(scene, e);
    else hurtPlayer(scene, e.x);
  }
  
  function openDoor(scene) {
    doorOpen = true;
    door.disableBody(false, false);
    doorLamp.setFillStyle(0x44ff88);
    tone(150, 0.09, 'square', 0.2);
    scene.time.delayedCall(110, () => tone(90, 0.28, 'sawtooth', 0.2, 60));
    scene.cameras.main.shake(250, 0.006);
    const light = scene.add.image(DOOR_X, 440, 'glow').setTint(0x66ddff).setBlendMode(Phaser.BlendModes.ADD)
      .setScale(1.2).setAlpha(0).setDepth(6);
    scene.tweens.add({ targets: light, alpha: 0.7, duration: 900 });
    scene.tweens.add({
      targets: door, y: door.y - 124, duration: 1000, ease: 'Quad.Out',
      onComplete: () => {
        tone(130, 0.12, 'square', 0.2);
        scene.time.delayedCall(80, () => tone(70, 0.2, 'square', 0.16));
        burst(scene, DOOR_X, GROUND_TOP - 4, 0x9a9aa0, 10);
      },
    });
    popText(scene, DOOR_X, 330, 'DOOR OPEN!', '#66ddff');
    studio.log('Exit door unlocked — the steel door slides open!');
  }
  
  function checkDoor(scene) {
    if (!doorOpen && gearsCollected >= GEARS_NEEDED && hasKey) openDoor(scene);
  }
  
  function collectGear(scene, g) {
    if (ended || !g.body.enable) return;
    g.disableBody(false, false);
    if (g.glow) g.glow.destroy();
    scene.tweens.killTweensOf(g);
    scene.tweens.add({ targets: g, scale: 1.8, alpha: 0, y: g.y - 30, duration: 300, onComplete: () => g.destroy() });
    gearsCollected += 1;
    burst(scene, g.x, g.y, 0xffd54a, 12);
    popText(scene, g.x, g.y - 16, '+1 GEAR', '#ffd54a');
    tone(660, 0.08, 'square', 0.1);
    scene.time.delayedCall(70, () => tone(990, 0.1, 'square', 0.1));
    studio.log('Gear ' + gearsCollected + '/' + GEARS_NEEDED);
    if (gearsCollected === GEARS_NEEDED && !hasKey) studio.log('All gears powered! Find the blue keycard.');
    checkDoor(scene);
  }
  
  function collectKeycard(scene) {
    if (ended || hasKey) return;
    hasKey = true;
    keycard.disableBody(false, false);
    if (keycard.glow) keycard.glow.destroy();
    scene.tweens.killTweensOf(keycard);
    scene.tweens.add({ targets: keycard, scale: 2, alpha: 0, y: keycard.y - 30, duration: 350, onComplete: () => keycard.destroy() });
    burst(scene, keycard.x, keycard.y, 0x66aaff, 16);
    popText(scene, keycard.x, keycard.y - 16, 'KEYCARD!', '#66aaff');
    tone(520, 0.1, 'triangle', 0.12);
    scene.time.delayedCall(90, () => tone(780, 0.1, 'triangle', 0.12));
    scene.time.delayedCall(180, () => tone(1040, 0.16, 'triangle', 0.12));
    studio.log(gearsCollected >= GEARS_NEEDED ? 'Keycard acquired!' : 'Keycard acquired! Gears still needed: ' + (GEARS_NEEDED - gearsCollected));
    checkDoor(scene);
  }
  
  function reachExit(scene) {
    if (ended || !doorOpen) return;
    ended = true;
    player.body.setVelocity(0, 0);
    player.body.enable = false;
    tone(523, 0.12, 'square', 0.1);
    scene.time.delayedCall(110, () => tone(659, 0.12, 'square', 0.1));
    scene.time.delayedCall(220, () => tone(784, 0.2, 'square', 0.1));
    scene.tweens.add({ targets: player, x: DOOR_X, alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 600 });
    studio.log('Level 2 cleared! Returning to the main menu...');
    scene.cameras.main.fadeOut(700, 0, 0, 0);
    scene.time.delayedCall(800, () => studio.gotoScene('Main Menu'));
  }
  
  class CaveScene extends Phaser.Scene {
    constructor() { super({ key: 'Cave' }); }
  
    preload() {
      this.load.spritesheet('robot', studio.assets.robotSheet(), { frameWidth: 80, frameHeight: 96 });
    }
  
    create() {
      hearts = MAX_HEARTS;
      gearsCollected = 0;
      hasKey = false;
      doorOpen = false;
      ended = false;
      invulnUntil = 0;
      knockUntil = 0;
      lastGrounded = -9999;
      wasOnGround = false;
      airVy = 0;
      stalTips = [];
  
      makeTextures(this);
      this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H, true, true, true, false);
  
      buildBackdrop(this);
      buildLava(this);
      buildTorches(this);
  
      groundGroup = this.physics.add.staticGroup();
      addRock(this, 0, 0, WORLD_W, CEILING_H, 6);
      GROUND.forEach((seg) => {
        addRock(this, seg[0], GROUND_TOP, seg[1], WORLD_H - GROUND_TOP, 5);
        addTopEdge(this, seg[0], GROUND_TOP, seg[1]);
      });
      LEDGES.forEach((l) => {
        addRock(this, l[0], l[1], l[2], 28, 5);
        addTopEdge(this, l[0], l[1], l[2]);
      });
      addRock(this, 3480, CEILING_H, 120, 372 - CEILING_H, 8);
      buildStalactites(this);
  
      movers = this.physics.add.group({ allowGravity: false, immovable: true });
      MOVERS.forEach((m, i) => {
        const p = movers.create(m[0], m[2], 'metal').setDepth(5);
        p.prevX = p.x;
        this.tweens.add({ targets: p, x: m[1], duration: 2400 + i * 300, ease: 'Sine.InOut', yoyo: true, repeat: -1 });
      });
  
      crumbles = this.physics.add.group({ allowGravity: false, immovable: true });
      CRUMBLES.forEach((c) => {
        const ledge = crumbles.create(c[0], c[1], 'crumble').setDepth(5);
        ledge.homeX = c[0];
        ledge.homeY = c[1];
        ledge.crumbling = false;
      });
  
      gears = this.physics.add.group({ allowGravity: false, immovable: true });
      GEAR_SPOTS.forEach((s, i) => {
        const g = gears.create(s[0], s[1], 'gear').setDepth(8);
        g.glow = this.add.image(s[0], s[1], 'glow').setTint(0xffc233).setScale(0.5).setAlpha(0.5)
          .setBlendMode(Phaser.BlendModes.ADD).setDepth(7);
        this.tweens.add({ targets: g, angle: 360, duration: 1800, repeat: -1 });
        this.tweens.add({ targets: [g, g.glow], y: s[1] - 6, duration: 700 + i * 40, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      });
  
      keycard = this.physics.add.image(KEYCARD_SPOT[0], KEYCARD_SPOT[1], 'keycard').setDepth(8);
      keycard.body.allowGravity = false;
      keycard.glow = this.add.image(KEYCARD_SPOT[0], KEYCARD_SPOT[1], 'glow').setTint(0x3a8aff).setScale(0.7).setAlpha(0.6)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(7);
      this.tweens.add({ targets: [keycard, keycard.glow], y: KEYCARD_SPOT[1] - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      this.tweens.add({ targets: keycard, angle: { from: -8, to: 8 }, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  
      this.add.image(DOOR_X, 430, 'doorFrame').setDepth(6);
      door = this.physics.add.image(DOOR_X, 436, 'door').setDepth(7);
      door.body.allowGravity = false;
      door.setImmovable(true);
      doorLamp = this.add.circle(DOOR_X, 356, 6, 0xff3344).setDepth(9);
      this.tweens.add({ targets: doorLamp, alpha: 0.4, duration: 500, yoyo: true, repeat: -1 });
      this.add.text(DOOR_X, 336, 'EXIT', { fontFamily: 'Arial', fontSize: '14px', fontStyle: 'bold', color: '#ffcc66' })
        .setOrigin(0.5).setDepth(9);
      const exitZone = this.add.zone(DOOR_X, 450, 30, 90);
      this.physics.add.existing(exitZone, true);
  
      const lavaZone = this.add.zone(WORLD_W / 2, 580, WORLD_W, 40);
      this.physics.add.existing(lavaZone, true);
  
      slimes = this.physics.add.group();
      SLIMES.forEach((s, i) => {
        const slime = slimes.create((s[0] + s[1]) / 2, GROUND_TOP - 16, 'slime').setDepth(9);
        slime.minX = s[0];
        slime.maxX = s[1];
        slime.kind = 'Slime';
        slime.stompTint = 0x5fd35f;
        slime.dead = false;
        slime.body.setSize(34, 24).setOffset(3, 6);
        slime.setVelocityX(i % 2 ? -55 : 55);
      });
  
      bats = this.physics.add.group({ allowGravity: false });
      BATS.forEach((b, i) => {
        const bat = bats.create(b[0], b[1], 'bat').setDepth(9);
        bat.cx = b[0];
        bat.cy = b[1];
        bat.range = b[2];
        bat.phase = i * 1.7;
        bat.mode = 'swoop';
        bat.modeUntil = 0;
        bat.nextDive = this.time.now + 2500;
        bat.kind = 'Bat';
        bat.stompTint = 0xb070ff;
        bat.dead = false;
        bat.diveX = 0;
        bat.diveY = 0;
        bat.body.setSize(34, 18).setOffset(9, 6);
        this.tweens.add({ targets: bat, scaleY: 0.65, duration: 110, yoyo: true, repeat: -1 });
      });
  
      player = this.physics.add.sprite(90, GROUND_TOP - 40, 'robot', 0).setScale(0.6).setDepth(10);
      player.body.setSize(44, 84).setOffset(18, 10);
      player.setCollideWorldBounds(true);
      if (!this.anims.exists('loki-walk')) {
        this.anims.create({ key: 'loki-walk', frames: this.anims.generateFrameNumbers('robot', { start: 1, end: 2 }), frameRate: 8, repeat: -1 });
      }
  
      this.physics.add.collider(player, groundGroup);
      this.physics.add.collider(player, movers);
      this.physics.add.collider(player, door);
      this.physics.add.collider(player, crumbles, (p, c) => {
        if (!c.crumbling && c.body.touching.up && p.body.touching.down) startCrumble(this, c);
      });
      this.physics.add.collider(slimes, groundGroup);
      this.physics.add.overlap(player, slimes, (p, e) => touchEnemy(this, e));
      this.physics.add.overlap(player, bats, (p, e) => touchEnemy(this, e));
      this.physics.add.overlap(player, gears, (p, g) => collectGear(this, g));
      this.physics.add.overlap(player, keycard, () => collectKeycard(this));
      this.physics.add.overlap(player, lavaZone, () => lavaDeath(this));
      this.physics.add.overlap(player, exitZone, () => reachExit(this));
  
      cursors = this.input.keyboard.createCursorKeys();
      keys = this.input.keyboard.addKeys('W,A,D');
  
      const cam = this.cameras.main;
      cam.setBounds(0, 0, WORLD_W, WORLD_H);
      cam.setZoom(this.scale.height / WORLD_H);
      cam.startFollow(player, true, 0.1, 0.1);
      cam.setBackgroundColor('#120a07');
      cam.fadeIn(400, 0, 0, 0);
  
      this.scene.launch('HUD');
      studio.log('Level 2: Rusty Caverns — collect 7 gears and the blue keycard to open the exit door.');
    }
  
    update(time, delta) {
      if (ended) return;
  
      lava.tilePositionX += 0.02 * delta;
  
      movers.children.iterate((m) => {
        if (!m) return;
        const dx = m.x - m.prevX;
        const riding = player.body.touching.down
          && Math.abs(player.body.bottom - m.body.top) < 6
          && player.body.right > m.body.left
          && player.body.left < m.body.right;
        if (dx !== 0 && riding) player.x += dx;
        m.prevX = m.x;
      });
  
      const onGround = player.body.blocked.down || player.body.touching.down;
      if (onGround) lastGrounded = time;
      if (onGround && !wasOnGround && airVy > 350) burst(this, player.x, player.body.bottom, 0x9a7a5a, 6);
      if (!onGround) airVy = player.body.velocity.y;
      wasOnGround = onGround;
  
      const left = cursors.left.isDown || keys.A.isDown;
      const right = cursors.right.isDown || keys.D.isDown;
      const jump = Phaser.Input.Keyboard.JustDown(cursors.up)
        || Phaser.Input.Keyboard.JustDown(keys.W)
        || Phaser.Input.Keyboard.JustDown(cursors.space);
  
      if (time > knockUntil) {
        if (left) { player.setVelocityX(-RUN_SPEED); player.setFlipX(true); }
        else if (right) { player.setVelocityX(RUN_SPEED); player.setFlipX(false); }
        else player.setVelocityX(0);
      }
  
      if (jump && time - lastGrounded <= COYOTE_MS) {
        player.setVelocityY(JUMP_VELOCITY);
        lastGrounded = -9999;
        tone(700, 0.09, 'square', 0.08, 1100);
      }
  
      if (!onGround) { player.anims.stop(); player.setFrame(3); }
      else if (player.body.velocity.x !== 0) player.anims.play('loki-walk', true);
      else { player.anims.stop(); player.setFrame(0); }
  
      slimes.children.iterate((s) => {
        if (!s || !s.active || s.dead) return;
        if (s.x <= s.minX) s.setVelocityX(55);
        else if (s.x >= s.maxX) s.setVelocityX(-55);
        else if (Math.abs(s.body.velocity.x) < 1) s.setVelocityX(55);
        s.setFlipX(s.body.velocity.x < 0);
      });
  
      bats.children.iterate((b) => {
        if (!b || !b.active || b.dead) return;
        const dist = Phaser.Math.Distance.Between(b.x, b.y, player.x, player.y);
        if (b.mode === 'swoop') {
          const tx = b.cx + Math.sin(time * 0.0011 + b.phase) * b.range;
          const ty = b.cy + Math.sin(time * 0.0045 + b.phase) * 26;
          b.setVelocity((tx - b.x) * 4, (ty - b.y) * 4);
          if (dist < BAT_AGGRO && time > b.nextDive) {
            b.mode = 'tell';
            b.modeUntil = time + 350;
            b.setVelocity(0, 0);
            b.setTint(0xff6688);
            tone(900, 0.06, 'triangle', 0.06);
          }
        } else if (b.mode === 'tell') {
          if (time > b.modeUntil) {
            b.mode = 'dive';
            b.clearTint();
            b.diveX = player.x;
            b.diveY = Math.min(player.y, GROUND_TOP - 20);
            b.modeUntil = time + 1100;
            this.physics.moveTo(b, b.diveX, b.diveY, 260);
          }
        } else if (b.mode === 'dive') {
          if (time > b.modeUntil || Phaser.Math.Distance.Between(b.x, b.y, b.diveX, b.diveY) < 14) b.mode = 'return';
        } else {
          this.physics.moveTo(b, b.cx, b.cy, 150);
          if (Phaser.Math.Distance.Between(b.x, b.y, b.cx, b.cy) < 16) {
            b.mode = 'swoop';
            b.nextDive = time + 1800;
          }
        }
        b.setFlipX(b.body.velocity.x < 0);
      });
  
      if (player.y > WORLD_H + 60) loseGame(this, 'Loki fell off the map!');
    }
  }
  
  class HudScene extends Phaser.Scene {
    constructor() { super({ key: 'HUD' }); }
  
    create() {
      const w = this.scale.width;
      const textStyle = { fontFamily: 'Arial', fontSize: '18px', fontStyle: 'bold', stroke: '#1a0f0a', strokeThickness: 4 };
      this.heartIcons = [];
      for (let i = 0; i < MAX_HEARTS; i++) this.heartIcons.push(this.add.image(24 + i * 28, 24, 'heart').setScale(1.1));
      this.add.image(26, 56, 'gear').setScale(0.7);
      this.gearText = this.add.text(44, 46, '', Object.assign({ color: '#ffd54a' }, textStyle));
      this.keyIcon = this.add.image(26, 88, 'keycard').setScale(0.8).setAlpha(0.3);
      this.keyText = this.add.text(44, 78, 'Keycard', Object.assign({ color: '#556677' }, textStyle));
      this.add.text(w - 16, 14, 'LEVEL 2 — RUSTY CAVERNS', Object.assign({ color: '#ffb070' }, textStyle)).setOrigin(1, 0);
      const hint = this.add.text(w / 2, 60, 'Collect 7 gears + the blue keycard to open the exit door', Object.assign({ color: '#ffffff' }, textStyle, { fontSize: '16px' })).setOrigin(0.5);
      this.tweens.add({ targets: hint, alpha: 0, delay: 4500, duration: 800, onComplete: () => hint.destroy() });
      this.shownHearts = -1;
      this.shownGears = -1;
      this.shownKey = false;
    }
  
    update() {
      if (this.shownHearts !== hearts) {
        this.heartIcons.forEach((h, i) => h.setTexture(i < hearts ? 'heart' : 'heartEmpty'));
        if (this.shownHearts > hearts && hearts >= 0) {
          const lost = this.heartIcons[hearts];
          if (lost) this.tweens.add({ targets: lost, scale: 1.6, duration: 120, yoyo: true });
        }
        this.shownHearts = hearts;
      }
      if (this.shownGears !== gearsCollected) {
        this.gearText.setText('Gears: ' + gearsCollected + '/' + GEARS_NEEDED);
        this.gearText.setColor(gearsCollected >= GEARS_NEEDED ? '#66ffee' : '#ffd54a');
        if (this.shownGears !== -1) this.tweens.add({ targets: this.gearText, scale: 1.25, duration: 100, yoyo: true });
        this.shownGears = gearsCollected;
      }
      if (hasKey && !this.shownKey) {
        this.shownKey = true;
        this.keyIcon.setAlpha(1);
        this.keyText.setColor('#66aaff');
        this.tweens.add({ targets: this.keyIcon, scale: 1.3, duration: 140, yoyo: true });
      }
    }
  }
  
  window.__phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: game.container,
    width: game.container.clientWidth || 800,
    height: game.container.clientHeight || 600,
    backgroundColor: '#120a07',
    physics: { default: 'arcade', arcade: { gravity: { y: 900 }, debug: false } },
    scene: [CaveScene, HudScene],
  });
}
