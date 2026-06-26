(function () {
  'use strict';

  var THREE = window.THREE;
  if (!THREE) { console.error('[Game] THREE not found'); return; }

  var canvas = document.getElementById('game-canvas');
  if (!canvas) { console.error('[Game] canvas#game-canvas not found'); return; }

  var scene = new THREE.Scene();
  scene.background = new THREE.Color('#1a1a2e');

  var camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio || 1);
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

  // Default lights
  scene.add(new THREE.AmbientLight('#ffffff', 0.6));
  var dirLight = new THREE.DirectionalLight('#ffffff', 0.8);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  var entityMap = {};
  var idCounter = 0;
  var updateHandlers = [];
  var fixedHandlers = [];
  var keyHandlers = {};
  var keysDown = {};
  var logHandlers = [];
  var followTarget = null;
  var followOffset = [0, 5, 10];
  var elapsed = 0, delta = 0, frame = 0, lastTime = 0;

  window.addEventListener('keydown', function(e) {
    keysDown[e.key] = true;
    (keyHandlers[e.key] || []).forEach(function(h) { h('press'); });
  });
  window.addEventListener('keyup', function(e) {
    delete keysDown[e.key];
    (keyHandlers[e.key] || []).forEach(function(h) { h('release'); });
  });

  function findEntity(idOrName) {
    if (entityMap[idOrName]) return entityMap[idOrName];
    for (var k in entityMap) {
      if (entityMap[k].name === idOrName) return entityMap[k];
    }
    return null;
  }

  function buildGeometry(shape, dims) {
    dims = dims || [];
    switch (shape) {
      case 'sphere':   return new THREE.SphereGeometry(dims[0]||0.5, 16, 16);
      case 'plane':    return new THREE.PlaneGeometry(dims[0]||1, dims[1]||1);
      case 'cylinder': return new THREE.CylinderGeometry(dims[0]||0.5, dims[1]||0.5, dims[2]||1, 16);
      default:         return new THREE.BoxGeometry(dims[0]||1, dims[1]||1, dims[2]||1);
    }
  }

  window.game = {
    scene: {
      addEntity: function(opts) {
        var id = 'e' + (++idCounter);
        var geo = buildGeometry(opts.shape || 'box', opts.dims);
        var mat = new THREE.MeshStandardMaterial({ color: opts.color || '#888888' });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.name = opts.name;
        if (opts.position) mesh.position.set(opts.position[0], opts.position[1], opts.position[2]);
        if (opts.rotation) mesh.rotation.set(opts.rotation[0], opts.rotation[1], opts.rotation[2]);
        if (opts.scale)    mesh.scale.set(opts.scale[0], opts.scale[1], opts.scale[2]);
        scene.add(mesh);
        entityMap[id] = { id: id, name: opts.name, shape: opts.shape||'box', mesh: mesh, tags: opts.tags || [] };
        return { id: id, name: opts.name };
      },
      removeEntity: function(idOrName) {
        var e = findEntity(idOrName);
        if (!e) return;
        scene.remove(e.mesh);
        delete entityMap[e.id];
      },
      getEntity: function(idOrName) {
        var e = findEntity(idOrName);
        if (!e) return undefined;
        var p = e.mesh.position;
        return { id: e.id, name: e.name, position: [p.x, p.y, p.z], tags: e.tags.slice() };
      },
      getByTag: function(tag) {
        return Object.values(entityMap).filter(function(e) { return e.tags.indexOf(tag) >= 0; })
          .map(function(e) { return { id: e.id, name: e.name }; });
      },
      setBackground: function(hex) { scene.background = new THREE.Color(hex); },
      setPosition: function(idOrName, pos) {
        var e = findEntity(idOrName);
        if (!e) return;
        e.mesh.position.set(pos[0], pos[1], pos[2]);
      },
      setRotation: function(idOrName, rot) {
        var e = findEntity(idOrName);
        if (!e) return;
        e.mesh.rotation.set(rot[0], rot[1], rot[2]);
      },
      setScale: function(idOrName, scl) {
        var e = findEntity(idOrName);
        if (!e) return;
        e.mesh.scale.set(scl[0], scl[1], scl[2]);
      },
      setTexture: function(idOrName, url, opts) {
        var e = findEntity(idOrName);
        if (!e) return;
        new THREE.TextureLoader().load(url, function(tex) {
          if (opts && opts.repeat) {
            tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
            tex.repeat.set(opts.repeat[0], opts.repeat[1]);
          }
          if (e.mesh.material) {
            e.mesh.material.map = tex;
            e.mesh.material.needsUpdate = true;
          }
        });
      },
      addLight: function(type, opts) {
        opts = opts || {};
        var color = opts.color || '#ffffff';
        var intensity = opts.intensity !== undefined ? opts.intensity : 1;
        var light;
        if (type === 'ambient') light = new THREE.AmbientLight(color, intensity);
        else if (type === 'point') light = new THREE.PointLight(color, intensity);
        else light = new THREE.DirectionalLight(color, intensity);
        if (opts.position) light.position.set(opts.position[0], opts.position[1], opts.position[2]);
        scene.add(light);
      },
      clear: function() {
        while (scene.children.length) scene.remove(scene.children[0]);
        entityMap = {};
      },
    },
    camera: {
      setPosition: function(x, y, z) { camera.position.set(x, y, z); },
      lookAt: function(x, y, z) { camera.lookAt(x, y, z); },
      follow: function(idOrName, offset) { followTarget = idOrName; if (offset) followOffset = offset; },
      stopFollowing: function() { followTarget = null; },
    },
    input: {
      isDown: function(key) { return !!keysDown[key]; },
      onKey: function(key, handler) {
        if (!keyHandlers[key]) keyHandlers[key] = [];
        keyHandlers[key].push(handler);
        return function() {
          keyHandlers[key] = (keyHandlers[key] || []).filter(function(h) { return h !== handler; });
        };
      },
    },
    physics: {
      checkAABB: function(a, b) {
        var ea = findEntity(a), eb = findEntity(b);
        if (!ea || !eb) return false;
        var ba = new THREE.Box3().setFromObject(ea.mesh);
        var bb = new THREE.Box3().setFromObject(eb.mesh);
        return ba.intersectsBox(bb);
      },
      findOverlapping: function(entityId, tag) {
        var src = findEntity(entityId);
        if (!src) return [];
        var ba = new THREE.Box3().setFromObject(src.mesh);
        return Object.values(entityMap).filter(function(e) {
          if (e.id === src.id) return false;
          if (tag && e.tags.indexOf(tag) < 0) return false;
          return ba.intersectsBox(new THREE.Box3().setFromObject(e.mesh));
        }).map(function(e) { return e.id; });
      },
    },
    onUpdate: function(handler) {
      updateHandlers.push(handler);
      return function() { updateHandlers = updateHandlers.filter(function(h) { return h !== handler; }); };
    },
    onFixedUpdate: function(intervalMs, handler) {
      var entry = { interval: intervalMs, handler: handler, acc: 0 };
      fixedHandlers.push(entry);
      return function() { fixedHandlers = fixedHandlers.filter(function(e) { return e !== entry; }); };
    },
    time: {
      get elapsed() { return elapsed; },
      get delta() { return delta; },
      get frame() { return frame; },
    },
    log: function(msg) {
      logHandlers.forEach(function(h) { h(msg); });
      console.log('[Game]', msg);
    },

    gotoScene: function(sceneName) {
      gotoSceneHandlers.forEach(function(h) { h(sceneName); });
    },

    hud: (function() {
      var hudCanvas = document.createElement('canvas');
      hudCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
      if (canvas.parentElement) canvas.parentElement.appendChild(hudCanvas);
      var ctx = hudCanvas.getContext('2d');
      new ResizeObserver(function() {
        hudCanvas.width = canvas.clientWidth;
        hudCanvas.height = canvas.clientHeight;
      }).observe(canvas);
      hudCanvas.width = canvas.clientWidth || 800;
      hudCanvas.height = canvas.clientHeight || 600;
      return {
        clear: function() { ctx.clearRect(0, 0, hudCanvas.width, hudCanvas.height); },
        text: function(text, x, y, opts) {
          opts = opts || {};
          ctx.save();
          ctx.fillStyle = opts.color || '#ffffff';
          ctx.font = (opts.size || 18) + 'px ' + (opts.font || "'Segoe UI', system-ui, sans-serif");
          ctx.textAlign = opts.align || 'left';
          ctx.textBaseline = opts.baseline || 'top';
          ctx.fillText(text, x, y);
          ctx.restore();
        },
        rect: function(x, y, w, h, opts) {
          opts = opts || {};
          ctx.save();
          if (opts.fill) { ctx.fillStyle = opts.fill; ctx.fillRect(x, y, w, h); }
          if (opts.stroke) { ctx.strokeStyle = opts.stroke; ctx.lineWidth = opts.lineWidth || 1; ctx.strokeRect(x, y, w, h); }
          ctx.restore();
        },
        circle: function(x, y, r, opts) {
          opts = opts || {};
          ctx.save();
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          if (opts.fill) { ctx.fillStyle = opts.fill; ctx.fill(); }
          if (opts.stroke) { ctx.strokeStyle = opts.stroke; ctx.lineWidth = opts.lineWidth || 1; ctx.stroke(); }
          ctx.restore();
        },
        get width() { return hudCanvas.width; },
        get height() { return hudCanvas.height; },
      };
    })(),
  };

  var gotoSceneHandlers = [];
  // scene registry — populated by the published game bundle
  window.__gameScenes = window.__gameScenes || {};
  window.game.onGotoScene = function(handler) {
    gotoSceneHandlers.push(handler);
    return function() { gotoSceneHandlers = gotoSceneHandlers.filter(function(h) { return h !== handler; }); };
  };

  var resizeObserver = new ResizeObserver(function() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  });
  resizeObserver.observe(canvas);

  function loop(now) {
    requestAnimationFrame(loop);
    delta = lastTime ? Math.min((now - lastTime) / 1000, 0.1) : 0;
    lastTime = now;
    elapsed += delta;
    frame++;

    if (followTarget) {
      var te = findEntity(followTarget);
      if (te) {
        var p = te.mesh.position;
        camera.position.x += (p.x + followOffset[0] - camera.position.x) * 0.1;
        camera.position.y += (p.y + followOffset[1] - camera.position.y) * 0.1;
        camera.position.z += (p.z + followOffset[2] - camera.position.z) * 0.1;
        camera.lookAt(p.x, p.y, p.z);
      }
    }

    var dtMs = delta * 1000;
    updateHandlers.forEach(function(h) { h(dtMs); });
    fixedHandlers.forEach(function(e) {
      e.acc += dtMs;
      while (e.acc >= e.interval) { e.handler(); e.acc -= e.interval; }
    });

    renderer.render(scene, camera);
  }

  // Internal reset — clears all handlers and entities; used by gotoScene
  window.game._reset = function() {
    updateHandlers = [];
    fixedHandlers = [];
    keyHandlers = {};
    keysDown = {};
    followTarget = null;
    while (scene.children.length) scene.remove(scene.children[0]);
    entityMap = {};
    window.game.hud.clear();
    // Re-add default lights so each scene starts lit
    scene.add(new THREE.AmbientLight('#ffffff', 0.6));
    var dl = new THREE.DirectionalLight('#ffffff', 0.8);
    dl.position.set(5, 10, 5);
    scene.add(dl);
  };

  requestAnimationFrame(loop);
})();

