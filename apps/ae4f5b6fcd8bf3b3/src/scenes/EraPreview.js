export function runEraPreview(game) {
  // Request: - Entities: Four era cards (Neon Metropolis, Crystal Geodes, Floating Archipelago, The Void) with color swatches and descriptions. Padlock overlays for locked eras. Back button. - Behaviors: Cards highlight on hover. Unlocked eras display "Available" text. Locked eras display "Reach [Score] pts to unlock". Back button returns to Main Menu. - Controls: Mouse click to view era details, Back button to navigate.
  var highScore = parseInt(localStorage.getItem('oneos_high_score') || '0', 10);
  
  var eras = [
    { name: 'Neon Metropolis', color: '#ff00ff', desc: 'A cyberpunk cityscape of neon lights and rain-slicked streets.', unlockReq: 0 },
    { name: 'Crystal Geodes', color: '#00ffff', desc: 'Glowing caverns filled with resonant crystalline structures.', unlockReq: 500 },
    { name: 'Floating Archipelago', color: '#00ff00', desc: 'Islands suspended in a sky of swirling auroras.', unlockReq: 1500 },
    { name: 'The Void', color: '#888888', desc: 'An endless expanse of shifting darkness and echoes.', unlockReq: 3000 }
  ];
  
  eras.forEach(function(e) { e.unlocked = highScore >= e.unlockReq; });
  
  var hoveredCard = 0;
  var backHovered = false;
  var lastActivation = 0;
  
  var _unsub = function() {}; _unsub();
  _unsub = game.onUpdate(function(dt) {
    game.hud.clear();
    var w = game.hud.width, h = game.hud.height;
    
    // Background
    game.hud.rect(0, 0, w, h, { fill: '#0a0a1a' });
    
    // Title
    game.hud.text('SELECT ERA', w/2, 60, { color: '#ffffff', size: 32, align: 'center' });
    
    // Cards
    var cardW = 180, cardH = 240, gap = 20;
    var totalW = eras.length * cardW + (eras.length - 1) * gap;
    var startX = (w - totalW) / 2;
    var startY = 120;
    
    for (var i = 0; i < eras.length; i++) {
      var ex = startX + i * (cardW + gap);
      var ey = startY;
      var isHovered = (i === hoveredCard);
      
      // Card background
      game.hud.rect(ex, ey, cardW, cardH, { fill: isHovered ? '#2a2a4e' : '#1a1a2e', stroke: isHovered ? '#ffffff' : '#333355', lineWidth: 2 });
      
      // Color swatch
      game.hud.rect(ex + 10, ey + 10, cardW - 20, 100, { fill: eras[i].color });
      
      // Era name
      game.hud.text(eras[i].name, ex + cardW/2, ey + 130, { color: '#ffffff', size: 18, align: 'center' });
      
      // Status text
      var statusText = eras[i].unlocked ? 'AVAILABLE' : 'REACH ' + eras[i].unlockReq + ' PTS';
      var statusColor = eras[i].unlocked ? '#44ff44' : '#ff4444';
      game.hud.text(statusText, ex + cardW/2, ey + 160, { color: statusColor, size: 14, align: 'center' });
      
      // Lock overlay
      if (!eras[i].unlocked) {
        game.hud.rect(ex, ey, cardW, cardH, { fill: 'rgba(0,0,0,0.6)' });
        game.hud.text('🔒', ex + cardW/2, ey + cardH/2, { color: '#ffffff', size: 40, align: 'center', baseline: 'middle' });
      }
      
      // Store bounds for potential future mouse integration
      eras[i].bounds = { x: ex, y: ey, w: cardW, h: cardH };
    }
    
    // Back Button
    var btnW = 160, btnH = 40;
    var btnX = (w - btnW) / 2, btnY = h - 80;
    game.hud.rect(btnX, btnY, btnW, btnH, { fill: backHovered ? '#3a3a6e' : '#2a2a4e', stroke: '#5555aa', lineWidth: 2 });
    game.hud.text('BACK', btnX + btnW/2, btnY + btnH/2, { color: '#ffffff', size: 18, align: 'center', baseline: 'middle' });
    
    // Keyboard Navigation
    if (game.input.isDown('ArrowRight')) { hoveredCard = (hoveredCard + 1) % eras.length; backHovered = false; }
    if (game.input.isDown('ArrowLeft')) { hoveredCard = (hoveredCard - 1 + eras.length) % eras.length; backHovered = false; }
    if (game.input.isDown('ArrowDown')) { backHovered = true; hoveredCard = -1; }
    if (game.input.isDown('ArrowUp')) { backHovered = false; hoveredCard = 0; }
    
    // Activation (with debounce)
    if ((game.input.isDown('Enter') || game.input.isDown(' ')) && (game.time.elapsed - lastActivation) > 300) {
      lastActivation = game.time.elapsed;
      if (backHovered) {
        game.gotoScene('Main Menu');
      } else if (eras[hoveredCard].unlocked) {
        game.log('Selected: ' + eras[hoveredCard].name);
        // game.gotoScene('Game'); // Uncomment to launch era directly
      } else {
        game.log('Era locked! Reach ' + eras[hoveredCard].unlockReq + ' pts to unlock.');
      }
    }
  });
}
