(function() {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  // Storage helper (supports os.storage if available, falls back to localStorage)
  const storage = (typeof os !== 'undefined' && os.storage) ? os.storage : localStorage;
  
  let rawScore = storage.getItem('rr_highscore');
  let highScore = parseFloat(rawScore) || 0;

  // Game State
  let gameState = 'menu';
  let speed = 3;
  const baseSpeed = 3;
  let score = 0;
  let coinsCollected = 0;
  let startTime = 0;
  let elapsedTime = 0;
  let frameCount = 0;

  // Player (Randy)
  const player = {
    x: 100, y: 0, w: 40, h: 60, vy: 0, grounded: false, color: '#8B4513'
  };
  const gravity = 0.85;
  let groundY = H - 100;
  let jumpCharge = 0;
  let isCharging = false;
  const maxCharge = 25;
  const chargeMultiplier = 0.6;

  // Entities
  let obstacles = [];
  let coinItems = [];

  // Input
  const keys = {};
  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (gameState === 'playing' && player.grounded) {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        jumpCharge = 0;
        isCharging = true;
      }
    }
  });
  window.addEventListener('keyup', e => {
    keys[e.code] = false;
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      if (isCharging && jumpCharge > 0) {
        player.vy = -(jumpCharge * chargeMultiplier);
        player.grounded = false;
      }
      isCharging = false;
      jumpCharge = 0;
    }
  });

  // UI Elements
  const startMenu = document.getElementById('startMenu');
  const gameOverMenu = document.getElementById('gameOverMenu');
  const goTime = document.getElementById('goTime');
  const goCoins = document.getElementById('goCoins');
  const goScore = document.getElementById('goScore');
  const goHighScore = document.getElementById('goHighScore');

  function startGame() {
    gameState = 'playing';
    score = 0;
    coinsCollected = 0;
    speed = baseSpeed;
    startTime = Date.now();
    elapsedTime = 0;
    obstacles = [];
    coinItems = [];
    player.y = groundY - player.h;
    player.vy = 0;
    player.grounded = true;
    startMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    requestAnimationFrame(gameLoop);
  }

  document.getElementById('startBtn').onclick = startGame;
  document.getElementById('restartBtn').onclick = startGame;

  function spawnObstacle() {
    const type = Math.random() > 0.4 ? 'cactus' : 'rock';
    const w = type === 'cactus' ? 35 + Math.random()*20 : 40 + Math.random()*30;
    const h = type === 'cactus' ? 60 + Math.random()*50 : 30 + Math.random()*25;
    obstacles.push({ x: W, y: groundY - h, w, h, type });
  }

  function spawnCoin() {
    const tier = Math.random();
    let size, val, color;
    if (tier < 0.1) { // Large rare
      size = 28; val = 10; color = '#FFD700';
    } else if (tier < 0.35) { // Medium rare
      size = 20; val = 5; color = '#C0C0C0';
    } else { // Small common
      size = 14; val = 1; color = '#DAA520';
    }
    const y = groundY - 50 - Math.random() * 100;
    coinItems.push({ x: W, y, size, val, color });
  }

  function update() {
    if (gameState !== 'playing') return;

    // Score & Speed progression
    score += speed * 0.08;
    const newSpeed = baseSpeed + Math.floor(score / 200);
    if (newSpeed > speed) speed = newSpeed;

    elapsedTime = (Date.now() - startTime) / 1000;

    // Player physics
    player.vy += gravity;
    player.y += player.vy;
    if (player.y >= groundY - player.h) {
      player.y = groundY - player.h;
      player.vy = 0;
      player.grounded = true;
    }

    // Charge jump while grounded and space is held
    if (isCharging && player.grounded && jumpCharge < maxCharge) {
      jumpCharge += 1;
    }

    // Obstacles
    const obsInterval = Math.max(40, 130 - speed * 6);
    if (frameCount % Math.floor(obsInterval) === 0) spawnObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
      let o = obstacles[i];
      o.x -= speed;
      if (o.x + o.w < -50) obstacles.splice(i, 1);
      
      // Collision
      if (player.x < o.x + o.w - 8 && player.x + player.w > o.x + 8 &&
          player.y < o.y + o.h - 8 && player.y + player.h > o.y + 8) {
        gameOver();
        return;
      }
    }

    // Coins
    const coinInterval = Math.max(25, 90 - speed * 4);
    if (frameCount % Math.floor(coinInterval) === 0) spawnCoin();
    for (let i = coinItems.length - 1; i >= 0; i--) {
      let c = coinItems[i];
      c.x -= speed;
      if (c.x + c.size < -20) coinItems.splice(i, 1);
      
      // Collision
      const dx = (player.x + player.w/2) - (c.x + c.size/2);
      const dy = (player.y + player.h/2) - (c.y + c.size/2);
      if (Math.sqrt(dx*dx + dy*dy) < c.size + 10) {
        coinsCollected += c.val;
        coinItems.splice(i, 1);
      }
    }

    frameCount++;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Sky gradient
    const grad = ctx.createLinearGradient(0, 0, 0, groundY);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#F4A460');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, groundY);

    // Ground
    ctx.fillStyle = '#d2b48c';
    ctx.fillRect(0, groundY, W, H - groundY);
    ctx.fillStyle = '#c2a47c';
    ctx.fillRect(0, groundY, W, 10);

    // Player (Randy)
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    // Hat
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(player.x - 6, player.y - 12, player.w + 12, 12);
    ctx.fillRect(player.x + 8, player.y - 22, player.w - 16, 10);
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(player.x + 25, player.y + 15, 4, 4);

    // Obstacles
    for (let o of obstacles) {
      if (o.type === 'cactus') {
        ctx.fillStyle = '#228B22';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillRect(o.x - 12, o.y + 25, 12, 35);
        ctx.fillRect(o.x + o.w, o.y + 45, 12, 30);
      } else {
        ctx.fillStyle = '#696969';
        ctx.beginPath();
        ctx.arc(o.x + o.w/2, o.y + o.h/2, o.w/2, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Coins
    for (let c of coinItems) {
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(c.x + c.size/2, c.y + c.size/2, c.size/2, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#B8860B';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 10, 220, 90);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(`Score: ${Math.floor(score)}`, 20, 40);
    ctx.fillText(`Coins: ${coinsCollected}`, 20, 70);
    ctx.fillText(`Speed: x${speed.toFixed(1)}`, 20, 100);
  }

  function gameOver() {
    gameState = 'over';
    const finalScore = Math.floor(elapsedTime * coinsCollected);
    
    if (finalScore > highScore) {
      highScore = finalScore;
      storage.setItem('rr_highscore', highScore.toString());
    }

    goTime.textContent = `Time Survived: ${elapsedTime.toFixed(2)}s`;
    goCoins.textContent = `Coins Collected: ${coinsCollected}`;
    goScore.textContent = `Final Score: ${finalScore}`;
    goHighScore.textContent = `Best Score: ${Math.floor(highScore)}`;
    
    gameOverMenu.classList.remove('hidden');
  }

  function gameLoop() {
    if (gameState === 'playing') {
      update();
      draw();
      requestAnimationFrame(gameLoop);
    }
  }

  // Initial render
  groundY = H - 100;
  player.y = groundY - player.h;
  draw();
})();