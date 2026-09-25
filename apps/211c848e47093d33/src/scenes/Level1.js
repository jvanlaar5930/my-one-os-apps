function runLevel1(game) {
  // Request: Build the **Level 1** scene now. Use the Approved Plan above for all context — do not ask questions. Scene goal: - "Circuit Meadow": a side-scrolling level about 3 screens wide with green grass-topped dirt platforms, floating metal ledges, and a pastel sky with parallax clouds. Arcade physics with gravity, and the camera follows Loki with world bounds. - Loki is the player (robot spritesheet: idle frame 0, walk frames 1–2, jump frame 3), with left/right movement, a single jump, and a flip when facing left. HUD shows 3 red hearts, a gear counter "Gears: 0/5", and the level name. - Monsters: 4 green "Slime" blobs that patrol back and forth between platform edges. Stomping one from above squashes it and bounces Loki. Side contact costs 1 heart and gives 1 second of blinking invulnerability. - Objective: collect 5 spinning golden gears scattered across the level to power the exit teleporter pad at the far right. The pad glows gray until all gears are collected, then turns bright cyan. - Transition: stepping onto the powered teleporter with all 5 gears → game.gotoScene('Level 2') - Transition: hearts reach 0, or Loki falls into a bottomless gap → game.gotoScene('Game Over')
  if (window.__phaserGame) { window.__phaserGame.destroy(true); window.__phaserGame = null; }
  
  const studio = game;
  const VIEW_W = game.container.clientWidth || 800;
  const VIEW_H = game.container.clientHeight || 600;
  const WORLD_W = 2400;
  const WORLD_H = Math.max(VIEW_H, 540);
  const GY = WORLD_H - 60;
  const TOTAL_GEARS = 5;
  const MAX_HEARTS = 3;
  const ROBOT_SCALE = 0.6;
  const RUN_SPEED = 220;
  const JUMP_VELOCITY = -580;
  const STOMP_BOUNCE = -380;
  const SLIME_SPEED = 60;
  const PAD_X = 2330;
  
  const GROUND = [[0, 620], [760, 1260], [1400, 1880], [2020, 2400]];
  const GRASS_LEDGES = [
    { x: 300, top: GY - 120, w: 160 },
    { x: 900, top: GY - 140, w: 200 },
    { x: 1500, top: GY - 130, w: 180 },
    { x: 2100, top: GY - 120, w: 140 },
  ];
  const METAL_LEDGES = [
    { x: 520, top: GY - 230, w: 112 },
    { x: 1120, top: GY - 250, w: 128 },
    { x: 1720, top: GY - 240, w: 112 },
  ];
  const GEAR_SPOTS = [
    [380, GY - 160],
    [576, GY - 275],
    [1184, GY - 295],
    [1330, GY - 100],
    [1776, GY - 285],
  ];
  const SLIME_PATROLS = [
    { min: 200, max: 590, top: GY },
    { min: 920, max: 1080, top: GY - 140 },
    { min: 1440, max: 1850, top: GY },
    { min: 2040, max: 2230, top: GY },
  ];
  
  let player, cursors, keys, solids, slimes, gears, pad, padGlow, padBeam, padLabel;
  let heartIcons, gearText, hintText, clouds;
  let hearts, gearsCollected, invulnerable, knockUntil, padPowered, ended, hintUntil;
  
  function tone(freq, dur, type, vol, delay) {
    try {
      const ctx = window.__lokiAudioCtx = window.__lokiAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      const t0 = ctx.currentTime + (delay || 0);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.1, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (e) {}
  }
  
  function makeTextures(scene) {
    if (scene.textures.exists('dirt')) return;
    const g = scene.add.graphics();
  
    g.fillStyle(0x8b5a2b); g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x6e4420); g.fillRect(4, 6, 4, 4); g.fillRect(20, 14, 5, 4); g.fillRect(10, 24, 4, 3);
    g.fillStyle(0xa06a38); g.fillRect(24, 4, 3, 3); g.fillRect(6, 16, 3, 3); g.fillRect(26, 26, 3, 3);
    g.generateTexture('dirt', 32, 32); g.clear();
  
    g.fillStyle(0x4caf50); g.fillRect(0, 3, 32, 9);
    g.fillStyle(0x7ed957); g.fillRect(0, 2, 32, 4);
    g.fillTriangle(1, 3, 4, 0, 7, 3); g.fillTriangle(11, 3, 14, 0, 17, 3); g.fillTriangle(22, 3, 25, 0, 28, 3);
    g.generateTexture('grass', 32, 12); g.clear();
  
    g.fillStyle(0x5b6573); g.fillRect(0, 0, 32, 16);
    g.fillStyle(0x9aa6b4); g.fillRect(1, 1, 30, 11);
    g.fillStyle(0xc9d2dc); g.fillRect(1, 1, 30, 2);
    g.fillStyle(0x4d5763); g.fillCircle(5, 7, 2); g.fillCircle(27, 7, 2);
    g.generateTexture('metal', 32, 16); g.clear();
  
    g.fillStyle(0x3fbf4f); g.fillEllipse(20, 19, 38, 18); g.fillEllipse(20, 13, 26, 20);
    g.fillStyle(0x9cf29f); g.fillEllipse(13, 8, 7, 4);
    g.fillStyle(0xffffff); g.fillCircle(14, 14, 4); g.fillCircle(26, 14, 4);
    g.fillStyle(0x1b1b1b); g.fillCircle(15, 15, 2); g.fillCircle(27, 15, 2);
    g.generateTexture('slime', 40, 28); g.clear();
  
    g.fillStyle(0xffc83d);
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      g.fillCircle(14 + Math.cos(a) * 10.5, 14 + Math.sin(a) * 10.5, 3.5);
    }
    g.fillCircle(14, 14, 10);
    g.fillStyle(0xffe58a); g.fillCircle(11, 11, 3);
    g.fillStyle(0xb8860b); g.fillCircle(14, 14, 4);
    g.generateTexture('gear', 28, 28); g.clear();
  
    g.fillStyle(0xff4d5e); g.fillCircle(7, 7, 6); g.fillCircle(17, 7, 6); g.fillTriangle(1, 9, 23, 9, 12, 21);
    g.fillStyle(0xff9aa5); g.fillCircle(6, 5, 2);
    g.generateTexture('heart', 24, 22); g.clear();
  
    g.fillStyle(0xffffff); g.fillCircle(24, 30, 16); g.fillCircle(46, 22, 20); g.fillCircle(70, 30, 16); g.fillRect(24, 30, 46, 16);
    g.generateTexture('cloud', 96, 48); g.clear();
  
    g.fillStyle(0x3a3f47); g.fillRect(0, 6, 96, 8);
    g.fillStyle(0xffffff); g.fillRect(6, 0, 84, 7);
    g.generateTexture('pad', 96, 14);
    g.destroy();
  }
  
  function buildBackdrop(scene) {
    const sky = scene.add.graphics().setScrollFactor(0).setDepth(-30);
    sky.fillGradientStyle(0xa8d8ff, 0xa8d8ff, 0xffd9ec, 0xffd9ec, 1);
    sky.fillRect(0, 0, VIEW_W, VIEW_H);
  
    const farSpan = VIEW_W + (WORLD_W - VIEW_W) * 0.35 + 200;
    const far = scene.add.graphics().setScrollFactor(0.35).setDepth(-25);
    far.fillStyle(0xcfe9c8);
    for (let x = -100; x < farSpan; x += 170) far.fillCircle(x, GY + 40, 140);
  
    const nearSpan = VIEW_W + (WORLD_W - VIEW_W) * 0.6 + 200;
    const near = scene.add.graphics().setScrollFactor(0.6).setDepth(-20);
    near.fillStyle(0xa9dca0);
    for (let x = -60; x < nearSpan; x += 130) near.fillCircle(x, GY + 60, 100);
  
    clouds = [];
    const cloudSpan = VIEW_W + (WORLD_W - VIEW_W) * 0.25 + 240;
    for (let i = 0; i < 9; i++) {
      const cloud = scene.add.image(Phaser.Math.Between(0, cloudSpan), Phaser.Math.Between(30, Math.max(60, GY - 280)), 'cloud')
        .setScrollFactor(0.25).setDepth(-22).setAlpha(0.85).setScale(Phaser.Math.FloatBetween(0.6, 1.2));
      cloud.span = cloudSpan;
      clouds.push(cloud);
    }
  }
  
  function driftClouds(delta) {
    clouds.forEach((cloud) => {
      cloud.x -= 0.12 * (delta / 16);
      if (cloud.x < -120) cloud.x += cloud.span + 240;
    });
  }
  
  function addSolid(scene, x, top, w, h, key) {
    const block = scene.add.tileSprite(x, top, w, h, key).setOrigin(0, 0).setDepth(2);
    scene.physics.add.existing(block, true);
    solids.push(block);
    return block;
  }
  
  function buildTerrain(scene) {
    solids = [];
    GROUND.forEach(([x0, x1]) => {
      addSolid(scene, x0, GY, x1 - x0, WORLD_H - GY + 20, 'dirt');
      scene.add.tileSprite(x0, GY - 4, x1 - x0, 12, 'grass').setOrigin(0, 0).setDepth(3);
    });
    GRASS_LEDGES.forEach((l) => {
      addSolid(scene, l.x, l.top, l.w, 24, 'dirt');
      scene.add.tileSprite(l.x, l.top - 4, l.w, 12, 'grass').setOrigin(0, 0).setDepth(3);
    });
    METAL_LEDGES.forEach((l) => addSolid(scene, l.x, l.top, l.w, 16, 'metal'));
  }
  
  function burst(scene, x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const p = scene.add.circle(x, y, Phaser.Math.Between(2, 4), color).setDepth(20);
      const a = Math.random() * Math.PI * 2;
      const d = Phaser.Math.Between(20, 50);
      scene.tweens.add({
        targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 0.3,
        duration: Phaser.Math.Between(300, 500), ease: 'Power2', onComplete: () => p.destroy(),
      });
    }
  }
  
  function scorePop(scene, x, y, text, color) {
    const t = scene.add.text(x, y, text, {
      fontFamily: 'Arial', fontSize: '18px', color: color, fontStyle: 'bold', stroke: '#2b2d42', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(50);
    scene.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 750, ease: 'Power2', onComplete: () => t.destroy() });
  }
  
  function showHint(scene, msg, ms) {
    hintText.setText(msg).setAlpha(1);
    scene.tweens.killTweensOf(hintText);
    scene.tweens.add({ targets: hintText, alpha: 0, delay: ms, duration: 400 });
    hintUntil = scene.time.now + ms + 400;
  }
  
  function refreshHearts() {
    heartIcons.forEach((h, i) => {
      if (i < hearts) h.clearTint().setAlpha(1);
      else h.setTint(0x444444).setAlpha(0.45);
    });
  }
  
  function touchSlime(scene, slime) {
    if (ended || slime.squashed) return;
    const falling = player.body.velocity.y > 0;
    const fromAbove = player.body.bottom <= slime.body.top + 14;
    if (falling && fromAbove) squashSlime(scene, slime);
    else hurt(scene, slime.x);
  }
  
  function squashSlime(scene, slime) {
    slime.squashed = true;
    slime.setVelocity(0, 0);
    slime.body.enable = false;
    scene.tweens.killTweensOf(slime);
    slime.setScale(1);
    scene.tweens.add({
      targets: slime, scaleY: 0.2, scaleX: 1.4, y: slime.y + 10, alpha: 0,
      duration: 280, ease: 'Power2', onComplete: () => slime.destroy(),
    });
    player.setVelocityY(STOMP_BOUNCE);
    burst(scene, slime.x, slime.y, 0x7ee88a, 8);
    scorePop(scene, slime.x, slime.y - 20, 'SQUASH!', '#7ee88a');
    scene.cameras.main.shake(90, 0.004);
    tone(300, 0.08, 'triangle', 0.14);
    tone(150, 0.12, 'triangle', 0.12, 0.05);
    studio.log('Squashed a Slime!');
  }
  
  function hurt(scene, fromX) {
    if (invulnerable || ended) return;
    hearts -= 1;
    refreshHearts();
    const lost = heartIcons[hearts];
    if (lost) scene.tweens.add({ targets: lost, scale: 1.5, duration: 120, yoyo: true });
    scene.cameras.main.flash(200, 255, 70, 70);
    scene.cameras.main.shake(180, 0.01);
    tone(180, 0.25, 'sawtooth', 0.12);
    studio.log('Ouch! Hearts left: ' + hearts);
    if (hearts <= 0) { lose(scene, 'hearts'); return; }
  
    invulnerable = true;
    const dir = player.x < fromX ? -1 : 1;
    player.setVelocity(dir * 240, -300);
    knockUntil = scene.time.now + 250;
    scene.tweens.add({ targets: player, alpha: 0.25, duration: 90, yoyo: true, repeat: 5, onComplete: () => player.setAlpha(1) });
    scene.time.delayedCall(1000, () => { invulnerable = false; player.setAlpha(1); });
  }
  
  function lose(scene, reason) {
    if (ended) return;
    ended = true;
    scene.physics.pause();
    player.anims.stop();
    player.setTint(0x888888);
    tone(160, 0.45, 'sawtooth', 0.14);
    tone(90, 0.5, 'sawtooth', 0.12, 0.15);
    studio.log(reason === 'fell' ? 'Loki fell into the void!' : 'Loki ran out of hearts!');
    scene.cameras.main.fadeOut(600, 0, 0, 0);
    scene.time.delayedCall(650, () => studio.gotoScene('Main Menu'));
  }
  
  function collectGear(scene, gear) {
    if (ended || gear.collected) return;
    gear.collected = true;
    gear.body.enable = false;
    scene.tweens.killTweensOf(gear);
    scene.tweens.add({
      targets: gear, y: gear.y - 24, scale: 1.8, alpha: 0, angle: gear.angle + 180,
      duration: 350, ease: 'Power2', onComplete: () => gear.destroy(),
    });
    gearsCollected += 1;
    gearText.setText('Gears: ' + gearsCollected + '/' + TOTAL_GEARS);
    scene.tweens.add({ targets: gearText, scale: 1.25, duration: 120, yoyo: true });
    burst(scene, gear.x, gear.y, 0xffd84d, 10);
    scorePop(scene, gear.x, gear.y - 16, '+1 GEAR', '#ffdd00');
    tone(880, 0.08, 'sine', 0.12);
    tone(1320, 0.12, 'sine', 0.1, 0.07);
    studio.log('Gear collected: ' + gearsCollected + '/' + TOTAL_GEARS);
    if (gearsCollected >= TOTAL_GEARS) powerPad(scene);
  }
  
  function powerPad(scene) {
    padPowered = true;
    pad.setTint(0x33f0ff);
    padGlow.setFillStyle(0x33f0ff, 0.5);
    scene.tweens.add({ targets: padGlow, scaleX: 1.25, scaleY: 1.4, alpha: 0.4, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    scene.tweens.add({ targets: padBeam, alpha: { from: 0.4, to: 1 }, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    padLabel.setColor('#33f0ff');
    scene.cameras.main.flash(250, 120, 240, 255);
    showHint(scene, 'Teleporter powered! Head to the far right →', 3000);
    tone(523, 0.12, 'triangle', 0.12);
    tone(659, 0.12, 'triangle', 0.12, 0.1);
    tone(784, 0.25, 'triangle', 0.12, 0.2);
    studio.log('All gears collected — the teleporter is powered!');
  }
  
  function touchPad(scene) {
    if (ended) return;
    if (!padPowered) {
      if (scene.time.now >= hintUntil) {
        const left = TOTAL_GEARS - gearsCollected;
        showHint(scene, 'Need ' + left + ' more gear' + (left === 1 ? '' : 's') + ' to power the teleporter', 1600);
      }
      return;
    }
    if (!(player.body.blocked.down || player.body.touching.down)) return;
    win(scene);
  }
  
  function win(scene) {
    ended = true;
    player.setVelocity(0, 0);
    player.body.enable = false;
    player.anims.stop();
    player.setFrame(3);
    burst(scene, PAD_X, GY - 20, 0x33f0ff, 16);
    tone(523, 0.1, 'square', 0.1);
    tone(784, 0.1, 'square', 0.1, 0.1);
    tone(1047, 0.3, 'square', 0.1, 0.2);
    scene.tweens.add({
      targets: player, x: PAD_X, y: player.y - 90, alpha: 0,
      scaleX: ROBOT_SCALE * 0.3, scaleY: ROBOT_SCALE * 1.6, duration: 700, ease: 'Power2',
    });
    scene.cameras.main.flash(200, 120, 240, 255);
    scene.cameras.main.fadeOut(800, 180, 250, 255);
    studio.log('Loki teleported out of Circuit Meadow!');
    scene.time.delayedCall(900, () => studio.gotoScene('Main Menu'));
  }
  
  function patrolSlimes() {
    slimes.children.iterate((s) => {
      if (!s || !s.active || s.squashed) return;
      if (s.x <= s.minX) s.setVelocityX(SLIME_SPEED);
      else if (s.x >= s.maxX) s.setVelocityX(-SLIME_SPEED);
      s.setFlipX(s.body.velocity.x > 0);
    });
  }
  
  class Level1Scene extends Phaser.Scene {
    constructor() { super({ key: 'Level1' }); }
  
    preload() {
      this.load.spritesheet('robot', studio.assets.robotSheet(), { frameWidth: 80, frameHeight: 96 });
    }
  
    create() {
      hearts = MAX_HEARTS;
      gearsCollected = 0;
      invulnerable = false;
      knockUntil = 0;
      padPowered = false;
      ended = false;
      hintUntil = 0;
  
      makeTextures(this);
      buildBackdrop(this);
      buildTerrain(this);
  
      if (!this.anims.exists('loki-walk')) {
        this.anims.create({ key: 'loki-walk', frames: this.anims.generateFrameNumbers('robot', { start: 1, end: 2 }), frameRate: 8, repeat: -1 });
      }
  
      padGlow = this.add.ellipse(PAD_X, GY - 8, 130, 36, 0x9aa0a8, 0.35).setDepth(4);
      padBeam = this.add.rectangle(PAD_X, GY - 90, 70, 160, 0x33f0ff, 0.25).setDepth(4).setAlpha(0);
      pad = this.physics.add.staticImage(PAD_X, GY - 7, 'pad').setTint(0x9aa0a8).setDepth(5);
      padLabel = this.add.text(PAD_X, GY - 186, 'EXIT', {
        fontFamily: 'Arial', fontSize: '18px', color: '#9aa0a8', fontStyle: 'bold', stroke: '#2b2d42', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(5);
  
      gears = this.physics.add.group({ allowGravity: false });
      GEAR_SPOTS.forEach(([x, y], i) => {
        const gear = gears.create(x, y, 'gear').setDepth(7);
        gear.collected = false;
        gear.body.setCircle(12, 2, 2);
        this.tweens.add({ targets: gear, angle: 360, duration: 1600, repeat: -1 });
        this.tweens.add({ targets: gear, y: y - 8, duration: 700 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      });
  
      slimes = this.physics.add.group({ allowGravity: false, immovable: true });
      SLIME_PATROLS.forEach((p) => {
        const s = slimes.create((p.min + p.max) / 2, p.top - 14, 'slime').setDepth(8);
        s.minX = p.min;
        s.maxX = p.max;
        s.squashed = false;
        s.body.setSize(34, 22).setOffset(3, 6);
        s.setVelocityX(Phaser.Math.RND.pick([-1, 1]) * SLIME_SPEED);
        this.tweens.add({ targets: s, scaleY: 0.88, scaleX: 1.08, duration: 380, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      });
  
      player = this.physics.add.sprite(80, GY - 40, 'robot', 0).setScale(ROBOT_SCALE).setDepth(10);
      player.body.setSize(44, 84).setOffset(18, 12);
      player.setCollideWorldBounds(true);
  
      this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H + 400);
      this.physics.world.setBoundsCollision(true, true, true, false);
      this.physics.add.collider(player, solids);
      this.physics.add.overlap(player, slimes, (p, s) => touchSlime(this, s));
      this.physics.add.overlap(player, gears, (p, g) => collectGear(this, g));
      this.physics.add.overlap(player, pad, () => touchPad(this));
  
      this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
      this.cameras.main.startFollow(player, true, 0.1, 0.1);
      this.cameras.main.fadeIn(400, 0, 0, 0);
  
      cursors = this.input.keyboard.createCursorKeys();
      keys = this.input.keyboard.addKeys('W,A,D');
  
      const hudStyle = { fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', fontStyle: 'bold', stroke: '#2b2d42', strokeThickness: 4 };
      heartIcons = [];
      for (let i = 0; i < MAX_HEARTS; i++) {
        heartIcons.push(this.add.image(24 + i * 30, 24, 'heart').setScrollFactor(0).setDepth(100));
      }
      this.add.image(26, 58, 'gear').setScrollFactor(0).setDepth(100).setScale(0.8);
      gearText = this.add.text(46, 58, 'Gears: 0/' + TOTAL_GEARS, hudStyle).setOrigin(0, 0.5).setScrollFactor(0).setDepth(100);
      this.add.text(VIEW_W / 2, 14, 'LEVEL 1 — CIRCUIT MEADOW', Object.assign({}, hudStyle, { fontSize: '18px', color: '#e8f7ff' }))
        .setOrigin(0.5, 0).setScrollFactor(0).setDepth(100);
      hintText = this.add.text(VIEW_W / 2, 44, '', Object.assign({}, hudStyle, { fontSize: '16px', color: '#fff6a8' }))
        .setOrigin(0.5, 0).setScrollFactor(0).setDepth(100).setAlpha(0);
  
      refreshHearts();
      showHint(this, 'Collect 5 gears to power the teleporter! Stomp slimes from above.', 3500);
      studio.log('Level 1: Circuit Meadow — collect ' + TOTAL_GEARS + ' gears and reach the teleporter.');
    }
  
    update(time, delta) {
      driftClouds(delta);
      if (ended) return;
  
      if (player.y > WORLD_H + 40) { lose(this, 'fell'); return; }
  
      patrolSlimes();
  
      const onGround = player.body.blocked.down || player.body.touching.down;
      const left = cursors.left.isDown || keys.A.isDown;
      const right = cursors.right.isDown || keys.D.isDown;
  
      if (time >= knockUntil) {
        if (left && !right) { player.setVelocityX(-RUN_SPEED); player.setFlipX(true); }
        else if (right && !left) { player.setVelocityX(RUN_SPEED); player.setFlipX(false); }
        else player.setVelocityX(0);
      }
  
      const jumpPressed = [cursors.up, cursors.space, keys.W]
        .map((k) => Phaser.Input.Keyboard.JustDown(k))
        .some(Boolean);
      if (jumpPressed && onGround) {
        player.setVelocityY(JUMP_VELOCITY);
        burst(this, player.x, player.body.bottom, 0xffffff, 5);
        tone(660, 0.09, 'square', 0.08);
      }
  
      if (!onGround) { player.anims.stop(); player.setFrame(3); }
      else if (player.body.velocity.x !== 0) player.anims.play('loki-walk', true);
      else { player.anims.stop(); player.setFrame(0); }
    }
  }
  
  window.__phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: game.container,
    width: game.container.clientWidth || 800,
    height: game.container.clientHeight || 600,
    backgroundColor: '#a8d8ff',
    physics: { default: 'arcade', arcade: { gravity: { y: 1000 }, debug: false } },
    scene: [Level1Scene],
  });
}
