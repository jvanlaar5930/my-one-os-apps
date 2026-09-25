function runGameOver(game) {
  // Request: Build the **Game Over** scene now. Use the Approved Plan above for all context — do not ask questions. Scene goal: - A black screen with a red "SYSTEM FAILURE" title that glitches through a flicker tween, and a low descending buzz sound. - Loki is shown in the idle frame, tinted gray and slumped with a slight downward rotation. Small spark particles pop off him. - Two Phaser-drawn buttons: "RETRY" (green) and "MAIN MENU" (gray), both with hover highlight. The R and M keys also work. - Transition: click "RETRY" or press R → game.gotoScene('Level 1') - Transition: click "MAIN MENU" or press M → game.gotoScene('Main Menu')
  if (window.__phaserGame) { window.__phaserGame.destroy(true); window.__phaserGame = null; }
  
  let leaving = false;
  let glitchTimer = null;
  
  const PALETTE = {
    bg: 0x000000,
    title: '#ff2233',
    ghost: '#00e5ff',
    retry: 0x22aa44,
    retryHover: 0x33dd66,
    menu: 0x555566,
    menuHover: 0x8888a0,
    spark: 0xffcc33,
    sparkHot: 0xffffff,
  };
  
  function playBuzz() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 1.4);
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5);
      osc.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 1.5);
    } catch (e) {}
  }
  
  function playClick(freq) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.value = 0.12;
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + 0.12);
    } catch (e) {}
  }
  
  function makeButton(scene, x, y, w, h, label, color, hoverColor, onClick) {
    const bg = scene.add.graphics();
    const draw = (fill, strokeAlpha) => {
      bg.clear();
      bg.fillStyle(fill, 0.9);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, 10);
      bg.lineStyle(2, 0xffffff, strokeAlpha);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 10);
    };
    draw(color, 0.25);
  
    const text = scene.add.text(0, 0, label, {
      fontSize: '22px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold',
    }).setOrigin(0.5);
  
    const container = scene.add.container(x, y, [bg, text]).setDepth(20);
    container.setSize(Math.max(w, 44), Math.max(h, 44)).setInteractive({ useHandCursor: true });
    container.on('pointerover', () => {
      draw(hoverColor, 0.8);
      scene.tweens.add({ targets: container, scale: 1.06, duration: 100, ease: 'Power2' });
    });
    container.on('pointerout', () => {
      draw(color, 0.25);
      scene.tweens.add({ targets: container, scale: 1, duration: 100, ease: 'Power2' });
    });
    container.on('pointerdown', onClick);
    return container;
  }
  
  class GameOverScene extends Phaser.Scene {
    constructor() { super({ key: 'GameOver' }); }
  
    preload() {
      this.load.spritesheet('robot', game.assets.robotSheet(), { frameWidth: 80, frameHeight: 96 });
    }
  
    create() {
      leaving = false;
      const { width, height } = this.scale;
      const cx = width / 2;
  
      const g = this.add.graphics();
      g.fillStyle(PALETTE.sparkHot);
      g.fillCircle(4, 4, 4);
      g.generateTexture('spark', 8, 8);
      g.destroy();
  
      this.cameras.main.setBackgroundColor(PALETTE.bg);
      this.cameras.main.fadeIn(400, 0, 0, 0);
  
      const scan = this.add.graphics().setDepth(1);
      scan.fillStyle(0x220000, 0.35);
      for (let y = 0; y < height; y += 4) scan.fillRect(0, y, width, 1);
  
      const titleY = height * 0.18;
      const titleStyle = { fontSize: '56px', fontFamily: 'Courier New, monospace', fontStyle: 'bold' };
      const ghost = this.add.text(cx, titleY, 'SYSTEM FAILURE', Object.assign({ color: PALETTE.ghost }, titleStyle))
        .setOrigin(0.5).setAlpha(0).setDepth(9);
      const title = this.add.text(cx, titleY, 'SYSTEM FAILURE', Object.assign({ color: PALETTE.title }, titleStyle))
        .setOrigin(0.5).setDepth(10);
  
      this.tweens.add({
        targets: title,
        alpha: { from: 1, to: 0.35 },
        duration: 70,
        yoyo: true,
        repeat: -1,
        repeatDelay: 900,
        ease: 'Stepped',
      });
  
      glitchTimer = this.time.addEvent({
        delay: 140,
        loop: true,
        callback: () => {
          if (Math.random() < 0.3) {
            const dx = Phaser.Math.Between(-8, 8);
            title.x = cx + dx;
            ghost.setAlpha(0.6).setX(cx - dx - 4);
            title.setSkewX ? null : null;
            this.time.delayedCall(60, () => { title.x = cx; ghost.setAlpha(0); });
          }
        },
      });
  
      this.add.text(cx, titleY + 50, 'Loki has powered down.', {
        fontSize: '18px', fontFamily: 'Arial', color: '#aa6666',
      }).setOrigin(0.5).setDepth(10);
  
      const lokiY = height * 0.5;
      const loki = this.add.sprite(cx, lokiY, 'robot', 0)
        .setTint(0x777777)
        .setAngle(12)
        .setScale(1.1, 0.95)
        .setDepth(5);
  
      this.tweens.add({
        targets: loki,
        angle: { from: 12, to: 16 },
        y: lokiY + 4,
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      });
  
      const sparks = this.add.particles(0, 0, 'spark', {
        x: { min: cx - 30, max: cx + 30 },
        y: { min: lokiY - 40, max: lokiY + 10 },
        speed: { min: 60, max: 160 },
        angle: { min: 200, max: 340 },
        gravityY: 400,
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        tint: [PALETTE.spark, PALETTE.sparkHot, 0xff8800],
        lifespan: 450,
        quantity: 3,
        frequency: -1,
      }).setDepth(6);
  
      this.time.addEvent({
        delay: 500,
        loop: true,
        callback: () => {
          if (Math.random() < 0.7) {
            sparks.explode(Phaser.Math.Between(3, 7));
            loki.setTint(0xbbbbbb);
            this.time.delayedCall(50, () => loki.setTint(0x777777));
          }
        },
      });
  
      const btnY = height * 0.78;
      const retry = () => this.leave('Level 1', 660);
      const menu = () => this.leave('Main Menu', 330);
  
      makeButton(this, cx - 120, btnY, 200, 56, 'RETRY', PALETTE.retry, PALETTE.retryHover, retry);
      makeButton(this, cx + 120, btnY, 200, 56, 'MAIN MENU', PALETTE.menu, PALETTE.menuHover, menu);
  
      this.add.text(cx, btnY + 52, '[R] Retry     [M] Main Menu', {
        fontSize: '14px', fontFamily: 'Arial', color: '#777777',
      }).setOrigin(0.5).setDepth(10);
  
      this.input.keyboard.on('keydown-R', retry);
      this.input.keyboard.on('keydown-M', menu);
  
      this.input.once('pointerdown', () => {
        if (this.sound.context && this.sound.context.state === 'suspended') this.sound.context.resume();
      });
  
      playBuzz();
      this.cameras.main.shake(300, 0.01);
      game.log('SYSTEM FAILURE — press R to retry or M for the Main Menu.');
    }
  
    leave(sceneName, freq) {
      if (leaving) return;
      leaving = true;
      if (glitchTimer) { glitchTimer.remove(); glitchTimer = null; }
      playClick(freq);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => game.gotoScene(sceneName));
    }
  }
  
  window.__phaserGame = new Phaser.Game({
    type: Phaser.AUTO,
    parent: game.container,
    width: game.container.clientWidth || 800,
    height: game.container.clientHeight || 600,
    backgroundColor: '#000000',
    scene: [GameOverScene],
  });
}
