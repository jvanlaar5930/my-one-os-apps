export function runMainMenu(game) {
  // Request: I am unable to use controls in the `Main Menu` scene.
  // Main Menu: ECHO PATHS: Temporal Runner
  // Entities: Title, animated timeline streams, buttons
  // Behaviors: Hover scaling, neon glow, scene transitions
  // Controls: Mouse click or Enter key
  
  var _unsub = function() {}; _unsub();
  
  // Scene setup
  game.scene.setBackground('#050510');
  game.scene.addLight('ambient', { color: '#1a1a3a', intensity: 0.6 });
  game.scene.addLight('directional', { color: '#4488ff', intensity: 0.4, position: [0, 10, 5] });
  
  // Animated timeline streams
  var streams = [];
  for (var i = 0; i < 12; i++) {
    var angle = (i / 12) * Math.PI * 2;
    var radius = 15 + Math.random() * 10;
    var x = Math.cos(angle) * radius;
    var z = Math.sin(angle) * radius;
    var stream = game.scene.addEntity({
      name: 'stream_' + i,
      shape: 'plane',
      dims: [0.5, 30],
      color: ['#00ffff', '#ff00ff', '#ffff00'][i % 3],
      position: [x, 0, z],
      rotation: [-Math.PI / 2, angle, 0],
      tags: ['timeline_stream']
    });
    if (stream) {
      streams.push({ id: stream.id, speed: 0.5 + Math.random() * 1.5, offset: Math.random() * 100 });
    }
  }
  
  // Button definitions
  var buttons = [
    { name: 'START RUN', scene: 'Game', y: 0.6 },
    { name: 'ERAS', scene: 'Era Preview', y: -0.1 },
    { name: 'HIGH SCORES', scene: 'High Scores', y: -0.8 },
    { name: 'SETTINGS', scene: 'Settings', y: -1.5 },
    { name: 'QUIT', scene: null, y: -2.2 }
  ];
  
  var hoveredBtn = null;
  
  // HUD update
  _unsub = game.onUpdate(function(dt) {
    game.hud.clear();
    
    // Animate streams
    var t = game.time.elapsed * 0.001;
    streams.forEach(function(s) {
      var ent = game.scene.getEntity(s.id);
      if (!ent || !ent.position) return;
      var pos = ent.position;
      game.scene.setPosition(s.id, [pos[0] + Math.sin(t + s.offset) * 0.02, pos[1], pos[2] + Math.cos(t + s.offset) * 0.02]);
      game.scene.setRotation(s.id, [-Math.PI / 2, t * 0.1 + s.offset, 0]);
    });
  
    // Draw Title
    game.hud.text('ECHO PATHS', game.hud.width / 2, game.hud.height * 0.75, { color: '#00ffff', size: 48, align: 'center', baseline: 'middle' });
    game.hud.text('TEMPORAL RUNNER', game.hud.width / 2, game.hud.height * 0.75 + 40, { color: '#ff00ff', size: 24, align: 'center', baseline: 'middle' });
  
    // Draw Buttons & Handle Hover
    var btnW = 280, btnH = 50, startY = game.hud.height * 0.45;
    var btnRects = [];
    var mp = game.input.mousePos;
    var hasMouse = mp && mp.length >= 2;
    var isMouseDown = game.input.mouseDown === true;
  
    buttons.forEach(function(b, i) {
      var bx = game.hud.width / 2 - btnW / 2;
      var by = startY - i * 80;
      var isHovered = false;
      
      if (hasMouse) {
        isHovered = mp[0] >= bx && mp[0] <= bx + btnW &&
                    mp[1] >= by && mp[1] <= by + btnH;
      }
      
      if (isHovered) {
        hoveredBtn = b.name;
        game.hud.rect(bx, by, btnW, btnH, { fill: 'rgba(20, 20, 40, 0.8)', stroke: '#00ffff', lineWidth: 2 });
        game.hud.text(b.name, game.hud.width / 2, by + btnH / 2, { color: '#ffffff', size: 20, align: 'center', baseline: 'middle' });
      } else {
        game.hud.rect(bx, by, btnW, btnH, { fill: 'rgba(10, 10, 30, 0.6)', stroke: '#444466', lineWidth: 1 });
        game.hud.text(b.name, game.hud.width / 2, by + btnH / 2, { color: '#aaaaaa', size: 20, align: 'center', baseline: 'middle' });
      }
      btnRects.push({ name: b.name, x: bx, y: by, w: btnW, h: btnH });
    });
  
    // Handle Click
    if (isMouseDown && hasMouse) {
      var mx = mp[0], my = mp[1];
      for (var i = 0; i < btnRects.length; i++) {
        var r = btnRects[i];
        if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
          if (buttons[i].scene) {
            game.gotoScene(buttons[i].scene);
          } else {
            game.log('Quit requested');
            // In a real environment, we'd trigger a window close or scene reset
          }
          break;
        }
      }
    }
  
    // Handle Enter key
    if (hoveredBtn && game.input.isDown('Enter')) {
      var idx = buttons.findIndex(function(b) { return b.name === hoveredBtn; });
      if (idx !== -1) {
        if (buttons[idx].scene) {
          game.gotoScene(buttons[idx].scene);
        } else {
          game.log('Quit requested');
        }
      }
    }
  });
}
