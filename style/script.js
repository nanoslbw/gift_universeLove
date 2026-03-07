// ═══════════════════════════════════════════════════════════════
// INTRO SCREENS
// ═══════════════════════════════════════════════════════════════
var screen1 = document.getElementById('screen1');
var screen2a = document.getElementById('screen2a');
var screen2b = document.getElementById('screen2b');
var btnCorrect = document.getElementById('btnCorrect');
var btnWrong = document.getElementById('btnWrong');
var btnRetry = document.getElementById('btnRetry');

function showScreen(screen) {
  document.querySelectorAll('.screen').forEach(function (s) {
    s.classList.remove('active');
  });
  if (screen) {
    screen.classList.add('active');
  }
}

btnCorrect.addEventListener('click', function () {
  showScreen(screen2a);
  setTimeout(function () {
    showScreen(null);
    startMainExperience();
  }, 3000);
});

btnWrong.addEventListener('click', function () {
  showScreen(screen2b);
});

btnRetry.addEventListener('click', function () {
  showScreen(screen1);
});

// ═══════════════════════════════════════════════════════════════
// MAIN EXPERIENCE (fireworks + galaxy + music)
// Called after intro screens complete
// ═══════════════════════════════════════════════════════════════
function startMainExperience() {
  // ─── Mobile Detection ────────────────────────────────────────
  var isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || (window.innerWidth <= 768);
  var HEART_COUNT = isMobile ? 15000 : 35000;
  var BAND_COUNT = isMobile ? 10000 : 25000;
  var PARTICLE_SIZE = isMobile ? 0.10 : 0.08;
  var BAND_PARTICLE_SIZE = isMobile ? 0.10 : 0.08;

  // ─── Simple Orbit Controls ──────────────────────────────────
  function SimpleOrbitControls(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.target = new THREE.Vector3(0, 0, 0);
    this.enableDamping = true;
    this.dampingFactor = 0.05;
    this.autoRotate = true;
    this.autoRotateSpeed = 0.3;
    this.minDistance = 4;
    this.maxDistance = 30;

    var spherical = new THREE.Spherical();
    var offset = new THREE.Vector3();
    offset.copy(camera.position).sub(this.target);
    spherical.setFromVector3(offset);

    var rotateStart = new THREE.Vector2();
    var isPointerDown = false;
    var deltaTheta = 0;
    var deltaPhi = 0;
    var self = this;

    function onPointerDown(e) {
      isPointerDown = true;
      rotateStart.set(e.clientX, e.clientY);
    }
    function onPointerMove(e) {
      if (!isPointerDown) return;
      var dx = e.clientX - rotateStart.x;
      var dy = e.clientY - rotateStart.y;
      deltaTheta -= dx * 0.005;
      deltaPhi -= dy * 0.005;
      rotateStart.set(e.clientX, e.clientY);
    }
    function onPointerUp() {
      isPointerDown = false;
    }
    function onWheel(e) {
      if (e.deltaY > 0) {
        spherical.radius = Math.min(spherical.radius * 1.1, self.maxDistance);
      } else {
        spherical.radius = Math.max(spherical.radius * 0.9, self.minDistance);
      }
    }

    var lastTouchDist = 0;
    function onTouchStart(e) {
      if (e.touches.length === 1) {
        isPointerDown = true;
        rotateStart.set(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2) {
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      }
    }
    function onTouchMove(e) {
      e.preventDefault();
      if (e.touches.length === 1 && isPointerDown) {
        var dx = e.touches[0].clientX - rotateStart.x;
        var dy = e.touches[0].clientY - rotateStart.y;
        deltaTheta -= dx * 0.005;
        deltaPhi -= dy * 0.005;
        rotateStart.set(e.touches[0].clientX, e.touches[0].clientY);
      } else if (e.touches.length === 2) {
        var tdx = e.touches[0].clientX - e.touches[1].clientX;
        var tdy = e.touches[0].clientY - e.touches[1].clientY;
        var dist = Math.sqrt(tdx * tdx + tdy * tdy);
        if (lastTouchDist > 0) {
          var ratio = lastTouchDist / dist;
          spherical.radius = Math.min(Math.max(spherical.radius * ratio, self.minDistance), self.maxDistance);
        }
        lastTouchDist = dist;
      }
    }
    function onTouchEnd() {
      isPointerDown = false;
      lastTouchDist = 0;
    }

    domElement.addEventListener('pointerdown', onPointerDown);
    domElement.addEventListener('pointermove', onPointerMove);
    domElement.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('pointerleave', onPointerUp);
    domElement.addEventListener('wheel', onWheel, { passive: true });
    domElement.addEventListener('touchstart', onTouchStart, { passive: false });
    domElement.addEventListener('touchmove', onTouchMove, { passive: false });
    domElement.addEventListener('touchend', onTouchEnd);

    this.update = function () {
      if (self.autoRotate && !isPointerDown) {
        deltaTheta -= self.autoRotateSpeed * 0.001;
      }
      spherical.theta += deltaTheta;
      spherical.phi += deltaPhi;
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
      if (self.enableDamping) {
        deltaTheta *= (1 - self.dampingFactor);
        deltaPhi *= (1 - self.dampingFactor);
      } else {
        deltaTheta = 0;
        deltaPhi = 0;
      }
      offset.setFromSpherical(spherical);
      camera.position.copy(self.target).add(offset);
      camera.lookAt(self.target);
    };
  }

  // ─── Three.js Scene Setup ─────────────────────────────────────
  var canvas = document.getElementById('galaxyCanvas');
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.setClearColor(0x000000);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 12);

  var controls = new SimpleOrbitControls(camera, renderer.domElement);
  controls.minDistance = 4;
  controls.maxDistance = 30;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.3;

  // ─── Particle Texture ─────────────────────────────────────────
  function createParticleTexture() {
    var size = 64;
    var c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    var ctx = c.getContext('2d');
    var gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  var particleTexture = createParticleTexture();

  // ─── Color Palette ────────────────────────────────────────────
  var COLORS = [
    new THREE.Color(0x8B5CF6),
    new THREE.Color(0xA855F7),
    new THREE.Color(0xD946EF),
    new THREE.Color(0xEC4899),
    new THREE.Color(0x7C3AED),
    new THREE.Color(0xC084FC),
  ];

  var HEART_COLORS = [
    new THREE.Color(0xFF4D6D),
    new THREE.Color(0xFF6B8A),
    new THREE.Color(0xFF5CAD),
    new THREE.Color(0xFF85C8),
    new THREE.Color(0xE960FF),
    new THREE.Color(0xFF7BAA),
    new THREE.Color(0xFF3399),
    new THREE.Color(0xFF1A75),
    new THREE.Color(0xFFAACC),
    new THREE.Color(0xFF6699),
  ];

  function randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  function randomHeartColor() {
    return HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)];
  }

  // ─── Heart Shape Formula ──────────────────────────────────────
  function heartShape2D(t) {
    var x = 16 * Math.pow(Math.sin(t), 3);
    var y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return { x: x, y: y };
  }

  // ─── Particle System 1: 3D Heart Globe ─────────────────────────
  // Creates a solid 3D heart by revolving the 2D heart shape around Y axis
  // Particles concentrated on the surface like a planet
  function createHeartParticles(count, scale) {
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var basePositions = new Float32Array(count * 3);

    for (var i = 0; i < count; i++) {
      // Pick a random angle on the heart curve
      var t = Math.random() * Math.PI * 2;
      var heart = heartShape2D(t);

      // 2D heart profile: hx is the "radius" from center, hy is vertical
      var profileR = Math.abs(heart.x); // distance from center axis
      var profileY = heart.y;

      // Revolve around Y axis: pick random angle phi around the axis
      var phi = Math.random() * Math.PI * 2;

      // Surface vs interior: 80% on surface shell, 20% inside for volume
      var shellFactor = Math.random() < 0.8
        ? (0.92 + Math.random() * 0.08) // surface shell (92-100%)
        : Math.pow(Math.random(), 0.5);  // interior with bias toward outside

      var r = profileR * shellFactor;

      var px = r * Math.cos(phi) * scale;
      var py = profileY * scale * (0.95 + shellFactor * 0.05);
      var pz = r * Math.sin(phi) * scale;

      // Add tiny noise for organic feel
      px += (Math.random() - 0.5) * 0.04;
      py += (Math.random() - 0.5) * 0.04;
      pz += (Math.random() - 0.5) * 0.04;

      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;
      basePositions[i * 3] = px;
      basePositions[i * 3 + 1] = py;
      basePositions[i * 3 + 2] = pz;

      // Surface particles much brighter, interior dimmer
      var color = randomHeartColor();
      var brightness = shellFactor * 0.4 + 0.7;
      colors[i * 3] = color.r * brightness;
      colors[i * 3 + 1] = color.g * brightness;
      colors[i * 3 + 2] = color.b * brightness;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    var material = new THREE.PointsMaterial({
      size: PARTICLE_SIZE,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    var points = new THREE.Points(geometry, material);
    points.userData.basePositions = basePositions;
    return points;
  }

  // ─── Particle System 2: Orbital Galaxy Disk ────────────────────
  function createWaveBandParticles(count, sphereRadius) {
    var geometry = new THREE.BufferGeometry();
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);

    var innerRadius = sphereRadius * 1.2;  // start just outside the heart
    var outerRadius = sphereRadius * 4.0;  // extend far out

    for (var i = 0; i < count; i++) {
      // Radial distance from center with density falling off
      var rFactor = Math.pow(Math.random(), 0.6);
      var r = innerRadius + rFactor * (outerRadius - innerRadius);

      // Angle around center
      var angle = Math.random() * Math.PI * 2;

      // Flat disk with slight thickness that increases toward edges
      var diskThickness = 0.15 + (r / outerRadius) * 0.4;
      var yOffset = (Math.random() - 0.5) * diskThickness * sphereRadius;

      // Add spiral arm structure
      var spiralAngle = angle + (r / outerRadius) * Math.PI * 1.5;
      var armStrength = Math.sin(spiralAngle * 2) * 0.3;
      yOffset += armStrength * (r / outerRadius) * sphereRadius;

      var x = r * Math.cos(angle);
      var y = yOffset;
      var z = r * Math.sin(angle);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      var color = randomColor();
      var brightness = 1.0 - rFactor * 0.4;
      colors[i * 3] = color.r * brightness;
      colors[i * 3 + 1] = color.g * brightness;
      colors[i * 3 + 2] = color.b * brightness;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    var material = new THREE.PointsMaterial({
      size: BAND_PARTICLE_SIZE,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    return new THREE.Points(geometry, material);
  }

  // ─── Photo Frames ─────────────────────────────────────────────
  var CARD_MESSAGES = [
    "Chúc mừng ngày 8/3 nha em!",
    "Em luôn xinh đẹp và tuyệt vời nhất!",
    "Cảm ơn em đã luôn ở bên anh",
    "Em là điều tuyệt vời nhất đến với anh",
    "Chúc em luôn hạnh phúc và rạng rỡ",
    "Yêu em nhiều lắm!",
    "Em xứng đáng nhận mọi điều tốt đẹp nhất",
    "Có em, mọi ngày đều là ngày đặc biệt",
    "Em là nắng ấm của anh",
    "Happy Women's Day!",
  ];

  // shape: 'square', 'rect', 'circle', 'rounded'
  var CARD_SHAPES = ['square', 'rect', 'circle', 'rounded'];

  function createCardTexture(color1, color2, text, shape) {
    var isCircle = shape === 'circle';
    var isRect = shape === 'rect';
    var w = isRect ? 384 : 256;
    var h = 256;

    var c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    var ctx = c.getContext('2d');

    // Draw shape with clipping
    ctx.save();
    ctx.beginPath();
    if (isCircle) {
      ctx.arc(w / 2, h / 2, h / 2 - 4, 0, Math.PI * 2);
    } else if (shape === 'rounded') {
      var r = 30;
      ctx.moveTo(r + 4, 4);
      ctx.lineTo(w - r - 4, 4);
      ctx.quadraticCurveTo(w - 4, 4, w - 4, r + 4);
      ctx.lineTo(w - 4, h - r - 4);
      ctx.quadraticCurveTo(w - 4, h - 4, w - r - 4, h - 4);
      ctx.lineTo(r + 4, h - 4);
      ctx.quadraticCurveTo(4, h - 4, 4, h - r - 4);
      ctx.lineTo(4, r + 4);
      ctx.quadraticCurveTo(4, 4, r + 4, 4);
    } else {
      ctx.rect(4, 4, w - 8, h - 8);
    }
    ctx.closePath();
    ctx.clip();

    // Gradient fill
    var gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    // Inner glow
    var innerGlow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
    innerGlow.addColorStop(0, 'rgba(255,255,255,0.18)');
    innerGlow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = innerGlow;
    ctx.fillRect(0, 0, w, h);

    ctx.restore();

    // Border
    ctx.beginPath();
    if (isCircle) {
      ctx.arc(w / 2, h / 2, h / 2 - 4, 0, Math.PI * 2);
    } else if (shape === 'rounded') {
      var r2 = 30;
      ctx.moveTo(r2 + 4, 4);
      ctx.lineTo(w - r2 - 4, 4);
      ctx.quadraticCurveTo(w - 4, 4, w - 4, r2 + 4);
      ctx.lineTo(w - 4, h - r2 - 4);
      ctx.quadraticCurveTo(w - 4, h - 4, w - r2 - 4, h - 4);
      ctx.lineTo(r2 + 4, h - 4);
      ctx.quadraticCurveTo(4, h - 4, 4, h - r2 - 4);
      ctx.lineTo(4, r2 + 4);
      ctx.quadraticCurveTo(4, 4, r2 + 4, 4);
    } else {
      ctx.rect(4, 4, w - 8, h - 8);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw text - auto-wrap to fit inside shape
    if (text) {
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 6;

      var padding = isCircle ? w * 0.22 : w * 0.12;
      var maxWidth = w - padding * 2;

      // Find font size that fits
      var fontSize = 38;
      var lines;
      while (fontSize > 14) {
        ctx.font = '700 ' + fontSize + 'px Quicksand, sans-serif';
        lines = wrapText(ctx, text, maxWidth);
        var totalH = lines.length * (fontSize * 1.3);
        var maxH = isCircle ? h * 0.6 : h * 0.8;
        if (totalH <= maxH) break;
        fontSize -= 2;
      }

      var lineHeight = fontSize * 1.3;
      var totalHeight = lines.length * lineHeight;
      var startY = (h - totalHeight) / 2 + lineHeight * 0.45;

      for (var li = 0; li < lines.length; li++) {
        ctx.fillText(lines[li], w / 2, startY + li * lineHeight, maxWidth);
      }
      ctx.shadowBlur = 0;
    }

    return new THREE.CanvasTexture(c);
  }

  function wrapText(ctx, text, maxWidth) {
    var words = text.split(' ');
    var lines = [];
    var currentLine = words[0];
    for (var i = 1; i < words.length; i++) {
      var testLine = currentLine + ' ' + words[i];
      if (ctx.measureText(testLine).width <= maxWidth) {
        currentLine = testLine;
      } else {
        lines.push(currentLine);
        currentLine = words[i];
      }
    }
    lines.push(currentLine);
    return lines;
  }

  var frameGradients = [
    ['rgba(255,107,157,0.35)', 'rgba(196,77,255,0.3)'],
    ['rgba(102,126,234,0.3)', 'rgba(118,75,162,0.35)'],
    ['rgba(240,147,251,0.3)', 'rgba(245,87,108,0.3)'],
    ['rgba(236,72,153,0.35)', 'rgba(217,70,239,0.3)'],
    ['rgba(251,113,133,0.3)', 'rgba(244,114,182,0.35)'],
    ['rgba(250,112,154,0.3)', 'rgba(254,225,64,0.25)'],
    ['rgba(161,140,209,0.3)', 'rgba(251,194,235,0.3)'],
    ['rgba(255,43,79,0.3)', 'rgba(255,95,122,0.35)'],
    ['rgba(255,154,158,0.3)', 'rgba(254,207,239,0.3)'],
    ['rgba(196,21,133,0.3)', 'rgba(236,72,153,0.35)'],
  ];

  function createPhotoFrames(count, sphereRadius) {
    var frames = [];
    var bandWidth = sphereRadius * 3.0;
    var bandThickness = sphereRadius * 0.8;
    for (var i = 0; i < count; i++) {
      var t = (i / (count - 1)) * 1.6 - 0.8;
      var x = t * bandWidth;
      var y = Math.sin(t * Math.PI * 1.2) * bandThickness;
      var z = (Math.random() - 0.5) * sphereRadius * 0.6;
      var grad = frameGradients[i % frameGradients.length];
      var msg = CARD_MESSAGES[i % CARD_MESSAGES.length];
      var shape = CARD_SHAPES[i % CARD_SHAPES.length];
      var texture = createCardTexture(grad[0], grad[1], msg, shape);

      var geoW, geoH;
      if (shape === 'rect') {
        geoW = 1.5 + Math.random() * 0.3;
        geoH = 1.0 + Math.random() * 0.2;
      } else if (shape === 'circle') {
        var s = 1.0 + Math.random() * 0.3;
        geoW = s;
        geoH = s;
      } else {
        geoW = 1.0 + Math.random() * 0.3;
        geoH = 1.0 + Math.random() * 0.3;
      }

      var geometry = new THREE.PlaneGeometry(geoW, geoH);
      var material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.75,
      });
      var mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      mesh.rotation.x = (Math.random() - 0.5) * 0.3;
      mesh.rotation.y = (Math.random() - 0.5) * 0.5;
      mesh.rotation.z = (Math.random() - 0.5) * 0.2;
      mesh.userData = {
        originalY: y,
        floatSpeed: 0.3 + Math.random() * 0.5,
        floatAmplitude: 0.05 + Math.random() * 0.1,
        phase: Math.random() * Math.PI * 2,
      };
      frames.push(mesh);
    }
    return frames;
  }

  // ─── Heart Fireworks Intro Effect ─────────────────────────────
  (function () {
    var fwCanvas = document.getElementById('fireworksCanvas');
    var fwCtx = fwCanvas.getContext('2d');
    var W, H;

    function resizeFW() {
      W = fwCanvas.width = window.innerWidth;
      H = fwCanvas.height = window.innerHeight;
    }
    resizeFW();
    window.addEventListener('resize', resizeFW);

    var heartScale = Math.min(W, H) * 0.018;
    var TOTAL_POINTS = 200;
    var heartPoints = [];
    for (var i = 0; i < TOTAL_POINTS; i++) {
      var t = (i / TOTAL_POINTS) * Math.PI * 2;
      var hx = 16 * Math.pow(Math.sin(t), 3);
      var hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      heartPoints.push({
        x: W / 2 + hx * heartScale,
        y: H / 2 + hy * heartScale - 20
      });
    }

    var sparkles = [];
    var traceIndex = 0;
    var traceSpeed = 3;
    var tracing = true;
    var holdTimer = 0;
    var HOLD_FRAMES = 60;
    var fadeAlpha = 1;
    var fading = false;
    var introComplete = false;
    var burstParticles = [];
    var burstFired = false;

    function addSparkles(px, py) {
      sparkles.push({
        x: px, y: py,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        life: 1.0,
        decay: 0.008 + Math.random() * 0.008,
        size: 2 + Math.random() * 3,
        hue: 330 + Math.random() * 50
      });
      for (var s = 0; s < 3; s++) {
        sparkles.push({
          x: px + (Math.random() - 0.5) * 8,
          y: py + (Math.random() - 0.5) * 8,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3 - 1,
          life: 0.7 + Math.random() * 0.3,
          decay: 0.015 + Math.random() * 0.015,
          size: 1 + Math.random() * 2,
          hue: 280 + Math.random() * 80
        });
      }
    }

    function fireBurst() {
      for (var i = 0; i < TOTAL_POINTS; i += 2) {
        var hp = heartPoints[i];
        var angle = Math.atan2(hp.y - H / 2, hp.x - W / 2);
        var speed = 2 + Math.random() * 4;
        burstParticles.push({
          x: hp.x, y: hp.y,
          vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 2,
          vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 2,
          life: 1.0,
          decay: 0.01 + Math.random() * 0.01,
          size: 2 + Math.random() * 3,
          hue: 300 + Math.random() * 60
        });
      }
      for (var j = 0; j < 80; j++) {
        var a = Math.random() * Math.PI * 2;
        var sp = 1 + Math.random() * 6;
        burstParticles.push({
          x: W / 2, y: H / 2 - 20,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1.0,
          decay: 0.008 + Math.random() * 0.012,
          size: 1.5 + Math.random() * 3,
          hue: 320 + Math.random() * 40
        });
      }
    }

    function animateFW() {
      if (introComplete) return;

      fwCtx.globalCompositeOperation = 'source-over';
      fwCtx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      fwCtx.fillRect(0, 0, W, H);
      fwCtx.globalCompositeOperation = 'lighter';

      if (tracing) {
        for (var t = 0; t < traceSpeed; t++) {
          if (traceIndex < TOTAL_POINTS) {
            var pt = heartPoints[traceIndex];
            addSparkles(pt.x, pt.y);
            traceIndex++;
          }
        }
        if (traceIndex >= TOTAL_POINTS) {
          tracing = false;
        }
      }

      if (!tracing && !fading) {
        holdTimer++;
        if (holdTimer % 3 === 0) {
          var ri = Math.floor(Math.random() * TOTAL_POINTS);
          var rp = heartPoints[ri];
          addSparkles(rp.x, rp.y);
        }
        if (holdTimer >= HOLD_FRAMES) {
          if (!burstFired) {
            fireBurst();
            burstFired = true;
          }
          fading = true;
        }
      }

      for (var si = sparkles.length - 1; si >= 0; si--) {
        var sp = sparkles[si];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.02;
        sp.life -= sp.decay;
        if (sp.life <= 0) { sparkles.splice(si, 1); continue; }
        fwCtx.globalAlpha = sp.life * fadeAlpha;
        fwCtx.fillStyle = 'hsl(' + sp.hue + ', 100%, 75%)';
        fwCtx.shadowBlur = 8;
        fwCtx.shadowColor = 'hsl(' + sp.hue + ', 100%, 60%)';
        fwCtx.beginPath();
        fwCtx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
        fwCtx.fill();
      }

      for (var bi = burstParticles.length - 1; bi >= 0; bi--) {
        var bp = burstParticles[bi];
        bp.x += bp.vx;
        bp.y += bp.vy;
        bp.vy += 0.03;
        bp.life -= bp.decay;
        if (bp.life <= 0) { burstParticles.splice(bi, 1); continue; }
        fwCtx.globalAlpha = bp.life * fadeAlpha;
        fwCtx.fillStyle = 'hsl(' + bp.hue + ', 100%, 80%)';
        fwCtx.shadowBlur = 10;
        fwCtx.shadowColor = 'hsl(' + bp.hue + ', 100%, 65%)';
        fwCtx.beginPath();
        fwCtx.arc(bp.x, bp.y, bp.size * bp.life, 0, Math.PI * 2);
        fwCtx.fill();
      }

      fwCtx.shadowBlur = 0;
      fwCtx.globalAlpha = 1;

      if (fading) {
        fadeAlpha -= 0.015;
        if (fadeAlpha <= 0) {
          fadeAlpha = 0;
          introComplete = true;
          fwCanvas.style.opacity = '0';
          setTimeout(function () {
            fwCanvas.style.display = 'none';
          }, 1500);
          // Show glowing message
          document.getElementById('glowMessage').classList.add('active');
          return;
        }
      }

      requestAnimationFrame(animateFW);
    }

    animateFW();
  })();

  // ─── Build Scene ──────────────────────────────────────────────
  var galaxyGroup = new THREE.Group();
  var HEART_SCALE = 0.2;
  var SPHERE_RADIUS = 3.5;

  var heartParticles = createHeartParticles(HEART_COUNT, HEART_SCALE);
  galaxyGroup.add(heartParticles);

  var waveBandParticles = createWaveBandParticles(BAND_COUNT, SPHERE_RADIUS);
  galaxyGroup.add(waveBandParticles);

  var photoFrames = createPhotoFrames(10, SPHERE_RADIUS);
  for (var fi = 0; fi < photoFrames.length; fi++) {
    galaxyGroup.add(photoFrames[fi]);
  }

  scene.add(galaxyGroup);

  // ─── Animation Loop ───────────────────────────────────────────
  var clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    var elapsed = clock.getElapsedTime();

    galaxyGroup.rotation.y = elapsed * 0.05;

    var heartBeat = 1.0 + Math.sin(elapsed * 2.0) * 0.10;
    var posAttr = heartParticles.geometry.attributes.position;
    var basePos = heartParticles.userData.basePositions;
    for (var hi = 0; hi < posAttr.count; hi++) {
      posAttr.array[hi * 3] = basePos[hi * 3] * heartBeat;
      posAttr.array[hi * 3 + 1] = basePos[hi * 3 + 1] * heartBeat;
      posAttr.array[hi * 3 + 2] = basePos[hi * 3 + 2] * heartBeat;
    }
    posAttr.needsUpdate = true;

    for (var i = 0; i < photoFrames.length; i++) {
      var frame = photoFrames[i];
      var ud = frame.userData;
      frame.position.y = ud.originalY + Math.sin(elapsed * ud.floatSpeed + ud.phase) * ud.floatAmplitude;
      frame.quaternion.copy(camera.quaternion);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  animate();

  // ─── Resize Handler ───────────────────────────────────────────
  window.addEventListener('resize', function () {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ─── Activate Music ───────────────────────────────────────────
  activateMusic();
}

// ═══════════════════════════════════════════════════════════════
// MUSIC PLAYER
// ═══════════════════════════════════════════════════════════════
var musicPlayer = document.getElementById('musicPlayer');
var audioPlayer = document.getElementById('audioPlayer');
var playPauseBtn = document.getElementById('playPauseBtn');
var progressBar = document.getElementById('progressBar');
var progressFill = document.getElementById('progressFill');
var currentTimeEl = document.getElementById('currentTime');
var totalTimeEl = document.getElementById('totalTime');
var playIcon = document.getElementById('playIcon');
var pauseIcon = document.getElementById('pauseIcon');
var toggleBtn = document.getElementById('toggleBtn');

var isPlaying = false;
var musicActivated = false;

function activateMusic() {
  if (musicActivated) return;
  musicActivated = true;
  musicPlayer.classList.add('active');
  audioPlayer.play().then(function () {
    isPlaying = true;
    showPauseIcon();
  }).catch(function (e) {
    console.log('Audio play error:', e);
  });
}

function showPlayIcon() {
  playIcon.style.display = 'block';
  pauseIcon.style.display = 'none';
}

function showPauseIcon() {
  playIcon.style.display = 'none';
  pauseIcon.style.display = 'block';
}

function togglePlayPause() {
  if (isPlaying) {
    audioPlayer.pause();
    showPlayIcon();
    isPlaying = false;
  } else {
    audioPlayer.play().then(function () {
      showPauseIcon();
      isPlaying = true;
    }).catch(function (e) {
      console.log('Audio play error:', e);
    });
  }
}

function updateProgress() {
  if (audioPlayer.duration) {
    var progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressFill.style.width = progress + '%';
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    totalTimeEl.textContent = formatTime(audioPlayer.duration);
  }
}

function formatTime(seconds) {
  var mins = Math.floor(seconds / 60);
  var secs = Math.floor(seconds % 60);
  return mins + ':' + (secs < 10 ? '0' : '') + secs;
}

function seekAudio(e) {
  var rect = progressBar.getBoundingClientRect();
  var clientX;
  if (e.touches && e.touches.length > 0) {
    clientX = e.touches[0].clientX;
  } else if (e.changedTouches && e.changedTouches.length > 0) {
    clientX = e.changedTouches[0].clientX;
  } else {
    clientX = e.clientX;
  }
  var clickX = clientX - rect.left;
  var newTime = (clickX / rect.width) * audioPlayer.duration;
  if (isFinite(newTime) && newTime >= 0) {
    audioPlayer.currentTime = newTime;
  }
}

playPauseBtn.addEventListener('click', function (e) {
  e.stopPropagation();
  togglePlayPause();
});
progressBar.addEventListener('click', function (e) {
  e.stopPropagation();
  seekAudio(e);
});
progressBar.addEventListener('touchend', function (e) {
  e.stopPropagation();
  e.preventDefault();
  seekAudio(e);
});
audioPlayer.addEventListener('timeupdate', updateProgress);
audioPlayer.addEventListener('loadedmetadata', updateProgress);

toggleBtn.addEventListener('click', function (e) {
  e.stopPropagation();
  musicPlayer.classList.toggle('minimized');
});
