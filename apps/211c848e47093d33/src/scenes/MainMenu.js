function runMainMenu(game) {
  // Request: Build the **Main Menu** scene now. Use the Approved Plan above for all context — do not ask questions. Scene goal: - Dark navy-to-purple gradient background with a slowly scrolling starfield and a title "LOKI'S LEAP" in bold cyan text with a gentle bobbing tween. - Loki (built-in robot spritesheet) stands center-screen on a small metal platform, looping the walk1/walk2 frames in place, with a soft glow particle trail under their feet. - UI: a pulsing "PRESS SPACE OR CLICK TO START" prompt, plus a small controls legend (Arrows/WASD to move, Space/Up to jump, stomp monsters from above). - A short synth chime plays on start and the camera fades out. - Transition: Space key press or pointer click → game.gotoScene('Level 1')
  if (window.__phaserGame) { window.__phaserGame.destroy(true); window.__phaserGame = null; }
  
  var studio = game;
  var W = game.container.clientWidth || 800;
  var H = game.container.clientHeight || 600;
  var starting = false;
  var audioCtx = null;
  var starsFar, starsNear;
  
  function getAudio() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return audioCtx;
    } catch (e) { return null; }
  }
  
  function playChime() {
    var ctx = getAudio();
    if (!ctx) return;
    var notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach(function (freq, i) {
      var t = ctx.currentTime + i * 0.09;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }
  
  function makeStarTexture(scene, key, count, maxR) {
    if (scene.textures.exists(key)) return;
    var g = scene.add.graphics();
    for (var i = 0; i < count; i++) {
      g.fillStyle(0xffffff, 0.3 + Math.random() * 0.7);
      g.fillCircle(Math.random() * 256, Math.random() * 256, 0.5 + Math.random() * maxR);
    }
    g.generateTexture(key, 256, 256);
    g.destroy();
  }
  
  function makeGlowTexture(scene) {
    if (scene.textures.exists('glow')) return;
    var g = scene.add.graphics();
    for (var r = 8; r >= 1; r--) {
      g.fillStyle(0xffffff, 0.12);
      g.fillCircle(8, 8, r);
    }
    g.generateTexture('glow', 16, 16);
    g.destroy();
  }
  
  function makePlatformTexture(scene) {
    if (scene.textures.exists('menuPlatform')) return;
    var g = scene.add.graphics();
    g.fillStyle(0x5a6478); g.fillRect(0, 0, 170, 22);
    g.fillStyle(0x9aa6bd); g.fillRect(0, 0, 170, 4);
    g.fillStyle(0x353c4a); g.fillRect(0, 18, 170, 4);
    g.fillStyle(0xc8d0de);
    [10, 50, 85, 120, 160].forEach(function (x) { g.fillCircle(x, 11, 2.5); });
    g.generateTexture('menuPlatform', 170, 22);
    g.destroy();
  }
  
  class MainMenuScene extends Phaser.Scene {
    constructor() { super({ key: 'MainMenu' }); }
  
    preload() {
      this.load.spritesheet('robot', studio.assets.robotSheet(), { frameWidth: 80, frameHeight: 96 });
    }
  
    create() {
      var self = this;
      starting = false;
      W = this.scale.width;
      H = this.scale.height;
      var unit = Math.min(W, H);
  
      makeStarTexture(this, 'starsFar', 70, 1);
      makeStarTexture(this, 'starsNear', 30, 1.8);
      makeGlowTexture(this);
      makePlatformTexture(this);
  
      var bg = this.add.graphics();
      bg.fillGradientStyle(0x0b1030, 0x0b1030, 0x3a1558, 0x3a1558, 1);
      bg.fillRect(0, 0, W, H);
  
      starsFar = this.add.tileSprite(0, 0, W, H, 'starsFar').setOrigin(0).setAlpha(0.55);
      starsNear = this.add.tileSprite(0, 0, W, H, 'starsNear').setOrigin(0).setAlpha(0.85);
  
      var title = this.add.text(W / 2, H * 0.18, "LOKI'S LEAP", {
        fontFamily: 'Arial Black, Arial, sans-serif',
        fontSize: Math.round(unit * 0.12) + 'px',
        fontStyle: 'bold',
        color: '#35e8ff',
        stroke: '#0a2a4a',
        strokeThickness: 6,
      }).setOrigin(0.5);
      title.setShadow(0, 0, '#35e8ff', 18, true, true);
      this.tweens.add({ targets: title, y: title.y - 10, duration: 1400, ease: 'Sine.InOut', yoyo: true, repeat: -1 });
  
      this.add.text(W / 2, H * 0.3, 'Collect the gears, stomp the monsters, and get Loki home.', {
        fontFamily: 'Arial', fontSize: Math.round(unit * 0.032) + 'px', color: '#c9b8ff',
      }).setOrigin(0.5);
  
      var platformY = H * 0.6;
      this.add.image(W / 2, platformY, 'menuPlatform').setOrigin(0.5, 0);
  
      this.add.particles(W / 2, platformY - 2, 'glow', {
        x: { min: -28, max: 28 },
        speedX: { min: -20, max: 20 },
        speedY: { min: -12, max: -36 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.7, end: 0 },
        lifespan: 800,
        frequency: 50,
        blendMode: 'ADD',
        tint: [0x35e8ff, 0x9a6bff],
      });
  
      if (!this.anims.exists('loki-walk')) {
        this.anims.create({
          key: 'loki-walk',
          frames: this.anims.generateFrameNumbers('robot', { start: 1, end: 2 }),
          frameRate: 6,
          repeat: -1,
        });
      }
      var lokiScale = Math.min(1.3, H / 520);
      this.add.sprite(W / 2, platformY, 'robot', 1).setOrigin(0.5, 1).setScale(lokiScale).play('loki-walk');
  
      var prompt = this.add.text(W / 2, H * 0.76, 'PRESS SPACE OR CLICK TO START', {
        fontFamily: 'Arial', fontSize: Math.round(unit * 0.045) + 'px', fontStyle: 'bold', color: '#ffffff',
      }).setOrigin(0.5);
      this.tweens.add({ targets: prompt, alpha: 0.25, scale: 0.96, duration: 800, ease: 'Sine.InOut', yoyo: true, repeat: -1 });
  
      this.add.text(W / 2, H * 0.88, 'Arrows / WASD — Move     Space / Up — Jump\nStomp monsters from above!', {
        fontFamily: 'Arial', fontSize: Math.round(unit * 0.03) + 'px', color: '#8fa3d9', align: 'center', lineSpacing: 6,
      }).setOrigin(0.5);
  
      this.input.setDefaultCursor('pointer');
      this.cameras.main.fadeIn(500, 0, 0, 0);
  
      function startGame() {
        if (starting) return;
        starting = true;
        playChime();
        studio.log("Starting Loki's Leap");
        self.tweens.killTweensOf(prompt);
        prompt.setAlpha(1).setScale(1.1).setColor('#35e8ff');
        self.cameras.main.fadeOut(700, 0, 0, 0);
        self.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, function () {
          studio.gotoScene('Level 1');
        });
      }
  
      this.input.keyboard.on('keydown-SPACE', startGame);
      this.input.on('pointerdown', startGame);
    }
  
    update(time, delta) {
      starsFar.tilePositionX += 0.008 * delta;
      starsFar.tilePositionY -= 0.003 * delta;
      starsNear.tilePositionX += 0.025 * delta;
      starsNear.tilePositionY -= 0.008 * delta;
    }
  }
  
  window.__phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: game.container,
    width: game.container.clientWidth || 800,
    height: game.container.clientHeight || 600,
    backgroundColor: '#0b1030',
    scene: [MainMenuScene],
  });
}
