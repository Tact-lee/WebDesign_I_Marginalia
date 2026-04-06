(function () {
  var canvas = document.getElementById('gridCanvas');
  var ctx    = canvas.getContext('2d');
  var dpr    = Math.min(window.devicePixelRatio || 1, 2);

  /* ── constants ─────────────────────────────────────── */
  var GRID     = 16;
  var T1       = 2.2;    // s — vertical sweep
  var T2       = 1.8;    // s — horizontal sweep
  var GAP      = 0.55;   // s — pause between phases
  var TOTAL    = T1 + GAP + T2;

  var RADIUS   = 160;    // px — pin influence radius (10 grid units)
  var LERP_IN  = 0.13;
  var LERP_OUT = 0.08;

  /* ── state ─────────────────────────────────────────── */
  var W, H, cells = [];
  var startTime = null, animDone = false, raf = null;
  var mouseX = -9999, mouseY = -9999, mouseActive = false;
  var hero;

  /* ── math ───────────────────────────────────────────── */
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  /* ── setup — uses parent clientWidth/Height as fallback ── */
  function setup() {
    /* parentElement.clientWidth/Height works even when
       the canvas itself has no intrinsic size via CSS  */
    W = (hero ? hero.clientWidth  : 0) || window.innerWidth;
    H = (hero ? hero.clientHeight : 0) || window.innerHeight;

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

  /* ── grid stroke ────────────────────────────────────── */
  function strokeGrid() {
    ctx.strokeStyle = 'rgba(26,26,24,0.08)';
    ctx.lineWidth   = 0.5;
    for (var x = 0; x <= W; x += GRID) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = 0; y <= H; y += GRID) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  /* ── ANIMATION PHASE ────────────────────────────────── */
  function renderAnim(ts) {
    if (!startTime) startTime = ts;
    var t = (ts - startTime) / 1000;

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(26,26,24,0.08)';
    ctx.lineWidth   = 0.5;

    /* phase 1 — vertical lines, clip sweeps left → right */
    var v = easeInOut(Math.min(1, t / T1));
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W * v, H);
    ctx.clip();
    for (var x = 0; x <= W; x += GRID) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.restore();

    /* phase 2 — horizontal lines, clip sweeps top → bottom */
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
      raf = requestAnimationFrame(renderInteractive); // hand off
    }
  }

  /* ── INTERACTIVE PHASE ──────────────────────────────── */
  function renderInteractive() {
    ctx.clearRect(0, 0, W, H);

    var rSq = RADIUS * RADIUS;

    /* ── pass 0: update elevations ──────────────────── */
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      var target = 0;
      if (mouseActive) {
        var dx  = c.cx - mouseX;
        var dy  = c.cy - mouseY;
        var dSq = dx * dx + dy * dy;
        if (dSq < rSq) {
          target = smoothstep(1 - Math.sqrt(dSq) / RADIUS);
        }
      }
      c.elev += (target > c.elev ? LERP_IN : LERP_OUT) * (target - c.elev);
    }

    /* ── pass 1: symmetric shadow halos (top-down) ── */
    /* light directly overhead → shadow spreads equally
       on all 4 sides of the elevated block            */
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      if (c.elev > 0.004) {
        var e      = c.elev;
        var spread = e * 9; // px — how far shadow bleeds outward
        ctx.fillStyle = 'rgba(26,26,24,' + (e * 0.42) + ')';
        ctx.fillRect(
          c.x - spread,
          c.y - spread,
          GRID + spread * 2,
          GRID + spread * 2
        );
      }
    }

    /* ── pass 2: elevated top surfaces ─────────────── */
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      if (c.elev > 0.004) {
        var e = c.elev;

        /* bright top surface — the block is closer to the overhead light */
        ctx.fillStyle = 'rgba(255,253,248,' + (e * 0.92) + ')';
        ctx.fillRect(c.x, c.y, GRID, GRID);

        /* crisp dark border defines the block edge */
        ctx.strokeStyle = 'rgba(26,26,24,' + (e * 0.28) + ')';
        ctx.lineWidth   = 0.75;
        ctx.strokeRect(c.x + 0.5, c.y + 0.5, GRID - 1, GRID - 1);
      }
    }

    /* ── pass 3: grid lines on top ──────────────────── */
    strokeGrid();

    raf = requestAnimationFrame(renderInteractive);
  }

  /* ── init ───────────────────────────────────────────── */
  function init() {
    hero = document.querySelector('.hero');

    /* attach mouse listeners */
    if (hero) {
      hero.addEventListener('mousemove', function (e) {
        /* use hero's own rect so coordinates stay accurate
           even if hero is scrolled or has padding        */
        var rect = hero.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        mouseActive = true;
      });
      hero.addEventListener('mouseleave', function () {
        mouseActive = false;
      });
    }

    /* delay one rAF frame so layout is fully computed
       before we read clientWidth / clientHeight         */
    requestAnimationFrame(function () {
      setup();
      raf = requestAnimationFrame(renderAnim);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
