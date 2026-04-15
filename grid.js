(function () {
  var canvas = document.getElementById('gridCanvas');
  var ctx    = canvas.getContext('2d');
  var dpr    = Math.min(window.devicePixelRatio || 1, 2);

  /* ── constants ─────────────────────────────────────── */
  var GRID     = 16;
  var T1       = 2.2;    // s — vertical sweep
  var T2       = 1.8;    // s — horizontal sweep
  var GAP      = 0.0;   // s — pause between phases
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
    ctx.strokeStyle = 'rgba(26,26,24,0.15)';
    ctx.lineWidth   = 0.75;
    for (var x = 0; x <= W; x += GRID) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (var y = 0; y <= H; y += GRID) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  /* ── sweep-front highlight ──────────────────────────── */
  function drawFrontH(x) {
    /* vertical bright stripe at the sweep front */
    var grd = ctx.createLinearGradient(x - 40, 0, x, 0);
    grd.addColorStop(0, 'rgba(26,26,24,0)');
    grd.addColorStop(1, 'rgba(26,26,24,0.10)');
    ctx.fillStyle = grd;
    ctx.fillRect(x - 40, 0, 40, H);
  }
  function drawFrontV(y) {
    /* horizontal bright stripe at the sweep front */
    var grd = ctx.createLinearGradient(0, y - 40, 0, y);
    grd.addColorStop(0, 'rgba(26,26,24,0)');
    grd.addColorStop(1, 'rgba(26,26,24,0.10)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, y - 40, W, 40);
  }

  /* ── ANIMATION PHASE ────────────────────────────────── */
  function renderAnim(ts) {
    if (!startTime) startTime = ts;
    var t = (ts - startTime) / 1000;

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(26,26,24,0.22)';
    ctx.lineWidth   = 1;

    /* phase 1 — vertical lines, clip sweeps left → right */
    var v  = easeInOut(Math.min(1, t / T1));
    var vx = W * v;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, vx, H);
    ctx.clip();
    for (var x = 0; x <= W; x += GRID) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.restore();
    if (v < 1) drawFrontH(vx);

    /* phase 2 — horizontal lines, clip sweeps top → bottom */
    if (t > T1 + GAP) {
      var h  = easeInOut(Math.min(1, (t - T1 - GAP) / T2));
      var hy = H * h;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, hy);
      ctx.clip();
      for (var y = 0; y <= H; y += GRID) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      ctx.restore();
      if (h < 1) drawFrontV(hy);
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
    /* fill with background instead of clear — required for 'darken' blend */
    ctx.fillStyle = '#f2f0eb';
    ctx.fillRect(0, 0, W, H);

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

    /* ── pass 1: per-block shadow halos with 'darken' blend ──
       'darken' takes min(src, dst) per channel → overlapping
       halos never accumulate; they just reach their individual
       darkest value, eliminating the dark-ring artifact.     */
    ctx.globalCompositeOperation = 'darken';
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      if (c.elev > 0.004) {
        var e2     = c.elev * c.elev;
        var spread = c.elev * 9;  // halo radius in px
        /* pre-multiply shadow color against #f2f0eb (242,240,235)
           so we can draw opaque RGB — no alpha to accumulate     */
        var strength = e2 * 0.28;
        var r = Math.round(242 - (242 - 26) * strength);
        var g = Math.round(240 - (240 - 26) * strength);
        var b = Math.round(235 - (235 - 24) * strength);
        var grd = ctx.createRadialGradient(
          c.cx, c.cy, 0,
          c.cx, c.cy, GRID / 2 + spread
        );
        grd.addColorStop(0,   'rgb(' + r + ',' + g + ',' + b + ')');
        grd.addColorStop(1,   'rgb(242,240,235)');
        ctx.fillStyle = grd;
        ctx.fillRect(
          c.x - spread, c.y - spread,
          GRID + spread * 2, GRID + spread * 2
        );
      }
    }
    ctx.globalCompositeOperation = 'source-over';

    /* ── pass 2: elevated top surfaces ─────────────── */
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      if (c.elev > 0.004) {
        var e  = c.elev;
        var e2 = e * e; // non-linear → more contrast at edges

        /* bright top surface — overhead light hits elevated face */
        ctx.fillStyle = 'rgba(255,253,248,' + (e2 * 0.96) + ')';
        ctx.fillRect(c.x, c.y, GRID, GRID);

        /* dark border defines each block's edge */
        ctx.strokeStyle = 'rgba(26,26,24,' + (e2 * 0.38) + ')';
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
