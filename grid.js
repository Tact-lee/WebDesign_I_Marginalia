(function () {
  var canvas = document.getElementById('gridCanvas');
  var ctx    = canvas.getContext('2d');
  var dpr    = Math.min(window.devicePixelRatio || 1, 2);

  /* ── constants ─────────────────────────────────────── */
  var GRID   = 16;
  var T1     = 2.2;   // s — vertical sweep duration
  var T2     = 1.8;   // s — horizontal sweep duration
  var GAP    = 0.55;  // s — pause between phases
  var TOTAL  = T1 + GAP + T2;

  var RADIUS = 88;    // px — pin-screen influence radius
  var LERP_IN  = 0.13;  // approach speed
  var LERP_OUT = 0.08;  // retreat speed (slower = lingers)

  /* ── state ─────────────────────────────────────────── */
  var W, H, cells = [];
  var startTime = null, animDone = false, raf = null;
  var mouseX = -9999, mouseY = -9999, mouseActive = false;
  var loopRunning = false;

  /* ── math helpers ───────────────────────────────────── */
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  /* ── setup ──────────────────────────────────────────── */
  function setup() {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cells = [];
    for (var cy = 0; cy < H; cy += GRID) {
      for (var cx = 0; cx < W; cx += GRID) {
        cells.push({ x: cx, y: cy,
                     cx: cx + GRID / 2, cy: cy + GRID / 2,
                     elev: 0 });
      }
    }
  }

  /* ── grid stroke helper ─────────────────────────────── */
  function strokeGrid() {
    ctx.strokeStyle = 'rgba(26,26,24,0.08)';
    ctx.lineWidth   = 0.5;
    var x, y;
    for (x = 0; x <= W; x += GRID) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (y = 0; y <= H; y += GRID) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  /* ── PHASE 1 & 2 : draw animation ───────────────────── */
  function renderAnim(ts) {
    if (!startTime) startTime = ts;
    var t = (ts - startTime) / 1000;

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(26,26,24,0.08)';
    ctx.lineWidth   = 0.5;

    /* vertical lines — clip sweeps left → right */
    var v = easeInOut(Math.min(1, t / T1));
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W * v, H);
    ctx.clip();
    for (var x = 0; x <= W; x += GRID) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.restore();

    /* horizontal lines — clip sweeps top → bottom */
    if (t > T1 + GAP) {
      var h = easeInOut(Math.min(1, (t - T1 - GAP) / T2));
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, H * h);
      ctx.clip();
      for (var y = 0; y <= H; y += GRID) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      ctx.restore();
    }

    if (t < TOTAL) {
      raf = requestAnimationFrame(renderAnim);
    } else {
      animDone = true;
      startInteractiveLoop();
    }
  }

  /* ── INTERACTIVE : pin-screen ────────────────────────── */
  function renderInteractive() {
    loopRunning = true;
    ctx.clearRect(0, 0, W, H);

    var rSq     = RADIUS * RADIUS;
    var anyAlive = false;

    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];

      /* target elevation */
      var target = 0;
      if (mouseActive) {
        var dx = c.cx - mouseX;
        var dy = c.cy - mouseY;
        var dSq = dx * dx + dy * dy;
        if (dSq < rSq) {
          target = smoothstep(1 - Math.sqrt(dSq) / RADIUS);
        }
      }

      /* lerp — faster in, slower out */
      var lr = target > c.elev ? LERP_IN : LERP_OUT;
      c.elev += (target - c.elev) * lr;

      if (c.elev > 0.004) {
        anyAlive = true;
        var e   = c.elev;
        var off = e * 4.5; // shadow offset (px)

        /* shadow — offset bottom-right */
        ctx.fillStyle = 'rgba(26,26,24,' + (e * 0.20) + ')';
        ctx.fillRect(c.x + off, c.y + off, GRID - 1, GRID - 1);

        /* top surface — very slightly brightened */
        ctx.fillStyle = 'rgba(255,252,244,' + (e * 0.55) + ')';
        ctx.fillRect(c.x, c.y, GRID - 1, GRID - 1);

        /* subtle dark border on bottom + right edges (wall illusion) */
        ctx.strokeStyle = 'rgba(26,26,24,' + (e * 0.12) + ')';
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        ctx.moveTo(c.x,          c.y + GRID - 1);
        ctx.lineTo(c.x + GRID - 1, c.y + GRID - 1);
        ctx.lineTo(c.x + GRID - 1, c.y);
        ctx.stroke();
      }
    }

    /* grid lines on top */
    strokeGrid();

    /* keep looping only while cells are animating or mouse is active */
    if (mouseActive || anyAlive) {
      raf = requestAnimationFrame(renderInteractive);
    } else {
      loopRunning = false;
    }
  }

  function startInteractiveLoop() {
    if (!loopRunning) {
      loopRunning = true;
      raf = requestAnimationFrame(renderInteractive);
    }
  }

  /* ── init ───────────────────────────────────────────── */
  function init() {
    setup();

    var hero = document.querySelector('.hero');
    if (hero) {
      hero.addEventListener('mousemove', function (e) {
        var rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        if (!mouseActive) {
          mouseActive = true;
          if (animDone) startInteractiveLoop();
        }
      });
      hero.addEventListener('mouseleave', function () {
        mouseActive = false;
        /* loop will self-terminate after cells return to 0 */
      });
    }

    raf = requestAnimationFrame(renderAnim);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
