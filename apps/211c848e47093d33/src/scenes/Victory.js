function runVictory(game) {
  // Request: Build the **Victory** scene now. Use the Approved Plan above for all context — do not ask questions. Scene goal: - A starry night sky where the golden rocket blasts off with a flame particle trail, carrying Loki upward, and a burst of confetti particles follows. - A "LOKI MADE IT HOME!" title appears in gold, with a line underneath reading "All levels complete" and a cheerful rising fanfare. - Loki appears in the jump frame, bouncing happily on a small platform, with a "PLAY AGAIN" prompt below. - Transition: click "MAIN MENU" or press Space or Enter → game.gotoScene('Main Menu') - Transition: click "PLAY AGAIN" or press R → game.gotoScene('Level 1')
  if (window.__phaserGame) { window.__phaserGame.destroy(true); window.__phaserGame = null; }
  
  var PALETTE = {
    skyTop: 0x050818,
    skyBottom: 0x2a1650,
    gold: 0xffc933,
    goldDark: 0xc98a12,
    red: 0xd63a3a,
    metal: 0x7a8699,
    metalLight: 0xb8c4d6,
    hill: 0x0c0a1c,
    cyan: 0x44e0ff,
  };
  var CONFETTI_COLORS = [0xff4f7b, 0xffd23f, 0x3ee08f, 0x44c8ff, 0xb46bff, 0xffffff];
  
  let sceneRef = null;
  let leaving = false;
  let audioCtx = null;
  let W = 800;
  let H = 600;
  
  function tone(freq, dur, type, vol, delay, endFreq) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var t0 = audioCtx.currentTime + (delay || 0);
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, t0);
      if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
      gain.gain.setValueAtTime(vol || 0.1, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (e) {}
  }
  
  function playFanfare() {
    var notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach(function (f, i) {
      tone(f, 0.18, 'square', 0.06, i * 0.14);
      tone(f / 2, 0.18, 'triangle', 0.06, i * 0.14);
    });
    [1046.5, 1318.5, 1568].forEach(function (f) { tone(f, 0.9, 'triangle', 0.08, 0.62); });
    tone(523.25, 0.9, 'square', 0.04, 0.62);
  }
  
  function makeTextures(scene) {
    var g = scene.add.graphics();
    g.fillStyle(0xffffff, 1); g.fillCircle(2, 2, 2); g.generateTexture('star', 4, 4); g.clear();
    g.fillStyle(0xffffff, 1); g.fillCircle(8, 8, 8); g.generateTexture('flame', 16, 16); g.clear();
    g.fillStyle(0x9aa0b4, 1); g.fillCircle(12, 12, 12); g.generateTexture('puff', 24, 24); g.clear();
    g.fillStyle(0xffffff, 1); g.fillRect(0, 0, 10, 6); g.generateTexture('confetti', 10, 6); g.clear();
  
    g.fillStyle(PALETTE.red, 1);
    g.fillTriangle(12, 86, 0, 124, 12, 124);
    g.fillTriangle(52, 86, 64, 124, 52, 124);
    g.fillStyle(PALETTE.gold, 1);
    g.fillRoundedRect(12, 32, 40, 92, 8);
    g.fillStyle(PALETTE.goldDark, 1);
    g.fillRect(40, 36, 12, 84);
    g.fillStyle(PALETTE.red, 1);
    g.fillTriangle(12, 36, 52, 36, 32, 0);
    g.fillRect(12, 96, 40, 6);
    g.fillStyle(0x3a3f55, 1); g.fillCircle(32, 62, 11);
    g.fillStyle(PALETTE.cyan, 1); g.fillCircle(32, 62, 8);
    g.fillStyle(0xffffff, 0.8); g.fillCircle(29, 59, 3);
    g.fillStyle(0x555b6e, 1); g.fillRect(20, 122, 24, 8);
    g.generateTexture('rocket', 64, 130);
    g.destroy();
  }
  
  function makeButton(scene, x, y, w, h, label, color, hoverColor, onClick) {
    var bg = scene.add.graphics();
    function paint(fill) {
      bg.clear();
      bg.fillStyle(fill, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bg.lineStyle(2, 0xffffff, 0.6);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    }
    paint(color);
    var text = scene.add.text(0, 0, label, {
      fontFamily: 'Arial', fontSize: '20px', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
    var btn = scene.add.container(x, y, [bg, text]).setSize(w, h).setInteractive({ useHandCursor: true });
    btn.on('pointerover', function () { paint(hoverColor); btn.setScale(1.06); tone(880, 0.05, 'sine', 0.04); });
    btn.on('pointerout', function () { paint(color); btn.setScale(1); });
    btn.on('pointerdown', onClick);
    return btn;
  }
  
  function leave(target) {
    if (leaving || !sceneRef) return;
    leaving = true;
    tone(660, 0.08, 'square', 0.06);
    tone(990, 0.12, 'square', 0.06, 0.08);
    game.log(target === 'Level 1' ? 'Playing again from Level 1!' : 'Returning to the Main Menu.');
    sceneRef.cameras.main.fadeOut(300, 0, 0, 0);
    sceneRef.time.delayedCall(320, function () {
      try { if (audioCtx) audioCtx.close(); } catch (e) {}
      audioCtx = null;
      game.gotoScene(target);
    });
  }
  
  function preload() {
    this.load.spritesheet('robot', game.assets.robotSheet(), { frameWidth: 80, frameHeight: 96 });
  }
  
  function create() {
    var scene = this;
    sceneRef = scene;
    leaving = false;
    W = scene.scale.width;
    H = scene.scale.height;
    makeTextures(scene);
    scene.cameras.main.fadeIn(400, 0, 0, 0);
  
    var groundY = H - 40;
    var titleY = Math.max(70, H * 0.17);
    var platY = H * 0.6;
    var lokiRestY = platY - 48;
    var hintY = platY + 62;
    var btnY = Math.min(H - 45, platY + 125);
  
    var sky = scene.add.graphics().setDepth(-20);
    sky.fillGradientStyle(PALETTE.skyTop, PALETTE.skyTop, PALETTE.skyBottom, PALETTE.skyBottom, 1);
    sky.fillRect(0, 0, W, H);
  
    for (var i = 0; i < 140; i++) {
      var star = scene.add.image(
        Phaser.Math.Between(0, W),
        Phaser.Math.Between(0, groundY - 20),
        'star'
      ).setScale(Phaser.Math.FloatBetween(0.3, 1.1)).setAlpha(Phaser.Math.FloatBetween(0.2, 1)).setDepth(-19);
      scene.tweens.add({
        targets: star,
        alpha: Phaser.Math.FloatBetween(0.1, 1),
        duration: Phaser.Math.Between(600, 2000),
        delay: Phaser.Math.Between(0, 1500),
        yoyo: true,
        repeat: -1,
      });
    }
  
    scene.add.circle(W * 0.85, H * 0.15, 44, 0xfff4d6, 0.12).setDepth(-18);
    scene.add.circle(W * 0.85, H * 0.15, 28, 0xfff4d6).setDepth(-18);
  
    var hills = scene.add.graphics().setDepth(-10);
    hills.fillStyle(PALETTE.hill, 1);
    hills.fillEllipse(W * 0.15, groundY + 10, W * 0.6, 120);
    hills.fillEllipse(W * 0.85, groundY + 16, W * 0.55, 100);
    hills.fillRect(0, groundY, W, H - groundY);
  
    scene.add.rectangle(W / 2, groundY - 6, 110, 12, PALETTE.metal).setStrokeStyle(2, PALETTE.metalLight).setDepth(2);
  
    var rocket = scene.add.image(W / 2, groundY - 12 - 65, 'rocket').setDepth(5);
    var rider = scene.add.sprite(W / 2, rocket.y - 65 - 16, 'robot', 3).setScale(0.5).setDepth(6);
  
    var flame = scene.add.particles(0, 0, 'flame', {
      speed: { min: 60, max: 160 },
      angle: { min: 78, max: 102 },
      scale: { start: 0.9, end: 0 },
      alpha: { start: 1, end: 0 },
      lifespan: { min: 300, max: 600 },
      frequency: 12,
      quantity: 2,
      tint: [0xfff176, 0xffa726, 0xff5722],
      blendMode: 'ADD',
      emitting: false,
    }).setDepth(4);
    flame.startFollow(rocket, 0, 66);
  
    var smoke = scene.add.particles(0, 0, 'puff', {
      speed: { min: 60, max: 180 },
      angle: { min: 190, max: 350 },
      scale: { start: 0.8, end: 2 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 1100,
      gravityY: -20,
      emitting: false,
    }).setDepth(3);
  
    var confetti = scene.add.particles(0, 0, 'confetti', {
      speed: { min: 180, max: 420 },
      angle: { min: 0, max: 360 },
      gravityY: 380,
      rotate: { min: 0, max: 360 },
      scale: { min: 0.8, max: 1.3 },
      lifespan: 2600,
      tint: CONFETTI_COLORS,
      emitting: false,
    }).setDepth(30);
  
    var confettiRain = scene.add.particles(0, -12, 'confetti', {
      x: { min: 0, max: W },
      speedY: { min: 60, max: 130 },
      speedX: { min: -40, max: 40 },
      gravityY: 30,
      rotate: { min: 0, max: 360 },
      scale: { min: 0.6, max: 1.1 },
      lifespan: 6000,
      frequency: 90,
      tint: CONFETTI_COLORS,
      emitting: false,
    }).setDepth(25);
  
    var platGfx = scene.add.graphics();
    platGfx.fillStyle(PALETTE.cyan, 0.2);
    platGfx.fillEllipse(W / 2, platY + 22, 190, 26);
    platGfx.fillStyle(PALETTE.metal, 1);
    platGfx.fillRoundedRect(W / 2 - 75, platY, 150, 16, 4);
    platGfx.fillStyle(PALETTE.metalLight, 1);
    platGfx.fillRect(W / 2 - 73, platY, 146, 4);
    platGfx.fillStyle(PALETTE.cyan, 1);
    [-50, -17, 17, 50].forEach(function (dx) { platGfx.fillCircle(W / 2 + dx, platY + 10, 3); });
    var platform = scene.add.container(0, 0, [platGfx]).setAlpha(0).setDepth(8);
  
    var loki = scene.add.sprite(W / 2, -120, 'robot', 3).setDepth(10).setVisible(false);
  
    scene.input.keyboard.on('keydown-R', function () { leave('Level 1'); });
    scene.input.keyboard.on('keydown-SPACE', function () { leave('Main Menu'); });
    scene.input.keyboard.on('keydown-ENTER', function () { leave('Main Menu'); });
    scene.input.on('pointerdown', function () {
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    });
  
    game.log('Victory! The golden rocket is taking Loki home.');
  
    var startBounce = function () {
      var bounces = 0;
      scene.tweens.add({
        targets: loki,
        y: lokiRestY - 44,
        duration: 360,
        ease: 'Sine.Out',
        yoyo: true,
        repeat: -1,
        onRepeat: function () {
          bounces++;
          if (bounces % 3 === 0) loki.toggleFlipX();
          scene.tweens.add({ targets: loki, scaleX: 1.18, scaleY: 0.84, duration: 70, yoyo: true, ease: 'Power2' });
        },
      });
    };
  
    var showControls = function () {
      var hint = scene.add.text(W / 2, hintY, 'Press R to PLAY AGAIN   ·   Space / Enter for Main Menu', {
        fontFamily: 'Arial', fontSize: '16px', color: '#cfd8ff',
      }).setOrigin(0.5).setDepth(20).setAlpha(0);
      scene.tweens.add({ targets: hint, alpha: 1, duration: 400, onComplete: function () {
        scene.tweens.add({ targets: hint, alpha: 0.45, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
      } });
  
      var playAgain = makeButton(scene, W / 2 - 115, btnY, 200, 48, 'PLAY AGAIN', 0x2e9e4f, 0x3fcf68, function () { leave('Level 1'); });
      var mainMenu = makeButton(scene, W / 2 + 115, btnY, 200, 48, 'MAIN MENU', 0x5a6070, 0x7d8598, function () { leave('Main Menu'); });
      [playAgain, mainMenu].forEach(function (btn, idx) {
        btn.setDepth(20).setAlpha(0);
        btn.y += 20;
        scene.tweens.add({ targets: btn, alpha: 1, y: btnY, duration: 450, delay: idx * 120, ease: 'Back.Out' });
      });
    };
  
    var reveal = function () {
      playFanfare();
      game.log('LOKI MADE IT HOME! All levels complete.');
  
      var title = scene.add.text(W / 2, titleY, 'LOKI MADE IT HOME!', {
        fontFamily: 'Arial Black, Arial',
        fontSize: Math.round(Math.min(56, W / 13)) + 'px',
        color: '#ffd700',
        fontStyle: 'bold',
        stroke: '#6b3a00',
        strokeThickness: 8,
      }).setOrigin(0.5).setDepth(20).setScale(0);
      title.setShadow(0, 4, '#000000', 8, true, true);
      scene.tweens.add({
        targets: title, scale: 1, duration: 600, ease: 'Back.Out',
        onComplete: function () {
          scene.tweens.add({ targets: title, scale: 1.04, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
        },
      });
  
      var subtitle = scene.add.text(W / 2, titleY + 62, 'All levels complete', {
        fontFamily: 'Arial', fontSize: '24px', color: '#fff3c4',
      }).setOrigin(0.5).setDepth(20).setAlpha(0);
      scene.tweens.add({ targets: subtitle, alpha: 1, y: titleY + 52, duration: 500, delay: 350 });
  
      confettiRain.start();
  
      scene.tweens.add({ targets: platform, alpha: 1, duration: 500 });
      loki.setVisible(true);
      scene.tweens.add({ targets: loki, y: lokiRestY, duration: 900, delay: 200, ease: 'Bounce.Out', onComplete: startBounce });
  
      scene.time.delayedCall(900, showControls);
    };
  
    var launch = function () {
      smoke.explode(24, W / 2, groundY - 8);
      tone(70, 1.8, 'sawtooth', 0.1, 0, 520);
      scene.cameras.main.shake(900, 0.006);
      scene.tweens.add({
        targets: [rocket, rider],
        y: '-=' + (H + 260),
        duration: 1900,
        ease: 'Cubic.In',
        onComplete: function () {
          flame.stop();
          rocket.setVisible(false);
          rider.setVisible(false);
        },
      });
      scene.time.delayedCall(1250, function () {
        var y = Phaser.Math.Clamp(rocket.y, 60, H - 60);
        confetti.explode(70, rocket.x, y);
        confetti.explode(35, W * 0.25, y + 40);
        confetti.explode(35, W * 0.75, y + 40);
        tone(1200, 0.08, 'square', 0.05);
        tone(1600, 0.1, 'square', 0.05, 0.06);
      });
      scene.time.delayedCall(1700, reveal);
    };
  
    flame.start();
    tone(60, 0.7, 'sawtooth', 0.05);
    scene.tweens.add({ targets: [rocket, rider], x: '+=2', duration: 40, yoyo: true, repeat: 8 });
    scene.time.delayedCall(700, launch);
  }
  
  window.__phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: game.container,
    width: game.container.clientWidth || 800,
    height: game.container.clientHeight || 600,
    backgroundColor: '#050818',
    scene: { preload: preload, create: create },
  });
}
