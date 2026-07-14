/**
 * Dynamic 3D brain hero — black background.
 * Layered transparent brain art + parallax + glowing particle filaments.
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
  scene.fog = new THREE.FogExp2(0x000000, 0.018);

  var camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0.15, 9.2);

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

  /* ── Soft radial glow behind brain ── */
  function makeGlowTexture() {
    var size = 256;
    var c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    var ctx = c.getContext("2d");
    var g = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    g.addColorStop(0, "rgba(80, 160, 255, 0.55)");
    g.addColorStop(0.25, "rgba(180, 80, 255, 0.22)");
    g.addColorStop(0.55, "rgba(255, 120, 60, 0.1)");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    var tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  var glowMat = new THREE.MeshBasicMaterial({
    map: makeGlowTexture(),
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  var glow = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), glowMat);
  glow.position.z = -1.6;
  scene.add(glow);

  /* ── Brain group (layered for depth) ── */
  var brainGroup = new THREE.Group();
  brainGroup.position.set(0, 0.05, 0);
  scene.add(brainGroup);

  var loader = new THREE.TextureLoader();
  var brainUrl = "assets/brain-hero-square.png";

  function makeBrainLayer(texture, scale, z, opacity, tint) {
    var aspect = texture.image
      ? texture.image.width / Math.max(texture.image.height, 1)
      : 2;
    var h = scale;
    var w = scale * aspect;
    var mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
      color: tint || 0xffffff,
    });
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.z = z;
    return mesh;
  }

  var layers = [];
  var brainReady = false;

  loader.load(
    brainUrl,
    function (tex) {
      tex.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

      var baseScale = isMobile ? 5.6 : 6.8;

      /* Back soft duplicate — depth / bloom feel */
      var back = makeBrainLayer(tex, baseScale * 1.06, -0.55, 0.28, 0x88aaff);
      back.material.blending = THREE.AdditiveBlending;
      brainGroup.add(back);
      layers.push({ mesh: back, parallax: 0.35, floatAmp: 0.04 });

      /* Mid glow plate */
      var mid = makeBrainLayer(tex, baseScale * 1.02, -0.22, 0.45, 0xffccaa);
      mid.material.blending = THREE.AdditiveBlending;
      brainGroup.add(mid);
      layers.push({ mesh: mid, parallax: 0.55, floatAmp: 0.06 });

      /* Main sharp brain */
      var main = makeBrainLayer(tex, baseScale, 0, 1, 0xffffff);
      brainGroup.add(main);
      layers.push({ mesh: main, parallax: 0.85, floatAmp: 0.08 });

      /* Front highlight fringe */
      var front = makeBrainLayer(tex, baseScale * 0.98, 0.28, 0.22, 0xaaddff);
      front.material.blending = THREE.AdditiveBlending;
      brainGroup.add(front);
      layers.push({ mesh: front, parallax: 1.15, floatAmp: 0.1 });

      brainReady = true;
    },
    undefined,
    function () {
      console.error("[neural] Failed to load brain image:", brainUrl);
    }
  );

  /* ── Orbiting colorful filaments (particles) ── */
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

  var COLS = [
    new THREE.Color(0x3d8cff),
    new THREE.Color(0x4ecfff),
    new THREE.Color(0x2ee6c5),
    new THREE.Color(0x8b5cf6),
    new THREE.Color(0xd44dff),
    new THREE.Color(0xff5cb0),
    new THREE.Color(0xff6a2a),
    new THREE.Color(0xffb347),
  ];

  var FILAMENT_COUNT = prefersReduced ? 10 : isMobile ? 16 : 24;
  var PTS_PER = prefersReduced ? 50 : isMobile ? 70 : 95;
  var SPARK_COUNT = prefersReduced ? 80 : isMobile ? 140 : 220;
  var TOTAL = FILAMENT_COUNT * PTS_PER + SPARK_COUNT;

  var filaments = [];
  for (var f = 0; f < FILAMENT_COUNT; f++) {
    filaments.push({
      radius: 2.2 + Math.random() * 2.8,
      elev: (Math.random() - 0.5) * 1.8,
      angle0: Math.random() * Math.PI * 2,
      twist: 0.4 + Math.random() * 1.6,
      speed: 0.08 + Math.random() * 0.18,
      seed: Math.random() * 100,
      colorIdx: f % COLS.length,
      zBias: -0.4 + Math.random() * 1.6,
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
      metaB[idx] = t;
      metaC[idx] = (Math.random() - 0.5) * 2;
      metaD[idx] = 0.6 + Math.random() * 0.8;

      var c0 = COLS[fil.colorIdx].clone();
      var c1 = COLS[(fil.colorIdx + 1) % COLS.length];
      c0.lerp(c1, t);
      colors[idx * 3] = c0.r;
      colors[idx * 3 + 1] = c0.g;
      colors[idx * 3 + 2] = c0.b;
      sizes[idx] = 1.4 + Math.random() * 1.8;
      alphas[idx] = 0.35 + Math.random() * 0.45;
      idx++;
    }
  }

  for (var s = 0; s < SPARK_COUNT; s++) {
    kind[idx] = 1;
    metaA[idx] = Math.random() * 1000;
    metaB[idx] = Math.random() * Math.PI * 2;
    metaC[idx] = 1.5 + Math.random() * 3.5;
    metaD[idx] = (Math.random() - 0.5) * 2.2;

    var sc = COLS[s % COLS.length];
    colors[idx * 3] = sc.r;
    colors[idx * 3 + 1] = sc.g;
    colors[idx * 3 + 2] = sc.b;
    sizes[idx] = 1.0 + Math.random() * 1.6;
    alphas[idx] = 0.2 + Math.random() * 0.45;
    idx++;
  }

  var pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  pGeo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  pGeo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));

  var pMat = new THREE.ShaderMaterial({
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
      "  gl_PointSize = max(1.5, aSize * uPixelRatio * (10.0 / dist));",
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
      "  float soft = 1.0 - smoothstep(0.08, 0.5, d);",
      "  float core = 1.0 - smoothstep(0.0, 0.15, d);",
      "  vec3 col = vColor * (0.95 + core * 0.9);",
      "  gl_FragColor = vec4(col, soft * vAlpha);",
      "}",
    ].join("\n"),
  });

  var particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  var posAttr = pGeo.getAttribute("position");
  var alphaAttr = pGeo.getAttribute("aAlpha");

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
    pMat.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, 2);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(resize);
  setTimeout(resize, 120);

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
  var motionScale = prefersReduced ? 0.15 : 1;

  function animate() {
    if (!running) return;
    requestAnimationFrame(animate);

    var dt = Math.min(clock.getDelta(), 0.05);
    var time = clock.elapsedTime;

    mouse.x += (mouseTarget.x - mouse.x) * 0.05;
    mouse.y += (mouseTarget.y - mouse.y) * 0.05;

    /* Brain: slow yaw / pitch + float — stereoscopic feel */
    if (brainReady) {
      var rotY = Math.sin(time * 0.22 * motionScale) * 0.22 + mouse.x * 0.28;
      var rotX = Math.sin(time * 0.17 * motionScale) * 0.08 + mouse.y * 0.16;
      brainGroup.rotation.y = rotY;
      brainGroup.rotation.x = rotX;
      brainGroup.position.y = 0.05 + Math.sin(time * 0.55 * motionScale) * 0.12;
      brainGroup.position.x = mouse.x * 0.15;

      for (var li = 0; li < layers.length; li++) {
        var L = layers[li];
        var px = mouse.x * 0.35 * L.parallax;
        var py = mouse.y * 0.25 * L.parallax;
        L.mesh.position.x = px;
        L.mesh.position.y =
          py + Math.sin(time * 0.7 + li) * L.floatAmp * motionScale;
      }
    }

    /* Soft pulsing glow */
    glow.material.opacity = 0.55 + Math.sin(time * 0.9) * 0.18;
    glow.scale.setScalar(1 + Math.sin(time * 0.6) * 0.06);
    glow.position.x = mouse.x * 0.4;
    glow.position.y = mouse.y * 0.25;

    /* Filaments orbit around brain */
    for (var i = 0; i < TOTAL; i++) {
      var ix = i * 3;
      if (kind[i] === 0) {
        var fRef = filaments[metaA[i] | 0];
        var tt = metaB[i];
        var ang =
          fRef.angle0 +
          tt * Math.PI * 2 * fRef.twist +
          time * fRef.speed * motionScale;
        var n =
          noise2(tt * 4 + fRef.seed, time * 0.15 + fRef.seed * 0.05) - 0.5;
        var r = fRef.radius + n * 0.35 + Math.sin(tt * Math.PI * 3 + time) * 0.15;
        var y =
          fRef.elev +
          Math.sin(ang * 1.5 + fRef.seed) * 0.55 +
          n * 0.4 +
          metaC[i] * 0.08;
        var x = Math.cos(ang) * r;
        var z = Math.sin(ang) * r * 0.55 + fRef.zBias;

        positions[ix] = x;
        positions[ix + 1] = y;
        positions[ix + 2] = z;
        alphas[i] = (0.25 + Math.sin(tt * Math.PI) * 0.55) * metaD[i];
      } else {
        var ang2 = metaB[i] + time * (0.12 + (metaA[i] % 1) * 0.2) * motionScale;
        var rr = metaC[i] + Math.sin(time * 0.4 + metaA[i]) * 0.2;
        positions[ix] = Math.cos(ang2) * rr;
        positions[ix + 1] =
          metaD[i] + Math.sin(time * 0.5 + metaA[i]) * 0.25;
        positions[ix + 2] = Math.sin(ang2) * rr * 0.5;
        alphas[i] = 0.15 + 0.35 * (0.5 + 0.5 * Math.sin(time * 2 + metaA[i]));
      }
    }

    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;

    camera.position.x = mouse.x * 0.45;
    camera.position.y = 0.15 + mouse.y * 0.28;
    camera.lookAt(0, 0.05, 0);

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
