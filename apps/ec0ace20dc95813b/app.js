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
  var audioNodes = {};
  var audioIdCounter = 0;
  var masterVolume = 1;
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
  canvas.addEventListener('mousedown', function(e) {
    var key = 'Mouse' + e.button;
    keysDown[key] = true;
    (keyHandlers[key] || []).forEach(function(h) { h('press'); });
  });
  canvas.addEventListener('mouseup', function(e) {
    var key = 'Mouse' + e.button;
    delete keysDown[key];
    (keyHandlers[key] || []).forEach(function(h) { h('release'); });
  });

  var bindingMap = {};

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
      setNormalMap: function(idOrName, url) {
        var e = findEntity(idOrName);
        if (!e) return;
        new THREE.TextureLoader().load(url, function(tex) {
          if (e.mesh.material) {
            e.mesh.material.normalMap = tex;
            e.mesh.material.needsUpdate = true;
          }
        });
      },
      setMaterial: function(idOrName, opts) {
        var e = findEntity(idOrName);
        if (!e || !e.mesh.material) return;
        opts = opts || {};
        var mat = e.mesh.material;
        if (opts.roughness !== undefined) mat.roughness = opts.roughness;
        if (opts.metalness !== undefined) mat.metalness = opts.metalness;
        if (opts.opacity !== undefined) { mat.opacity = opts.opacity; mat.transparent = opts.opacity < 1; }
        if (opts.emissive !== undefined) mat.emissive = new THREE.Color(opts.emissive);
        if (opts.wireframe !== undefined) mat.wireframe = opts.wireframe;
        mat.needsUpdate = true;
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
      registerBinding: function(name, defaultKeys, _description) {
        var keys = Array.isArray(defaultKeys) ? defaultKeys : [defaultKeys];
        var saved = (window.__gameInputBindings || {})[name];
        if (!bindingMap[name]) bindingMap[name] = saved || keys;
        return bindingMap[name];
      },
      isBindingDown: function(name) {
        var keys = bindingMap[name];
        if (!keys) return false;
        return keys.some(function(k) { return !!keysDown[k]; });
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
    audio: {
      play: function(url, opts) {
        opts = opts || {};
        var id = 'aud_' + (++audioIdCounter);
        var el = new Audio(url);
        el.loop = !!opts.loop;
        el.volume = Math.max(0, Math.min(1, (opts.volume === undefined ? 1 : opts.volume) * masterVolume));
        audioNodes[id] = el;
        el.addEventListener('ended', function() { delete audioNodes[id]; });
        el.addEventListener('error', function() {
          delete audioNodes[id];
          window.game.log('Audio failed to load: ' + url);
        });
        var playResult = el.play();
        if (playResult && typeof playResult.catch === 'function') {
          playResult.catch(function() {
            delete audioNodes[id];
            window.game.log('Audio playback blocked or failed: ' + url);
          });
        }
        return function() {
          try { el.pause(); el.currentTime = 0; } catch(e) {}
          delete audioNodes[id];
        };
      },
      stopAll: function() {
        for (var id in audioNodes) {
          try { audioNodes[id].pause(); audioNodes[id].currentTime = 0; } catch(e) {}
          delete audioNodes[id];
        }
      },
      setMasterVolume: function(volume) {
        masterVolume = Math.max(0, Math.min(1, volume));
        for (var id in audioNodes) audioNodes[id].volume = masterVolume;
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

    assets: {
      cutSpriteSheet: function(url, spriteW, spriteH, maxSprites) {
        maxSprites = maxSprites || 48;
        return new Promise(function(resolve) {
          var img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = function() {
            var c = document.createElement('canvas');
            c.width = spriteW;
            c.height = spriteH;
            var ctx = c.getContext('2d');
            if (!ctx) { resolve([]); return; }
            var cols = Math.floor(img.width / spriteW);
            var rows = Math.floor(img.height / spriteH);
            var out = [];
            for (var row = 0; row < rows && out.length < maxSprites; row++) {
              for (var col = 0; col < cols && out.length < maxSprites; col++) {
                ctx.clearRect(0, 0, spriteW, spriteH);
                ctx.drawImage(img, col * spriteW, row * spriteH, spriteW, spriteH, 0, 0, spriteW, spriteH);
                out.push(c.toDataURL('image/png'));
              }
            }
            resolve(out);
          };
          img.onerror = function() { resolve([]); };
          img.src = url;
        });
      },
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
    window.game.audio.stopAll();
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

window.__gameInputBindings = {};

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
  // Add visual polish and juice: screen shake on impacts, particle effects, smooth tweens, and satisfying feedback for key game events.
  (function(game){
  "use strict";
  // ---------- Static scene setup (idempotent) ----------
  if (!game.scene.getEntity('menu_platform')) {
    game.scene.addEntity({
      name: 'menu_platform', shape: 'cylinder', dims: [3, 0.5, 3],
      color: '#4a9c4a', position: [0, -0.25, 0],
    });
    game.scene.setTexture('menu_platform', 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/aerial_grass_rock/aerial_grass_rock_diff_1k.jpg', { repeat: [2, 2] });
    game.scene.setBackground('#1a1a2e');
    game.scene.addLight('ambient', { color: '#c8d8ff', intensity: 0.5 });
    game.scene.addLight('directional', { color: '#fff4d0', intensity: 0.9, position: [6, 10, 6] });
  }
  
  if (!game.scene.getEntity('preview_animal')) {
    game.scene.addEntity({
      name: 'preview_animal', shape: 'sphere', dims: [0.9],
      color: '#b5895a', position: [0, 0.9, 0], tags: ['preview'],
    });
    game.scene.setMaterial('preview_animal', { roughness: 0.8, metalness: 0.0 });
  }
  
  // Ambient sparkle pool around the platform (bounded, reused — no per-frame spawn/leak)
  var SPARKLE_COUNT = 10;
  for (var si = 0; si < SPARKLE_COUNT; si++) {
    var sName = 'menu_sparkle_' + si;
    if (!game.scene.getEntity(sName)) {
      var ang = (si / SPARKLE_COUNT) * Math.PI * 2;
      var rad = 1.8 + Math.random() * 0.8;
      game.scene.addEntity({
        name: sName, shape: 'sphere', dims: [0.06],
        color: '#ffe9a8', position: [Math.cos(ang) * rad, 0.4 + Math.random() * 0.6, Math.sin(ang) * rad],
        tags: ['menuSparkle'],
      });
      game.scene.setMaterial(sName, { emissive: '#ffcc55', roughness: 0.4 });
    }
  }
  
  game.camera.setPosition(0, 2.2, 5);
  game.camera.lookAt(0, 0.7, 0);
  
  var highScore = 0;
  try {
    var saved = JSON.parse(localStorage.getItem('oneos_game_progress') || 'null');
    if (saved) highScore = saved.score || 0;
  } catch (e) {}
  
  var started = false;
  var camBaseX = 0, camBaseY = 2.2, camBaseZ = 5;
  var shakeTimer = 0, shakeMag = 0;
  var flashAlpha = 0;
  var burstParticles = [];
  var punchTimer = 0; // preview animal scale-punch juice
  
  function screenShake(mag, durMs) {
    shakeMag = mag;
    shakeTimer = durMs;
  }
  
  function spawnBurst(x, y, z, color, count) {
    for (var i = 0; i < (count || 14); i++) {
      var id = 'menu_burst_' + Date.now() + '_' + i;
      game.scene.addEntity({
        name: id, shape: 'sphere', dims: [0.1],
        color: color || '#ffdd55', position: [x, y, z], tags: ['menuBurst'],
      });
      burstParticles.push({
        id: id,
        vx: (Math.random() - 0.5) * 5,
        vy: 2.5 + Math.random() * 3.5,
        vz: (Math.random() - 0.5) * 5,
        life: 0.5 + Math.random() * 0.35,
        age: 0,
      });
    }
  }
  
  // ---------- Main update loop ----------
  var _unsub = function() {}; _unsub();
  _unsub = game.onUpdate(function(dt) {
    var t = game.time.elapsed;
    var s = dt / 1000;
  
    // Preview animal: spin + gentle idle squash/stretch bob, plus punch juice on start
    var e = game.scene.getEntity('preview_animal');
    if (e) {
      game.scene.setRotation('preview_animal', [0, t * 0.8, 0]);
      var bob = Math.sin(t * 2.2) * 0.06;
      var baseScale = 1 + bob;
      if (punchTimer > 0) {
        punchTimer -= dt;
        var punchT = Math.max(0, punchTimer / 260);
        var punch = 1 + punchT * 0.5;
        game.scene.setScale('preview_animal', [baseScale * (2 - punch), baseScale * punch, baseScale * (2 - punch)]);
      } else {
        game.scene.setScale('preview_animal', [baseScale, baseScale, baseScale]);
      }
      game.scene.setPosition('preview_animal', [0, 0.9 + Math.max(0, bob) * 0.5, 0]);
    }
  
    // Ambient sparkles: float, drift, twinkle
    for (var si2 = 0; si2 < SPARKLE_COUNT; si2++) {
      var sName2 = 'menu_sparkle_' + si2;
      var sp = game.scene.getEntity(sName2);
      if (!sp) continue;
      var ang2 = (si2 / SPARKLE_COUNT) * Math.PI * 2 + t * 0.15;
      var rad2 = 1.8 + Math.sin(t * 0.6 + si2) * 0.3;
      var yy = 0.4 + Math.sin(t * 1.5 + si2 * 1.3) * 0.35;
      game.scene.setPosition(sName2, [Math.cos(ang2) * rad2, yy, Math.sin(ang2) * rad2]);
      var tw = 0.7 + Math.sin(t * 4 + si2 * 2) * 0.5;
      var sc = Math.max(0.15, tw);
      game.scene.setScale(sName2, [sc, sc, sc]);
    }
  
    // Burst particles (start-press juice)
    burstParticles = burstParticles.filter(function(p) {
      p.age += s;
      if (p.age >= p.life) { game.scene.removeEntity(p.id); return false; }
      var pe = game.scene.getEntity(p.id);
      if (!pe) return false;
      p.vy -= 9.8 * s;
      game.scene.setPosition(p.id, [pe.position[0] + p.vx * s, pe.position[1] + p.vy * s, pe.position[2] + p.vz * s]);
      var sc2 = Math.max(0, 1 - p.age / p.life);
      game.scene.setScale(p.id, [sc2, sc2, sc2]);
      return true;
    });
  
    // Camera screen shake
    if (shakeTimer > 0) {
      shakeTimer -= dt;
      var decay = Math.max(0, shakeTimer / 300);
      var ox = (Math.random() - 0.5) * shakeMag * decay;
      var oy = (Math.random() - 0.5) * shakeMag * decay;
      game.camera.setPosition(camBaseX + ox, camBaseY + oy, camBaseZ);
      game.camera.lookAt(0, 0.7, 0);
    } else {
      game.camera.setPosition(camBaseX, camBaseY, camBaseZ);
      game.camera.lookAt(0, 0.7, 0);
    }
  
    // ---------- HUD ----------
    game.hud.clear();
    var w = game.hud.width;
  
    var titlePulse = 44 + Math.sin(t * 2) * 2;
    game.hud.text('Rampage Roller', w / 2, 60, { color: '#ffffff', size: titlePulse, align: 'center' });
    game.hud.text('Roll. Smash. Score.', w / 2, 104, { color: '#cccccc', size: 18, align: 'center' });
    game.hud.text('Best Smash Score: ' + highScore, w / 2, 140, { color: '#ffdd44', size: 18, align: 'center' });
  
    var promptGlow = 0.65 + Math.abs(Math.sin(t * 3)) * 0.35;
    var promptColor = 'rgba(255,255,255,' + promptGlow.toFixed(2) + ')';
    game.hud.text('Press SPACE or Click to Start Rolling', w / 2, game.hud.height - 40, { color: promptColor, size: 20, align: 'center' });
  
    if (flashAlpha > 0) {
      game.hud.rect(0, 0, game.hud.width, game.hud.height, { fill: 'rgba(255,220,120,' + flashAlpha.toFixed(2) + ')' });
      flashAlpha = Math.max(0, flashAlpha - dt / 300);
    }
  });
  
  // ---------- Start transition with juice ----------
  function startGame() {
    if (started) return;
    started = true;
  
    // Juice: burst, punch, shake, flash — then transition
    var pe = game.scene.getEntity('preview_animal');
    var pos = pe ? pe.position : [0, 0.9, 0];
    spawnBurst(pos[0], pos[1], pos[2], '#ffcc44', 18);
    punchTimer = 260;
    screenShake(0.18, 260);
    flashAlpha = 0.5;
  
    setTimeout(function() {
      game.gotoScene('Rampage Level');
    }, 260);
  }
  
  var _unsubKey = function() {}; _unsubKey();
  _unsubKey = game.input.onKey(' ', function(ev) {
    if (ev === 'press') startGame();
  });
  
  var _unsubClick = function() {}; _unsubClick();
  _unsubClick = game.input.onKey('Mouse0', function(ev) {
    if (ev === 'press') startGame();
  });
  })(window.game);
};

_scenes["Rampage Level"] = function() {
  // The ball seems to always be moving, give it some weight so it slows down, also I'd like to be able to jump. Give me a little animation when jumping
  (function(game){
  "use strict";
  // ===== Rampage Level =====
  var _unsub = function() {}; _unsub();
  var _unsubJump = function() {}; _unsubJump();
  
  // ---------- Config ----------
  var GROUND_SIZE = 60;
  var PLAYER_RADIUS = 0.6;
  var BASE_MAX_SPEED = 9;
  var ACCEL = 11;                // slightly slower to build up speed — feels heavier
  var FRICTION_DIRT = 0.62;      // per-second multiplicative decay (lower = slows down faster)
  var FRICTION_GRAVEL = 0.4;
  var FRICTION_RAMP = 0.97;      // ramps keep momentum going downhill
  var RAMP_BOOST = 10;           // extra accel while in ramp zone (downhill dir)
  var TIMER_START = 75;
  var HEALTH_START = 100;
  var HIT_COOLDOWN = 0.6;
  var COMBO_WINDOW = 3.0;
  var STOP_RESET_TIME = 1.6;
  var GROWTH_THRESHOLD = 8;
  var GROWTH_STAGES = [1.0, 1.35, 1.7, 2.1];
  var JUMP_FORCE = 8.5;
  var GRAVITY = -24;
  
  function rand(a, b) { return a + Math.random() * (b - a); }
  
  // ---------- Ground ----------
  if (!game.scene.getEntity('ground')) {
    game.scene.addEntity({
      name: 'ground', shape: 'plane', dims: [GROUND_SIZE, GROUND_SIZE],
      color: '#5a7a3a', position: [0, 0, 0], rotation: [-Math.PI / 2, 0, 0],
    });
    game.scene.setTexture('ground', 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/aerial_grass_rock/aerial_grass_rock_diff_1k.jpg', { repeat: [10, 10] });
    game.scene.setMaterial('ground', { roughness: 0.95 });
  }
  
  // Gravel zone (rough patch that slows player)
  var GRAVEL = { xMin: -26, xMax: -10, zMin: -26, zMax: -10 };
  if (!game.scene.getEntity('gravelZone')) {
    var gw = GRAVEL.xMax - GRAVEL.xMin, gd = GRAVEL.zMax - GRAVEL.zMin;
    game.scene.addEntity({
      name: 'gravelZone', shape: 'plane', dims: [gw, gd], color: '#8a8578',
      position: [(GRAVEL.xMin + GRAVEL.xMax) / 2, 0.02, (GRAVEL.zMin + GRAVEL.zMax) / 2],
      rotation: [-Math.PI / 2, 0, 0],
    });
    game.scene.setTexture('gravelZone', 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/aerial_ground_rock/aerial_ground_rock_diff_1k.jpg', { repeat: [4, 4] });
    game.scene.setMaterial('gravelZone', { roughness: 1.0 });
  }
  
  // Ramp zones: bounding box + downhill boost direction
  // Textured with real CC0 asphalt scans (Poly Haven) so ramps read as paved surfaces.
  var RAMP_TEXTURES = [
    'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/asphalt_02/asphalt_02_diff_1k.jpg',
    'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/asphalt_04/asphalt_04_diff_1k.jpg',
    'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/asphalt_07/asphalt_07_diff_1k.jpg',
  ];
  var RAMPS = [
    { xMin: 10, xMax: 20, zMin: -22, zMax: -10, dir: [0, 0, -1], pos: [15, 0.3, -16], dims: [10, 0.6, 12], rot: [-0.28, 0, 0] },
    { xMin: -22, xMax: -10, zMin: 10, zMax: 20, dir: [0, 0, 1], pos: [-16, 0.3, 15], dims: [12, 0.6, 10], rot: [0.28, 0, 0] },
    { xMin: 14, xMax: 26, zMin: 6, zMax: 16, dir: [1, 0, 0], pos: [20, 0.3, 11], dims: [12, 0.6, 10], rot: [0, 0, -0.28] },
  ];
  RAMPS.forEach(function(r, i) {
    var name = 'ramp_' + i;
    if (!game.scene.getEntity(name)) {
      game.scene.addEntity({ name: name, shape: 'box', dims: r.dims, color: '#3a3a3a', position: r.pos, rotation: r.rot });
    }
    game.scene.setTexture(name, RAMP_TEXTURES[i % RAMP_TEXTURES.length], { repeat: [3, 3] });
    game.scene.setMaterial(name, { roughness: 0.9 });
  });
  
  // Lighting
  if (!game.scene.getEntity('__ambientLight')) {
    game.scene.addLight('ambient', { color: '#dfe8ff', intensity: 0.55 });
    game.scene.addLight('directional', { color: '#fff2d0', intensity: 0.9, position: [10, 18, 8] });
  }
  game.scene.setBackground('#9fd0f0');
  
  // ---------- Player ----------
  if (!game.scene.getEntity('player')) {
    game.scene.addEntity({
      name: 'player', shape: 'sphere', dims: [PLAYER_RADIUS], color: '#c19a6b',
      position: [0, PLAYER_RADIUS, 2], tags: ['player'], scale: [1, 1, 1],
    });
    game.scene.setMaterial('player', { roughness: 0.85, metalness: 0.05 });
  }
  
  // ---------- Destructibles ----------
  var DEST_TYPES = [
    { type: 'crate', count: 8, points: 10, tier: 1, radius: 0.55, color: '#c9a066', shape: 'box', dims: [0.9, 0.9, 0.9] },
    { type: 'cone', count: 8, points: 15, tier: 1, radius: 0.45, color: '#ff7a1a', shape: 'cylinder', dims: [0.4, 0.9, 0.4] },
    { type: 'rock', count: 8, points: 8, tier: 1, radius: 0.5, color: '#8a8a8a', shape: 'sphere', dims: [0.5] },
    { type: 'cart', count: 5, points: 35, tier: 2, radius: 0.9, color: '#c0392b', shape: 'box', dims: [1.6, 1.4, 1.0] },
    { type: 'mailbox', count: 5, points: 45, tier: 2, radius: 0.55, color: '#2255aa', shape: 'box', dims: [0.6, 0.7, 0.6] },
  ];
  
  var destructibles = [];
  var destructiblesReady = window.__rampageDestructibles;
  var TOTAL_DESTRUCTIBLES = 0;
  if (!destructiblesReady) {
    var idCounter = 0;
    DEST_TYPES.forEach(function(def) {
      TOTAL_DESTRUCTIBLES += def.count;
      for (var i = 0; i < def.count; i++) {
        var x, z, tries = 0;
        do {
          x = rand(-27, 27); z = rand(-27, 27); tries++;
        } while ((Math.abs(x) < 4 && Math.abs(z - 2) < 5) && tries < 20);
        var name = 'dest_' + def.type + '_' + (idCounter++);
        var pos = def.type === 'mailbox' ? [x, def.dims[1] / 2 + 0.5, z] : [x, def.dims[1] ? def.dims[1] / 2 : def.radius, z];
        game.scene.addEntity({ name: name, shape: def.shape, dims: def.dims, color: def.color, position: pos, tags: ['destructible'] });
        if (def.type === 'mailbox') {
          var postName = name + '_post';
          game.scene.addEntity({ name: postName, shape: 'cylinder', dims: [0.06, 0.8, 0.06], color: '#555555', position: [x, 0.4, z] });
        }
        destructibles.push({ id: name, post: def.type === 'mailbox' ? name + '_post' : null, type: def.type, points: def.points, tier: def.tier, pos: pos, radius: def.radius, color: def.color });
      }
    });
  } else {
    destructibles = window.__rampageDestructibles.filter(function(d) { return game.scene.getEntity(d.id); });
    TOTAL_DESTRUCTIBLES = window.__rampageTotalDestructibles || destructibles.length;
  }
  window.__rampageDestructibles = destructibles;
  window.__rampageTotalDestructibles = TOTAL_DESTRUCTIBLES;
  
  // ---------- Obstacles (immovable) ----------
  var OBST_TYPES = [
    { type: 'tree', count: 6, radius: 1.0 },
    { type: 'boulder', count: 6, radius: 1.4 },
  ];
  var obstacles = window.__rampageObstacles;
  if (!obstacles) {
    obstacles = [];
    var oid = 0;
    OBST_TYPES.forEach(function(def) {
      for (var i = 0; i < def.count; i++) {
        var x, z, tries = 0;
        do { x = rand(-27, 27); z = rand(-27, 27); tries++; } while (Math.abs(x) < 5 && Math.abs(z - 2) < 6 && tries < 20);
        var name = 'obst_' + def.type + '_' + (oid++);
        if (def.type === 'tree') {
          game.scene.addEntity({ name: name + '_trunk', shape: 'cylinder', dims: [0.3, 2.4, 0.3], color: '#5a3d1f', position: [x, 1.2, z], tags: ['obstacle'] });
          game.scene.addEntity({ name: name + '_canopy', shape: 'sphere', dims: [1.3], color: '#1f5c2a', position: [x, 3.0, z] });
        } else {
          game.scene.addEntity({ name: name, shape: 'sphere', dims: [def.radius], color: '#777d80', position: [x, def.radius, z], tags: ['obstacle'] });
        }
        obstacles.push({ id: name, type: def.type, pos: [x, def.radius, z], radius: def.radius });
      }
    });
    window.__rampageObstacles = obstacles;
  }
  
  // ---------- Real CC0 material pass ----------
  var DEST_DIFF = {
    crate: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/black_painted_planks/black_painted_planks_diff_1k.jpg',
    mailbox: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/blue_plaster_weathered/blue_plaster_weathered_diff_1k.jpg',
    rock: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/anti_slip_concrete/anti_slip_concrete_diff_1k.jpg',
  };
  var DEST_NORM = {
    crate: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/black_painted_planks/black_painted_planks_nor_gl_1k.jpg',
    mailbox: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/blue_plaster_weathered/blue_plaster_weathered_nor_gl_1k.jpg',
    rock: 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/anti_slip_concrete/anti_slip_concrete_nor_gl_1k.jpg',
  };
  var DEST_ROUGH = { crate: 0.75, mailbox: 0.55, rock: 1.0 };
  
  destructibles.forEach(function(d) {
    var diff = DEST_DIFF[d.type];
    if (diff && game.scene.getEntity(d.id)) {
      game.scene.setTexture(d.id, diff, { repeat: [1, 1] });
      if (DEST_NORM[d.type]) game.scene.setNormalMap(d.id, DEST_NORM[d.type]);
      game.scene.setMaterial(d.id, { roughness: DEST_ROUGH[d.type] || 0.85 });
    }
    if (d.type === 'mailbox' && d.post && game.scene.getEntity(d.post)) {
      game.scene.setTexture(d.post, 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/black_painted_planks/black_painted_planks_diff_1k.jpg');
      game.scene.setMaterial(d.post, { roughness: 0.6, metalness: 0.2 });
    }
  });
  
  obstacles.forEach(function(o) {
    if (o.type === 'boulder' && game.scene.getEntity(o.id)) {
      game.scene.setTexture(o.id, 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/anti_slip_concrete/anti_slip_concrete_diff_1k.jpg', { repeat: [2, 2] });
      game.scene.setNormalMap(o.id, 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/anti_slip_concrete/anti_slip_concrete_nor_gl_1k.jpg');
      game.scene.setMaterial(o.id, { roughness: 1.0 });
    }
  });
  
  // ---------- State ----------
  var score = 0;
  var combo = 1;
  var comboTimer = 0;
  var stopTimer = 0;
  var timeLeft = TIMER_START;
  var health = HEALTH_START;
  var vx = 0, vz = 0;
  var px = 0, py = PLAYER_RADIUS, pz = 2;
  var vy = 0, onGround = true;
  var rotX = 0, rotZ = 0;
  var growthStage = 0;
  var smashCount = 0;
  var hitCooldown = 0;
  var pulseTimer = 0;
  var shakeTimer = 0, shakeMag = 0;
  var gameEnded = false;
  var particles = [];
  var popupText = '', popupTimer = 0, popupColor = '#ffd54a';
  var bounceMsgTimer = 0;
  var introTimer = 5.0;
  
  // Fixed camera offset — camera stays SOUTH of the player looking north, so
  // on-screen "forward" always matches the same world direction (no spin/wonk).
  var CAM_OFFSET = [0, 6, 11];
  
  function scaleForStage() { return GROWTH_STAGES[Math.min(growthStage, GROWTH_STAGES.length - 1)]; }
  function maxSpeedForStage() { return BASE_MAX_SPEED + growthStage * 1.5; }
  
  function spawnDebris(x, y, z, color, count) {
    for (var i = 0; i < (count || 6); i++) {
      var name = 'chip_' + Date.now() + '_' + i + '_' + Math.floor(Math.random() * 1000);
      game.scene.addEntity({ name: name, shape: 'box', dims: [0.18, 0.18, 0.18], color: color, position: [x, y, z] });
      particles.push({
        id: name,
        vx: (Math.random() - 0.5) * 6, vy: 2.5 + Math.random() * 3.5, vz: (Math.random() - 0.5) * 6,
        life: 0.5 + Math.random() * 0.4, age: 0,
      });
    }
  }
  
  function screenShake(mag, dur) { shakeMag = Math.max(shakeMag, mag); shakeTimer = Math.max(shakeTimer, dur); }
  
  function playSmashSound() {
    try { game.audio.play('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=', { volume: 0.7 }); } catch (e) {}
  }
  
  function playJumpSound() {
    try { game.audio.play('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=', { volume: 0.35 }); } catch (e) {}
  }
  
  var stopRumble = null;
  function updateRumble(speed) {
    if (speed > 1.0 && !stopRumble) {
      try { stopRumble = game.audio.play('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=', { loop: true, volume: 0.15 }); } catch (e) {}
    } else if (speed <= 1.0 && stopRumble) {
      stopRumble(); stopRumble = null;
    }
  }
  
  function endGame() {
    if (gameEnded) return;
    gameEnded = true;
    if (stopRumble) { stopRumble(); stopRumble = null; }
    try { game.audio.stopAll(); } catch (e) {}
    var prevBest = 0;
    try { prevBest = parseInt(localStorage.getItem('rampage_high_score') || '0', 10) || 0; } catch (e) {}
    window.__rampageResult = { score: score, prevBest: prevBest };
    window.__rampageDestructibles = null;
    window.__rampageObstacles = null;
    window.__rampageTotalDestructibles = null;
    _unsub();
    _unsubJump();
    game.gotoScene('Results');
  }
  
  // ---------- Input state ----------
  function keyDown(k) { return game.input.isDown(k); }
  
  // Jump — Space, only when grounded
  _unsubJump = game.input.onKey(' ', function(ev) {
    if (ev !== 'press' || gameEnded) return;
    if (onGround) {
      vy = JUMP_FORCE;
      onGround = false;
      pulseTimer = 0.15; // quick squash-down as it launches
      playJumpSound();
    }
  });
  
  // ---------- Main loop ----------
  _unsub = game.onUpdate(function(dt) {
    if (gameEnded) return;
    var s = dt / 1000;
  
    // Timer
    timeLeft -= s;
    if (timeLeft <= 0) { timeLeft = 0; endGame(); return; }
  
    if (introTimer > 0) introTimer -= s;
  
    // Input -> acceleration.
    // Fixed world-space axes matched to a NON-ROTATING camera below, so
    // W/Up always moves the same screen direction (away from camera) — no more spin-out.
    var ax = 0, az = 0;
    if (keyDown('a') || keyDown('ArrowLeft')) ax -= 1;
    if (keyDown('d') || keyDown('ArrowRight')) ax += 1;
    if (keyDown('w') || keyDown('ArrowUp')) az -= 1;
    if (keyDown('s') || keyDown('ArrowDown')) az += 1;
    var alen = Math.sqrt(ax * ax + az * az);
    if (alen > 0) { ax /= alen; az /= alen; vx += ax * ACCEL * s; vz += az * ACCEL * s; }
  
    // Zone detection
    var inGravel = px >= GRAVEL.xMin && px <= GRAVEL.xMax && pz >= GRAVEL.zMin && pz <= GRAVEL.zMax;
    var inRamp = null;
    for (var ri = 0; ri < RAMPS.length; ri++) {
      var r = RAMPS[ri];
      if (px >= r.xMin && px <= r.xMax && pz >= r.zMin && pz <= r.zMax) { inRamp = r; break; }
    }
  
    var frictionFactor = FRICTION_DIRT;
    if (inGravel) frictionFactor = FRICTION_GRAVEL;
    else if (inRamp) frictionFactor = FRICTION_RAMP;
  
    if (inRamp) { vx += inRamp.dir[0] * RAMP_BOOST * s; vz += inRamp.dir[2] * RAMP_BOOST * s; }
  
    // Apply friction decay (per-second factor) — this is the "weight": with no
    // input held, momentum bleeds off noticeably instead of coasting forever.
    var decay = Math.pow(frictionFactor, s);
    vx *= decay; vz *= decay;
    if (Math.abs(vx) < 0.02) vx = 0;
    if (Math.abs(vz) < 0.02) vz = 0;
  
    // Clamp speed
    var speed = Math.sqrt(vx * vx + vz * vz);
    var maxSp = maxSpeedForStage();
    if (speed > maxSp) { var sc = maxSp / speed; vx *= sc; vz *= sc; speed = maxSp; }
  
    // Combo timing
    if (comboTimer > 0) { comboTimer -= s; if (comboTimer <= 0) combo = 1; }
    if (speed < 0.25) { stopTimer += s; if (stopTimer > STOP_RESET_TIME) { combo = 1; comboTimer = 0; } }
    else stopTimer = 0;
  
    // Move player (horizontal)
    px += vx * s; pz += vz * s;
    var half = GROUND_SIZE / 2 - PLAYER_RADIUS;
    if (px > half) { px = half; vx *= -0.3; }
    if (px < -half) { px = -half; vx *= -0.3; }
    if (pz > half) { pz = half; vz *= -0.3; }
    if (pz < -half) { pz = -half; vz *= -0.3; }
  
    // Vertical physics — gravity + jump
    var wasAirborne = !onGround;
    vy += GRAVITY * s;
    py += vy * s;
    if (py <= PLAYER_RADIUS) {
      if (wasAirborne) {
        // just landed — squash on impact
        pulseTimer = 0.2;
        screenShake(0.06, 130);
      }
      py = PLAYER_RADIUS;
      vy = 0;
      onGround = true;
    } else {
      onGround = false;
    }
  
    // Rolling rotation
    rotX += vz * s * 1.2;
    rotZ -= vx * s * 1.2;
  
    // Growth-based & pulse scale
    var baseScale = scaleForStage();
    var pulseMult = 1;
    if (pulseTimer > 0) {
      pulseTimer -= s;
      var t = Math.max(0, pulseTimer / 0.18);
      pulseMult = 1 + t * 0.35;
    }
    // Jump stretch: elongate while rising, compress slightly while falling
    var jumpStretch = 0;
    if (!onGround) {
      var vyNorm = Math.max(-1, Math.min(1, vy / JUMP_FORCE));
      jumpStretch = vyNorm * 0.28;
    }
    var sx = baseScale * pulseMult * (1 - jumpStretch * 0.5);
    var sy = baseScale * (2 - pulseMult) * (1 + jumpStretch);
    var sz = baseScale * pulseMult * (1 - jumpStretch * 0.5);
  
    game.scene.setPosition('player', [px, py, pz]);
    game.scene.setRotation('player', [rotX, 0, rotZ]);
    game.scene.setScale('player', [sx, sy, sz]);
  
    updateRumble(speed);
  
    // hit cooldown
    if (hitCooldown > 0) hitCooldown -= s;
    if (popupTimer > 0) popupTimer -= s;
    if (bounceMsgTimer > 0) bounceMsgTimer -= s;
  
    // Destructible collisions
    for (var di = destructibles.length - 1; di >= 0; di--) {
      var d = destructibles[di];
      var dx = px - d.pos[0], dz = pz - d.pos[2];
      var dist = Math.sqrt(dx * dx + dz * dz);
      if (dist < d.radius + PLAYER_RADIUS + 0.15) {
        if (d.tier === 2 && growthStage < 1) {
          // too small — bounce off, no break
          var nlen = dist || 1;
          var nx = dx / nlen, nz = dz / nlen;
          vx = nx * 4; vz = nz * 4;
          px += nx * 0.3; pz += nz * 0.3;
          pulseTimer = 0.18;
          screenShake(0.08, 150);
          bounceMsgTimer = 1.4;
        } else {
          // break it
          var pts = Math.round(d.points * (0.5 + Math.min(speed, maxSp) / maxSp) * combo);
          score += pts;
          combo += 1;
          comboTimer = COMBO_WINDOW;
          smashCount += 1;
          popupText = '+' + pts + (combo > 1 ? '  x' + combo : '');
          popupColor = combo > 3 ? '#ff6666' : '#ffd54a';
          popupTimer = 0.9;
          if (smashCount % GROWTH_THRESHOLD === 0 && growthStage < GROWTH_STAGES.length - 1) {
            growthStage += 1;
            popupText = 'GREW BIGGER!  +' + pts;
            popupColor = '#66ff99';
            popupTimer = 1.3;
          }
          pulseTimer = 0.18;
          screenShake(0.12 + Math.min(speed / maxSp, 1) * 0.15, 220);
          playSmashSound();
          spawnDebris(d.pos[0], d.pos[1], d.pos[2], d.color, 6);
          game.scene.removeEntity(d.id);
          if (d.post) game.scene.removeEntity(d.post);
          destructibles.splice(di, 1);
        }
      }
    }
  
    // Obstacle collisions (trees/boulders)
    if (hitCooldown <= 0) {
      for (var oi = 0; oi < obstacles.length; oi++) {
        var o = obstacles[oi];
        var odx = px - o.pos[0], odz = pz - o.pos[2];
        var odist = Math.sqrt(odx * odx + odz * odz);
        if (odist < o.radius + PLAYER_RADIUS + 0.1) {
          health -= 20;
          hitCooldown = HIT_COOLDOWN;
          var onlen = odist || 1;
          var onx = odx / onlen, onz = odz / onlen;
          vx = onx * 6; vz = onz * 6;
          px += onx * 0.6; pz += onz * 0.6;
          pulseTimer = 0.2;
          screenShake(0.35, 400);
          combo = 1; comboTimer = 0;
          popupText = 'OUCH! -20 HP';
          popupColor = '#ff4444';
          popupTimer = 1.0;
          if (health <= 0) { health = 0; endGame(); return; }
          break;
        }
      }
    }
  
    // Debris particles
    particles = particles.filter(function(p) {
      p.age += s;
      if (p.age >= p.life) { game.scene.removeEntity(p.id); return false; }
      var e = game.scene.getEntity(p.id);
      if (!e) return false;
      p.vy -= 9.8 * s;
      game.scene.setPosition(p.id, [e.position[0] + p.vx * s, e.position[1] + p.vy * s, e.position[2] + p.vz * s]);
      var fade = Math.max(0.05, 1 - p.age / p.life);
      game.scene.setScale(p.id, [fade, fade, fade]);
      return true;
    });
  
    // Camera — FIXED world-space offset (does not rotate with velocity/heading).
    // This makes controls predictable: pressing the same key always moves the
    // same screen direction, instead of the old heading-based cam that spun
    // around and made "forward" keep changing.
    var camX = px + CAM_OFFSET[0], camY = py + CAM_OFFSET[1], camZ = pz + CAM_OFFSET[2];
    if (shakeTimer > 0) {
      shakeTimer -= dt;
      var decayS = Math.max(0, shakeTimer / 400);
      camX += (Math.random() - 0.5) * shakeMag * decayS;
      camY += (Math.random() - 0.5) * shakeMag * decayS;
    } else { shakeMag = 0; }
    game.camera.setPosition(camX, camY, camZ);
    game.camera.lookAt(px, py, pz);
  
    // HUD
    game.hud.clear();
    game.hud.text('Score: ' + score, 16, 16, { color: '#fff', size: 24 });
    game.hud.text('Combo x' + combo, 16, 46, { color: '#ffd54a', size: 18 });
    game.hud.text('Smashed: ' + smashCount + ' / ' + TOTAL_DESTRUCTIBLES, 16, 70, { color: '#aad', size: 14 });
    game.hud.text('Size: ' + (growthStage + 1) + '/' + GROWTH_STAGES.length, 16, 90, { color: '#aad', size: 14 });
    game.hud.text('Time: ' + Math.ceil(timeLeft) + 's', game.hud.width / 2, 16, { color: '#fff', size: 22, align: 'center' });
  
    var barW = 200, barX = game.hud.width - barW - 16, barY = 16;
    game.hud.rect(barX, barY, barW, 18, { fill: '#333', stroke: '#666' });
    var hpPct = Math.max(0, health / HEALTH_START);
    var hpColor = hpPct > 0.5 ? '#44dd44' : hpPct > 0.25 ? '#dddd44' : '#dd4444';
    game.hud.rect(barX, barY, Math.round(barW * hpPct), 18, { fill: hpColor });
    game.hud.text('HP', barX, barY + 24, { color: '#fff', size: 14 });
  
    if (health <= 30) {
      game.hud.rect(0, 0, game.hud.width, game.hud.height, { fill: 'rgba(200,30,30,' + (0.12 * (1 - hpPct)) + ')' });
    }
  
    // Score/hit popup feedback
    if (popupTimer > 0) {
      game.hud.text(popupText, game.hud.width / 2, 60, { color: popupColor, size: 26, align: 'center' });
    }
    if (bounceMsgTimer > 0) {
      game.hud.text('Too small to smash that — keep growing!', game.hud.width / 2, 96, { color: '#ffaa55', size: 16, align: 'center' });
    }
  
    // Goal / how-to-play banner for the first few seconds
    if (introTimer > 0) {
      game.hud.rect(game.hud.width / 2 - 320, game.hud.height - 96, 640, 66, { fill: 'rgba(0,0,0,0.5)' });
      game.hud.text('GOAL: Roll into crates, cones, carts, mailboxes & rocks to SMASH them for points!', game.hud.width / 2, game.hud.height - 78, { color: '#fff', size: 15, align: 'center' });
      game.hud.text('WASD/Arrows to roll • SPACE to jump • Avoid trees & boulders • Grow bigger to smash tougher stuff', game.hud.width / 2, game.hud.height - 54, { color: '#ffd54a', size: 14, align: 'center' });
    }
  });
  })(window.game);
};

_scenes["Results"] = function() {
  // Build the **Results** scene now. Use the Approved Plan above for all context — do not ask questions.  Scene goal: - HUD display of the final Score in large text, with "New Best!" text shown if it beats the previously saved high score (and the saved high score is updated) - HUD display of the previous best score for comparison - The player's animal (at whatever size it grew to) sits idle in view, slowly spinning, echoing the Main Menu preview - HUD prompt "Press SPACE or Click to Roll Again" - HUD prompt "Press ESC to return to Main Menu" - Transition: Space key press or click on retry prompt → game.gotoScene('Rampage Level') - Transition: Escape key press → game.gotoScene('Main Menu')
  (function(game){
  "use strict";
  // ── Results Scene ─────────────────────────────────────────────────────────────
  
  // Shared cross-scene state (Phaser/OneOS registry doesn't survive scene swaps)
  var shared = window.__gameShared = window.__gameShared || { score: 0, highScore: 0, playerScale: 1 };
  
  // Safe persistence
  function saveHighScore(v) {
    try { localStorage.setItem('rampage_roller_highscore', JSON.stringify(v)); } catch (e) {}
  }
  function loadHighScore() {
    try {
      var v = JSON.parse(localStorage.getItem('rampage_roller_highscore') || 'null');
      return typeof v === 'number' ? v : 0;
    } catch (e) { return 0; }
  }
  
  var savedBest = loadHighScore();
  if (shared.highScore < savedBest) shared.highScore = savedBest;
  
  var finalScore = shared.score || 0;
  var previousBest = shared.highScore || 0;
  var isNewBest = finalScore > previousBest;
  if (isNewBest) {
    shared.highScore = finalScore;
    saveHighScore(finalScore);
  }
  
  // ── Scene setup ────────────────────────────────────────────────────────────────
  game.scene.setBackground('#2a2f1a');
  
  if (!game.scene.getEntity('resultsGround')) {
    game.scene.addEntity({
      name: 'resultsGround',
      shape: 'plane',
      dims: [30, 30],
      color: '#4a7c39',
      position: [0, 0, 0],
      rotation: [-Math.PI / 2, 0, 0],
    });
    game.scene.setTexture('resultsGround', 'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/aerial_beach_02/aerial_beach_02_diff_1k.jpg', { repeat: [4, 4] });
  }
  
  game.scene.addLight('ambient', { color: '#c8d8ff', intensity: 0.55 });
  game.scene.addLight('directional', { color: '#fff4d0', intensity: 0.85, position: [6, 12, 5] });
  
  // Player animal — echo whatever size it grew to in the level (fallback small)
  var playerScale = shared.playerScale && shared.playerScale > 0 ? shared.playerScale : 1;
  if (!game.scene.getEntity('player')) {
    game.scene.addEntity({
      name: 'player',
      shape: 'sphere',
      dims: [0.6],
      color: '#c8a06a',
      position: [0, 0.6 * playerScale, 0],
      scale: [playerScale, playerScale, playerScale],
      tags: ['player'],
    });
    game.scene.setMaterial('player', { roughness: 0.85, metalness: 0.0 });
  } else {
    game.scene.setPosition('player', [0, 0.6 * playerScale, 0]);
  }
  
  game.camera.setPosition(0, 2.4 * playerScale + 1.5, 4.5 * playerScale + 2);
  game.camera.lookAt(0, 0.6 * playerScale, 0);
  
  // ── Idle spin ──────────────────────────────────────────────────────────────────
  var _unsubSpin = function() {}; _unsubSpin();
  _unsubSpin = game.onUpdate(function(dt) {
    var p = game.scene.getEntity('player');
    if (!p) return;
    game.scene.setRotation('player', [0.3, game.time.elapsed * 0.6, 0]);
  });
  
  // ── HUD ──────────────────────────────────────────────────────────────────────
  var _unsubHud = function() {}; _unsubHud();
  _unsubHud = game.onUpdate(function(dt) {
    game.hud.clear();
    var w = game.hud.width, h = game.hud.height;
  
    game.hud.rect(0, 0, w, h, { fill: 'rgba(0,0,0,0.25)' });
  
    game.hud.text('RESULTS', w / 2, 60, { color: '#ffdd66', size: 26, align: 'center', baseline: 'middle' });
  
    game.hud.text('Score: ' + finalScore, w / 2, h / 2 - 90, { color: '#ffffff', size: 52, align: 'center', baseline: 'middle' });
  
    if (isNewBest) {
      game.hud.text('New Best!', w / 2, h / 2 - 30, { color: '#44dd44', size: 30, align: 'center', baseline: 'middle' });
    }
  
    game.hud.text('Previous Best Smash Score: ' + previousBest, w / 2, h / 2 + 20, { color: '#cccccc', size: 20, align: 'center', baseline: 'middle' });
  
    game.hud.text('Press SPACE or Click to Roll Again', w / 2, h - 90, { color: '#ffffff', size: 20, align: 'center', baseline: 'middle' });
    game.hud.text('Press ESC to return to Main Menu', w / 2, h - 60, { color: '#aaaaaa', size: 16, align: 'center', baseline: 'middle' });
  });
  
  // ── Transitions ────────────────────────────────────────────────────────────────
  function retryGame() {
    // Reset run-specific shared state; keep highScore and let level manage its own score.
    shared.score = 0;
    game.gotoScene('Rampage Level');
  }
  
  function toMenu() {
    game.gotoScene('Main Menu');
  }
  
  var _unsubSpace = function() {}; _unsubSpace();
  _unsubSpace = game.input.onKey(' ', function(ev) {
    if (ev === 'press') retryGame();
  });
  
  var _unsubEsc = function() {}; _unsubEsc();
  _unsubEsc = game.input.onKey('Escape', function(ev) {
    if (ev === 'press') toMenu();
  });
  
  // Click-to-retry
  var _unsubClick = function() {}; _unsubClick();
  _unsubClick = game.input.onKey('Mouse0', function(ev) {
    if (ev !== 'press') return;
    retryGame();
  });
  })(window.game);
};

// ─── Start ───────────────────────────────────────────────────────────────────
window.game.gotoScene("Main Menu");

} // end bootstrap guard