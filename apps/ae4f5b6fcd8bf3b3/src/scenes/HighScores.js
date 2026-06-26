export function runHighScores(game) {
  // Request: - Entities: List of top 5 local runs with score, distance, and era reached; Back button. - Behaviors: Sorts runs by score descending. Displays era icons next to each run. Back button returns to Main Menu. - Controls: Mouse click on Back button to navigate.
  var _unsub = function() {}; _unsub();
  _unsub = game.onUpdate(function(dt) {
    game.hud.clear();
    game.scene.setBackground('#050510');
  
    var saved = localStorage.getItem('oneos_high_scores');
    var scores = saved ? JSON.parse(saved) : [];
    if (scores.length === 0) {
      scores = [
        { score: 1250, distance: 450, era: 'Neon Metropolis' },
        { score: 980, distance: 320, era: 'Crystal Geodes' },
        { score: 750, distance: 210, era: 'Floating Archipelago' },
        { score: 500, distance: 150, era: 'The Void' },
        { score: 200, distance: 80, era: 'Neon Metropolis' }
      ];
    }
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 5);
  
    game.hud.text('HIGH SCORES', game.hud.width / 2, 100, { color: '#00ffff', size: 48, align: 'center', baseline: 'middle' });
  
    var eraIcons = { 'Neon Metropolis': '🌃', 'Crystal Geodes': '💎', 'Floating Archipelago': '🏝️', 'The Void': '🌌' };
    var startY = 180;
    var lineHeight = 60;
  
    scores.forEach(function(run, i) {
      var y = startY + i * lineHeight;
      var icon = eraIcons[run.era] || '📊';
      game.hud.text('#' + (i + 1), 40, y, { color: '#888', size: 24, baseline: 'middle' });
      game.hud.text(icon, 100, y, { color: '#fff', size: 24, baseline: 'middle' });
      game.hud.text(run.era, 140, y, { color: '#aaa', size: 20, baseline: 'middle' });
      game.hud.text('Dist: ' + run.distance + 'm', 350, y, { color: '#aaa', size: 20, baseline: 'middle' });
      game.hud.text('Score: ' + run.score, 550, y, { color: '#00ffff', size: 22, align: 'right', baseline: 'middle' });
      game.hud.rect(20, y + 30, game.hud.width - 40, 1, { fill: '#222' });
    });
  
    var btnX = game.hud.width / 2 - 80;
    var btnY = game.hud.height - 100;
    var btnW = 160;
    var btnH = 50;
    
    var mx = game.input.mousePos ? game.input.mousePos[0] : -1;
    var my = game.input.mousePos ? game.input.mousePos[1] : -1;
    var isHover = mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH;
    
    game.hud.rect(btnX, btnY, btnW, btnH, { fill: isHover ? '#00ffff' : '#111', stroke: '#00ffff', lineWidth: 2 });
    game.hud.text('BACK', game.hud.width / 2, btnY + btnH / 2, { color: isHover ? '#000' : '#fff', size: 20, align: 'center', baseline: 'middle' });
    
    if (isHover && game.input.isDown('left')) {
      game.gotoScene('Main Menu');
    }
  });
  
  var unsubEsc = game.input.onKey('Escape', function(ev) { if (ev === 'press') game.gotoScene('Main Menu'); });
  var unsubB = game.input.onKey('b', function(ev) { if (ev === 'press') game.gotoScene('Main Menu'); });
}
