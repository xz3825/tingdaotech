/**
 * Neural glowing particle waveform — black background.
 * Clear pinprick particles on filaments + cyan EEG wave + orange stimulus bursts.
 */
(function () {
  "use strict";

  var canvas = document.getElementById("neural-canvas");
  if (!canvas) return;
  if (typeof THREE === "undefined") {
    console.error("[neural] THREE.js failed to load");
    return;
  }

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isMobile = window.matchMedia("(max-width: 768px)").matches;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  var camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 11;

  var renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  var mouse = new THREE.Vector2(0, 0);
  var mouseTarget = new THREE.Vector2(0, 0);

  function hash(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function noise2(x, y) {
    var ix = Math.floor(x);
    var iy = Math.floor(y);
    var fx = x - ix;
    var fy = y - iy;
    var ux = fx * fx * (3 - 2 * fx);
    var uy = fy * fy * (3 - 2 * fy);
    var a = hash(ix + iy * 57);
    var b = hash(ix + 1 + iy * 57);
    var c = hash(ix + (iy + 1) * 57);
    var d = hash(ix + 1 + (iy + 1) * 57);
    return a + (b - a) * ux + (c - a) * uy * (1 - ux) + (d - b) * ux * uy;
  }

  var COL = {
    blue: new THREE.Color(0x3d8cff),
    cyan: new THREE.Color(0x4ecfff),
    teal: new THREE.Color(0x2ee6c5),
    indigo: new THREE.Color(0x6b5dff),
    violet: new THREE.Color(0x8b5cf6),
    purple: new THREE.Color(0xa04dff),
    magenta: new THREE.Color(0xd44dff),
    pink: new THREE.Color(0xff5cb0),
    coral: new THREE.Color(0xff6b6b),
    orange: new THREE.Color(0xff6a2a),
    hot: new THREE.Color(0xff3d6e),
    gold: new THREE.Color(0xffb347),
  };

  var PALETTES = [
    [COL.blue, COL.cyan, COL.teal, COL.indigo],
    [COL.indigo, COL.violet, COL.purple, COL.magenta],
    [COL.purple, COL.magenta, COL.pink, COL.hot],
    [COL.cyan, COL.blue, COL.violet, COL.purple],
    [COL.magenta, COL.pink, COL.coral, COL.orange],
    [COL.violet, COL.purple, COL.orange, COL.gold],
  ];

  function filamentColor(t, seed) {
    var c = new THREE.Color();
    var palette = PALETTES[Math.floor(seed * 6) % PALETTES.length];
    var phase = (t * 0.95 + seed * 0.37) % 1;
    var seg = 1 / (palette.length - 1);
    var i = Math.min(palette.length - 2, Math.floor(phase / seg));
    var local = (phase - i * seg) / seg;
    c.copy(palette[i]).lerp(palette[i + 1], local);
    return c;
  }

  var FILAMENT_COUNT = prefersReduced ? 14 : isMobile ? 24 : 34;
  var PTS_PER = prefersReduced ? 75 : isMobile ? 100 : 130;
  var WAVE_STRANDS = 11;
  var WAVE_PTS = prefersReduced ? 480 : isMobile ? 720 : 1000;
  var HOTSPOT_COUNT = prefersReduced ? 2 : 3;
  var HOTSPOT_PTS = prefersReduced ? 140 : isMobile ? 200 : 280;
  var DRIFT = prefersReduced ? 80 : isMobile ? 130 : 200;

  var TOTAL =
    FILAMENT_COUNT * PTS_PER +
    WAVE_PTS +
    HOTSPOT_COUNT * HOTSPOT_PTS +
    DRIFT;

  var filaments = [];
  for (var f = 0; f < FILAMENT_COUNT; f++) {
    filaments.push({
      cx: (Math.random() - 0.5) * 17,
      cy: (Math.random() - 0.5) * 8,
      length: 4.5 + Math.random() * 10,
      angle: Math.random() * Math.PI * 2,
      curve: 0.55 + Math.random() * 1.55,
      thickness: 0.018 + Math.random() * 0.045,
      speed: 0.028 + Math.random() * 0.055,
      seed: Math.random() * 100,
      z: -0.8 + Math.random() * 2.0,
      branch: f % 3 === 0 ? 0.28 + Math.random() * 0.4 : 0,
    });
  }

  var hotspots = [];
  for (var h = 0; h < HOTSPOT_COUNT; h++) {
    hotspots.push({
      x: (Math.random() - 0.5) * 10,
      y: (Math.random() - 0.5) * 5,
      z: (Math.random() - 0.5) * 2,
      radius: 0.4 + Math.random() * 0.55,
      phase: 0,
      nextBurst: 1.2 + Math.random() * 2,
      intensity: 0,
      active: false,
    });
  }

  var positions = new Float32Array(TOTAL * 3);
  var colors = new Float32Array(TOTAL * 3);
  var sizes = new Float32Array(TOTAL);
  var alphas = new Float32Array(TOTAL);
  var kind = new Uint8Array(TOTAL);
  var metaA = new Float32Array(TOTAL);
  var metaB = new Float32Array(TOTAL);
  var metaC = new Float32Array(TOTAL);
  var metaD = new Float32Array(TOTAL);

  var idx = 0;

  for (var fi = 0; fi < FILAMENT_COUNT; fi++) {
    var fil = filaments[fi];
    for (var p = 0; p < PTS_PER; p++) {
      var t = p / (PTS_PER - 1);
      kind[idx] = 0;
      metaA[idx] = fi;
      metaB[idx] = t + Math.random() * 0.005;
      metaC[idx] = (Math.random() - 0.5) * 2;
      metaD[idx] = 0.6 + Math.random() * 0.8;

      var c = filamentColor(t, fil.seed * 0.01);
      if (Math.random() > 0.93) c.copy(COL.orange).lerp(COL.gold, Math.random());

      colors[idx * 3] = Math.min(1, c.r * 1.05);
      colors[idx * 3 + 1] = Math.min(1, c.g * 1.05);
      colors[idx * 3 + 2] = Math.min(1, c.b * 1.05);

      sizes[idx] = Math.random() > 0.88 ? 3.0 + Math.random() * 1.5 : 1.7 + Math.random() * 1.2;
      alphas[idx] = 0.52 + Math.random() * 0.35;
      idx++;
    }
  }

  for (var w = 0; w < WAVE_PTS; w++) {
    kind[idx] = 1;
    metaA[idx] = w / (WAVE_PTS - 1);
    metaB[idx] = w % WAVE_STRANDS;
    metaC[idx] = Math.random();
    metaD[idx] = 0.8 + Math.random() * 0.4;

    var wc = COL.cyan.clone().lerp(COL.blue, Math.random() * 0.25);
    if (Math.random() > 0.95) wc.copy(COL.blue).lerp(COL.indigo, 0.25);
    colors[idx * 3] = Math.min(1, wc.r * 1.15);
    colors[idx * 3 + 1] = Math.min(1, wc.g * 1.15);
    colors[idx * 3 + 2] = Math.min(1, wc.b * 1.1);
    sizes[idx] = 3.0 + Math.random() * 2.0;
    alphas[idx] = 0.9 + Math.random() * 0.1;
    idx++;
  }

  for (var hi = 0; hi < HOTSPOT_COUNT; hi++) {
    for (var hp = 0; hp < HOTSPOT_PTS; hp++) {
      kind[idx] = 2;
      metaA[idx] = hi;
      metaB[idx] = Math.random() * Math.PI * 2;
      metaC[idx] = Math.pow(Math.random(), 0.5);
      metaD[idx] = 0.5 + Math.random() * 1.1;

      var hc =
        Math.random() < 0.55
          ? COL.orange.clone().lerp(COL.gold, Math.random())
          : COL.hot.clone().lerp(COL.orange, Math.random());
      if (Math.random() > 0.88) hc.copy(COL.magenta).lerp(COL.hot, 0.5);

      colors[idx * 3] = hc.r;
      colors[idx * 3 + 1] = hc.g;
      colors[idx * 3 + 2] = hc.b;
      sizes[idx] = 2.0 + Math.random() * 1.6;
      alphas[idx] = 0;
      idx++;
    }
  }

  for (var d = 0; d < DRIFT; d++) {
    kind[idx] = 3;
    metaA[idx] = Math.random() * 1000;
    metaB[idx] = (Math.random() - 0.5) * 22;
    metaC[idx] = (Math.random() - 0.5) * 12;
    metaD[idx] = (Math.random() - 0.5) * 4;

    var dc = filamentColor(Math.random(), Math.random());
    colors[idx * 3] = dc.r * 0.75;
    colors[idx * 3 + 1] = dc.g * 0.75;
    colors[idx * 3 + 2] = dc.b * 0.75;
    sizes[idx] = 1.2 + Math.random() * 1.0;
    alphas[idx] = 0.18 + Math.random() * 0.22;
    positions[idx * 3] = metaB[idx];
    positions[idx * 3 + 1] = metaC[idx];
    positions[idx * 3 + 2] = metaD[idx];
    idx++;
  }

  var geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));

  var material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader: [
      "attribute float aSize;",
      "attribute float aAlpha;",
      "attribute vec3 aColor;",
      "varying vec3 vColor;",
      "varying float vAlpha;",
      "uniform float uPixelRatio;",
      "void main() {",
      "  vColor = aColor;",
      "  vAlpha = aAlpha;",
      "  vec4 mv = modelViewMatrix * vec4(position, 1.0);",
      "  float dist = max(-mv.z, 0.5);",
      "  gl_PointSize = max(2.0, aSize * uPixelRatio * (11.0 / dist));",
      "  gl_Position = projectionMatrix * mv;",
      "}",
    ].join("\n"),
    fragmentShader: [
      "varying vec3 vColor;",
      "varying float vAlpha;",
      "void main() {",
      "  vec2 uv = gl_PointCoord - vec2(0.5);",
      "  float d = length(uv);",
      "  if (d > 0.5) discard;",
      "  float soft = 1.0 - smoothstep(0.1, 0.5, d);",
      "  float core = 1.0 - smoothstep(0.0, 0.16, d);",
      "  vec3 col = vColor * (1.05 + core * 0.95);",
      "  gl_FragColor = vec4(col, soft * min(vAlpha * 1.12, 1.0));",
      "}",
    ].join("\n"),
  });

  var points = new THREE.Points(geometry, material);
  scene.add(points);

  var posAttr = geometry.getAttribute("position");
  var alphaAttr = geometry.getAttribute("aAlpha");
  var sizeAttr = geometry.getAttribute("aSize");

  function sampleFilament(fil, t, time) {
    var n1 = noise2(t * 3.0 + fil.seed, time * 0.07 + fil.seed * 0.1);
    var n2 = noise2(t * 5.0 + fil.seed * 2, time * 0.1);
    var n3 = noise2(fil.seed, t * 2.0 + time * 0.04);

    var ang = fil.angle + (n1 - 0.5) * fil.curve;
    var px = fil.cx + Math.cos(ang) * fil.length * (t - 0.5);
    var py = fil.cy + Math.sin(ang) * fil.length * (t - 0.5);

    px += Math.sin(t * Math.PI * 2 + fil.seed) * fil.curve * 0.9;
    py += Math.cos(t * Math.PI * 1.5 + fil.seed * 1.3) * fil.curve * 0.7;
    px += (n2 - 0.5) * 0.7;
    py += (n3 - 0.5) * 0.7;

    if (fil.branch > 0 && t > 0.45 && t < 0.85) {
      var bt = (t - 0.45) / 0.4;
      px += Math.sin(fil.angle + 1.1) * fil.branch * bt * fil.length * 0.35;
      py += Math.cos(fil.angle + 1.1) * fil.branch * bt * fil.length * 0.35;
    }

    return { x: px, y: py, z: fil.z + (n1 - 0.5) * 0.5 };
  }

  function resize() {
    var parent = canvas.parentElement || document.body;
    var w = parent.clientWidth || window.innerWidth;
    var h = parent.clientHeight || window.innerHeight;
    if (w < 2 || h < 2) {
      w = window.innerWidth;
      h = window.innerHeight;
    }
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    material.uniforms.uPixelRatio.value = Math.min(
      window.devicePixelRatio || 1,
      2
    );
  }

  resize();
  window.addEventListener("resize", resize);
  /* Hero may layout after first paint */
  requestAnimationFrame(resize);
  setTimeout(resize, 100);

  function onPointerMove(e) {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    mouseTarget.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseTarget.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function onPointerLeave() {
    mouseTarget.set(0, 0);
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave);

  var clock = new THREE.Clock();
  var running = true;
  var motionScale = prefersReduced ? 0.2 : 1;

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);

    var dt = Math.min(clock.getDelta(), 0.05);
    var time = clock.elapsedTime;

    mouse.x += (mouseTarget.x - mouse.x) * 0.05;
    mouse.y += (mouseTarget.y - mouse.y) * 0.05;
    var mx = mouse.x * 8;
    var my = mouse.y * 4.5;

    for (var hi = 0; hi < HOTSPOT_COUNT; hi++) {
      var hs = hotspots[hi];
      if (!hs.active && time >= hs.nextBurst && !prefersReduced) {
        hs.active = true;
        hs.intensity = 0;
        hs.phase = 0;
        hs.x = (Math.random() - 0.5) * 10 + mouse.x;
        hs.y = (Math.random() - 0.5) * 4.5 + mouse.y * 0.8;
        hs.z = (Math.random() - 0.5) * 2;
        hs.radius = 0.4 + Math.random() * 0.55;
      }
      if (hs.active) {
        hs.phase += dt;
        if (hs.phase < 0.35) hs.intensity = hs.phase / 0.35;
        else if (hs.phase < 1.4) hs.intensity = 1;
        else if (hs.phase < 2.4) hs.intensity = 1 - (hs.phase - 1.4) / 1.0;
        else {
          hs.active = false;
          hs.intensity = 0;
          hs.nextBurst = time + 3 + Math.random() * 4;
        }
      }
    }

    for (var fi = 0; fi < FILAMENT_COUNT; fi++) {
      var fil = filaments[fi];
      fil.cx += Math.sin(time * 0.06 + fil.seed) * 0.0016 * motionScale;
      fil.cy += Math.cos(time * 0.045 + fil.seed * 1.4) * 0.001 * motionScale;
      fil.angle += fil.speed * 0.01 * dt * 60 * motionScale;
    }

    for (var i = 0; i < TOTAL; i++) {
      var ix = i * 3;
      var k = kind[i];

      if (k === 0) {
        var fRef = filaments[metaA[i] | 0];
        var tt = (metaB[i] + time * fRef.speed * 0.06 * motionScale) % 1;
        var pos = sampleFilament(fRef, tt, time);
        var jitter =
          (noise2(tt * 18 + fRef.seed, metaC[i] * 3) - 0.5) *
          fRef.thickness *
          6 *
          metaD[i];
        pos.x += Math.cos(fRef.angle + 1.57) * jitter;
        pos.y += Math.sin(fRef.angle + 1.57) * jitter;

        var dx = pos.x - mx;
        var dy = pos.y - my;
        var d2 = dx * dx + dy * dy;
        if (d2 < 14) {
          var force = (1 - d2 / 14) * 0.2;
          pos.x += -dy * force * 0.12;
          pos.y += dx * force * 0.12;
        }

        positions[ix] = pos.x;
        positions[ix + 1] = pos.y;
        positions[ix + 2] = pos.z;
        alphas[i] = (0.38 + Math.sin(tt * Math.PI) * 0.4) * (0.8 + 0.2 * metaD[i]);
      } else if (k === 1) {
        var u = metaA[i];
        var strand = metaB[i];
        var x = (u - 0.5) * 15.5;
        var wave =
          Math.sin(u * Math.PI * 3.5 + time * 1.3 + strand * 0.48) * 0.85 +
          Math.sin(u * Math.PI * 6.5 + time * 1.9 + strand * 0.85) * 0.32 +
          Math.sin(u * Math.PI * 2.0 + time * 0.5 + strand * 0.18) * 0.22;
        var yOff = (strand - (WAVE_STRANDS - 1) / 2) * 0.072;

        var mdx = x - mx;
        var mdy = wave - my;
        var md2 = mdx * mdx + mdy * mdy;
        if (md2 < 12) wave += (1 - md2 / 12) * 0.35 * Math.sin(time * 4);

        positions[ix] = x;
        positions[ix + 1] = wave + yOff;
        positions[ix + 2] = 0.6 + Math.sin(u * 5 + time * 0.7 + strand) * 0.25;
        alphas[i] = (0.85 + 0.15 * Math.sin(u * Math.PI)) * metaD[i];
        sizes[i] = 3.0 + metaC[i] * 1.4 + Math.abs(wave) * 0.15;
      } else if (k === 2) {
        var hRef = hotspots[metaA[i] | 0];
        var ang = metaB[i] + time * metaD[i] * 0.28;
        var spray = metaC[i] * hRef.radius * (0.8 + hRef.intensity * 1.1);
        spray *= 1 + hRef.intensity * 0.7 * metaC[i];

        positions[ix] = hRef.x + Math.cos(ang) * spray;
        positions[ix + 1] = hRef.y + Math.sin(ang) * spray * 0.85;
        positions[ix + 2] = hRef.z + (metaC[i] - 0.5) * 0.6;

        var coreBoost = 1 - metaC[i];
        alphas[i] = hRef.intensity * (0.25 + coreBoost * 0.7);
        sizes[i] =
          (2.0 + coreBoost * 1.6) * (0.85 + hRef.intensity * 0.55);
      } else {
        positions[ix] =
          metaB[i] + Math.sin(time * 0.1 + metaA[i]) * 0.3 * motionScale;
        positions[ix + 1] =
          metaC[i] + Math.cos(time * 0.08 + metaA[i] * 0.7) * 0.22 * motionScale;
        positions[ix + 2] = metaD[i];
      }
    }

    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;

    camera.position.x = mouse.x * 0.3;
    camera.position.y = mouse.y * 0.18;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  animate();

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      running = false;
    } else {
      running = true;
      clock.getDelta();
      animate();
    }
  });
})();