if (!window.game) { console.error('[Game] Bootstrap failed — THREE.js may not have loaded.'); }
else {

// ─── Scene manager ───────────────────────────────────────────────────────────
var _scenes = {};

window.game.gotoScene = function(name) {
  window.game._reset();
  var fn = _scenes[name];
  if (fn) {
    try { fn(); } catch(e) { window.game.log('Scene error: ' + e.message); console.error(e); }
  } else {
    console.warn('[Game] Unknown scene:', name);
  }
};

// ─── Scene definitions ───────────────────────────────────────────────────────
_scenes["Main Menu"] = function() {
  // I am unable to use controls in the `Main Menu` scene.
  (function(game){
  "use strict";
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
  })(window.game);
};

_scenes["Settings"] = function() {
  // (empty scene)
};

_scenes["Era Preview"] = function() {
  // - Entities: Four era cards (Neon Metropolis, Crystal Geodes, Floating Archipelago, The Void) with color swatches and descriptions. Padlock overlays for locked eras. Back button. - Behaviors: Cards highlight on hover. Unlocked eras display "Available" text. Locked eras display "Reach [Score] pts to unlock". Back button returns to Main Menu. - Controls: Mouse click to view era details, Back button to navigate.
  (function(game){
  "use strict";
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
  })(window.game);
};

_scenes["High Scores"] = function() {
  // - Entities: List of top 5 local runs with score, distance, and era reached; Back button. - Behaviors: Sorts runs by score descending. Displays era icons next to each run. Back button returns to Main Menu. - Controls: Mouse click on Back button to navigate.
  (function(game){
  "use strict";
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
  })(window.game);
};

_scenes["Game"] = function() {
  // Game scene is throwing error:  2026-06-26T18:33:48.349Z ERROR [game] Cannot read properties of undefined (reading '2')
  (function(game){
  "use strict";
  // ECHO PATHS: Temporal Runner - Game Scene
  // Auto-runner with temporal mechanics, era shifts, and echo paths.
  
  if (!game.scene.getEntity('player')) {
    game.scene.addEntity({ name: 'player', shape: 'cylinder', dims: [0.4, 1.8, 0.4], color: '#00ccff', position: [0, 0.9, 0], tags: ['player'] });
    game.scene.addEntity({ name: 'player_glow', shape: 'sphere', dims: [0.6], color: '#00ffff', position: [0, 0.9, 0], tags: ['player'] });
    game.scene.setMaterial('player_glow', { opacity: 0.3, emissive: '#00ffff' });
    game.scene.setBackground('#0a0a1a');
    game.scene.addLight('ambient', { color: '#88aaff', intensity: 0.6 });
    game.scene.addLight('directional', { color: '#ffffff', intensity: 0.8, position: [5, 10, 5] });
  }
  
  // Background music loop
  var stopMusic = game.audio.play('https://cdn.pixabay.com/audio/2022/10/25/audio_104776671c.mp3', { loop: true, volume: 0.3 });
  
  game.camera.setPosition(0, 6, 10);
  game.camera.lookAt(0, 1, 0);
  
  // Game State
  var score = 0, distance = 0, era = 0, speed = 8, maxSpeed = 18;
  var timeScale = 1, phaseActive = false, phaseTimer = 0;
  var echoActive = false, echoTimer = 0, echoDuration = 15;
  var isPaused = false, gameOver = false;
  var velY = 0, onGround = true, isSliding = false, slideTimer = 0;
  var dodgeDir = 0, dodgeTimer = 0, dodgeCooldown = 0;
  var lastMilestone = 0, echoCooldown = 0;
  var groundZ = 0, obstacleZ = 0, echoZ = 0, orbZ = 0;
  var GRAVITY = -25, JUMP_FORCE = 10, GROUND_Y = 0;
  
  // Era Definitions
  var ERAS = [
    { name: 'Neon Metropolis', bg: '#0a0a1a', ground: '#1a1a2e', obsColor: '#ff0055', obsShape: 'box', density: 0.02 },
    { name: 'Crystal Geodes', bg: '#1a0a2e', ground: '#2e1a4e', obsColor: '#aa00ff', obsShape: 'sphere', density: 0.025 },
    { name: 'Floating Archipelago', bg: '#0a1a2e', ground: '#1a3a5e', obsColor: '#00ffaa', obsShape: 'cylinder', density: 0.03 },
    { name: 'The Void', bg: '#000000', ground: '#111111', obsColor: '#ffffff', obsShape: 'box', density: 0.035 }
  ];
  
  function spawnGround(z) {
    if (game.scene.getEntity('ground_' + Math.floor(z))) return;
    game.scene.addEntity({ name: 'ground_' + Math.floor(z), shape: 'plane', dims: [20, 10], color: ERAS[era].ground, position: [0, GROUND_Y - 0.1, z], rotation: [-Math.PI / 2, 0, 0], tags: ['ground'] });
  }
  function spawnObstacle(z) {
    var e = ERAS[era];
    var x = (Math.random() - 0.5) * 14;
    var y = e.obsShape === 'sphere' ? 0.5 : 0.5;
    var s = e.obsShape === 'box' ? [1.2, 1.2, 1.2] : e.obsShape === 'sphere' ? [0.6] : [0.6, 1.5, 0.6];
    game.scene.addEntity({ name: 'obs_' + z.toFixed(1), shape: e.obsShape, dims: s, color: e.obsColor, position: [x, y, z], tags: ['obstacle'] });
  }
  function spawnEcho(z) {
    game.scene.addEntity({ name: 'echo_' + z.toFixed(1), shape: 'box', dims: [1.5, 0.1, 1.5], color: '#00ffff', position: [0, 0.2, z], tags: ['echo'] });
    game.scene.setMaterial('echo_' + z.toFixed(1), { opacity: 0.8, emissive: '#00ffff' });
  }
  function spawnOrb(z) {
    game.scene.addEntity({ name: 'orb_' + z.toFixed(1), shape: 'sphere', dims: [0.4], color: '#ffcc00', position: [(Math.random()-0.5)*10, 1.5, z], tags: ['orb'] });
  }
  
  // Initial Ground & Obstacles
  for (var i = 0; i < 10; i++) spawnGround(i * 10);
  for (var i = 0; i < 5; i++) spawnObstacle(20 + i * 15);
  for (var i = 0; i < 3; i++) spawnOrb(30 + i * 20);
  
  var _unsub = function() {}; _unsub();
  _unsub = game.onUpdate(function(dt) {
    if (isPaused || gameOver) return;
    
    var s = dt / 1000;
    var p = game.scene.getEntity('player');
    if (!p) return;
  
    // Time Scale (Thread Pull)
    var targetTimeScale = game.input.isDown('Shift') ? 0.6 : 1;
    timeScale += (targetTimeScale - timeScale) * 5 * s;
    
    // Phase Shift
    if (phaseActive) {
      phaseTimer -= s;
      game.scene.setMaterial('player', { opacity: 0.4 });
      game.scene.setMaterial('player_glow', { opacity: 0.6 });
      if (phaseTimer <= 0) {
        phaseActive = false;
        game.scene.setMaterial('player', { opacity: 1 });
        game.scene.setMaterial('player_glow', { opacity: 0.3 });
      }
    }
  
    // Auto Forward
    var moveZ = speed * timeScale * s;
    distance += moveZ;
    game.scene.setPosition('player', [p.position[0], p.position[1], p.position[2] + moveZ]);
    game.scene.setPosition('player_glow', [p.position[0], p.position[1], p.position[2]]);
  
    // Dodge
    if (dodgeTimer > 0) {
      dodgeTimer -= s;
      p.position[0] += dodgeDir * 12 * s;
    } else if (dodgeCooldown > 0) {
      dodgeCooldown -= s;
    } else {
      if (game.input.isDown('a') || game.input.isDown('ArrowLeft'))  { dodgeDir = -1; dodgeTimer = 0.3; dodgeCooldown = 0.4; }
      if (game.input.isDown('d') || game.input.isDown('ArrowRight')) { dodgeDir = 1;  dodgeTimer = 0.3; dodgeCooldown = 0.4; }
    }
  
    // Jump & Gravity
    if ((game.input.isDown('w') || game.input.isDown('ArrowUp') || game.input.isDown(' ')) && onGround) {
      velY = JUMP_FORCE;
      onGround = false;
    }
    velY += GRAVITY * timeScale * s;
    p.position[1] += velY * s;
    if (p.position[1] <= GROUND_Y) { p.position[1] = GROUND_Y; velY = 0; onGround = true; }
  
    // Slide
    if (game.input.isDown('s') || game.input.isDown('ArrowDown')) {
      if (!isSliding) { isSliding = true; slideTimer = 0.5; game.scene.setScale('player', [1, 0.5, 1]); }
    }
    if (isSliding) {
      slideTimer -= s;
      if (slideTimer <= 0) { isSliding = false; game.scene.setScale('player', [1, 1, 1]); }
    }
  
    // Spawn Logic
    groundZ = Math.floor(p.position[2] / 10) * 10;
    if (groundZ > obstacleZ - 50) {
      spawnGround(groundZ + 10);
      obstacleZ = groundZ + 10;
      if (Math.random() < ERAS[era].density) spawnObstacle(obstacleZ + 15);
      if (Math.random() < 0.005) spawnOrb(obstacleZ + 20);
    }
    
    // Cleanup behind (fixed position access for getByTag)
    var grounds = game.scene.getByTag('ground');
    for (var i = 0; i < grounds.length; i++) {
      var g = grounds[i];
      var pos = game.scene.getEntity(g.id).position;
      if (pos[2] < p.position[2] - 30) game.scene.removeEntity(g.id);
    }
    
    var obs = game.scene.getByTag('obstacle');
    for (var i = 0; i < obs.length; i++) {
      var o = obs[i];
      var pos = game.scene.getEntity(o.id).position;
      if (pos[2] < p.position[2] - 30) game.scene.removeEntity(o.id);
    }
    
    var orbs = game.scene.getByTag('orb');
    for (var i = 0; i < orbs.length; i++) {
      var o = orbs[i];
      var pos = game.scene.getEntity(o.id).position;
      if (pos[2] < p.position[2] - 30) game.scene.removeEntity(o.id);
    }
  
    // Echo Path Logic
    echoCooldown -= s;
    if (echoCooldown <= 0 && !echoActive) {
      echoActive = true;
      echoTimer = echoDuration;
      echoCooldown = 25;
      for (var i = 0; i < 15; i++) spawnEcho(p.position[2] + 5 + i * 3);
    }
    if (echoActive) {
      echoTimer -= s;
      var echoes = game.scene.getByTag('echo');
      for (var i = echoes.length - 1; i >= 0; i--) {
        var e = echoes[i];
        var fade = Math.max(0, echoTimer / echoDuration);
        game.scene.setMaterial(e.name, { opacity: fade * 0.8 });
        if (echoTimer <= 0) game.scene.removeEntity(e.id);
      }
      if (echoTimer <= 0) echoActive = false;
    }
  
    // Collisions
    var hits = game.physics.findOverlapping('player', 'obstacle');
    if (hits.length > 0 && !phaseActive) {
      gameOver = true;
      game.audio.stopAll();
      game.hud.clear();
      game.hud.text('RUN TERMINATED', game.hud.width/2, game.hud.height/2 - 40, { color: '#ff4444', size: 32, align: 'center' });
      game.hud.text('Score: ' + Math.floor(score), game.hud.width/2, game.hud.height/2, { color: '#ffffff', size: 24, align: 'center' });
      game.hud.text('Press R to Restart', game.hud.width/2, game.hud.height/2 + 40, { color: '#aaaaaa', size: 18, align: 'center' });
    }
  
    var collectedOrbs = game.physics.findOverlapping('player', 'orb');
    for (var i = 0; i < collectedOrbs.length; i++) {
      game.scene.removeEntity(collectedOrbs[i]);
      score += 50;
      if (echoActive) { echoTimer = Math.min(echoTimer + 3, echoDuration); }
    }
  
    // Score & Era Shifts
    score += moveZ * 0.5;
    speed = Math.min(maxSpeed, 8 + distance * 0.001);
    var milestone = Math.floor(score / 500);
    if (milestone > lastMilestone && milestone < 4) {
      era = milestone;
      lastMilestone = milestone;
      game.scene.setBackground(ERAS[era].bg);
      game.hud.clear();
      game.hud.text('ERA SHIFT: ' + ERAS[era].name, game.hud.width/2, 60, { color: '#ffffff', size: 28, align: 'center' });
    }
  
    // HUD
    game.hud.clear();
    game.hud.text('SCORE: ' + Math.floor(score), 20, 20, { color: '#ffffff', size: 20 });
    game.hud.text('DIST: ' + Math.floor(distance) + 'm', 20, 48, { color: '#aaaaff', size: 16 });
    game.hud.text('ERA: ' + ERAS[era].name, 20, 72, { color: '#ffcc00', size: 16 });
    
    // Echo Bar
    var echoPct = echoActive ? echoTimer / echoDuration : 0;
    game.hud.rect(game.hud.width - 120, 20, 100, 12, { fill: '#222', stroke: '#555' });
    game.hud.rect(game.hud.width - 120, 20, Math.round(100 * echoPct), 12, { fill: '#00ffff' });
    game.hud.text('ECHO', game.hud.width - 110, 30, { color: '#fff', size: 10, align: 'center' });
  
    // Cooldowns
    var dodgePct = dodgeCooldown > 0 ? 1 - dodgeCooldown / 0.4 : 1;
    game.hud.rect(game.hud.width - 120, 50, 100, 12, { fill: '#222', stroke: '#555' });
    game.hud.rect(game.hud.width - 120, 50, Math.round(100 * dodgePct), 12, { fill: '#4488ff' });
    game.hud.text('DODGE', game.hud.width - 110, 60, { color: '#fff', size: 10, align: 'center' });
  
    var phasePct = phaseActive ? phaseTimer / 1.5 : 1;
    game.hud.rect(game.hud.width - 120, 80, 100, 12, { fill: '#222', stroke: '#555' });
    game.hud.rect(game.hud.width - 120, 80, Math.round(100 * phasePct), 12, { fill: '#aa00ff' });
    game.hud.text('PHASE', game.hud.width - 110, 90, { color: '#fff', size: 10, align: 'center' });
  
    // Pause Overlay
    if (isPaused) {
      game.hud.rect(0, 0, game.hud.width, game.hud.height, { fill: 'rgba(0,0,0,0.6)' });
      game.hud.text('PAUSED', game.hud.width/2, game.hud.height/2 - 20, { color: '#ffffff', size: 36, align: 'center' });
      game.hud.text('Press ESC to Resume', game.hud.width/2, game.hud.height/2 + 20, { color: '#aaaaaa', size: 18, align: 'center' });
    }
  });
  
  // Input Handlers
  var unsubPause = game.input.onKey('Escape', function(ev) {
    if (ev === 'press') isPaused = !isPaused;
  });
  
  var unsubPhase = game.input.onKey('z', function(ev) {
    if (ev === 'press' && !phaseActive) { phaseActive = true; phaseTimer = 1.5; }
  });
  
  var unsubRestart = game.input.onKey('r', function(ev) {
    if (ev === 'press' && gameOver) {
      game.gotoScene('Game');
    }
  });
  })(window.game);
};

_scenes["Game Over"] = function() {
  // (empty scene)
};

// ─── Start ───────────────────────────────────────────────────────────────────
window.game.gotoScene("Main Menu");

} // end bootstrap guard