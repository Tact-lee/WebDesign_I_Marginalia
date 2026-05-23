(function () {
  var canvas = document.getElementById('gridCanvas');
  var ctx    = canvas.getContext('2d');
  var dpr    = Math.min(window.devicePixelRatio || 1, 2);

  /* ── constants ─────────────────────────────────────── */
  var GRID  = 16;
  var T1    = 1.3, T2 = 1.0, GAP = 0.06, TOTAL = T1 + GAP + T2;
  var RADIUS = 210, LERP_IN = 0.16, LERP_OUT = 0.055;

  /* ripple ── 4 concentric rings */
  var RING_AMPS   = [1.00, 0.58, 0.32, 0.15];
  var RING_W_BASE = 68, RING_W_GROW = 56, RING_STEP = 0.21;

  /* wave ── main band + 3 trailing residuals */
  var WAVE_MAIN_W  = 92;   /* px — main band half-width */
  var WAVE_TRAILS  = [     /* [lag px, half-width px, amplitude] */
    [115, 70, 0.50],
    [230, 52, 0.27],
    [345, 38, 0.13]
  ];
  var TRAIL_LAG_MAX = 345;
  /* constant wave speed — ensures it travels at the same pace all the way off-screen */
  var WAVE_SPEED    = 0.38; /* px / ms  ≈ 380 px/s */

  /* ── state ─────────────────────────────────────────── */
  var W, H, cells = [], numCols = 0;
  var startTime = null, raf = null;
  var mouseX = -9999, mouseY = -9999, mouseActive = false;
  var hero;

  /* single idle source — never two at once */
  var idleSource   = null;
  var idleNextTime = Infinity;

  /* ── math ───────────────────────────────────────────── */
  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
  function easeOutQuad(t) { return 1 - (1 - t) * (1 - t); }
  function smoothstep(t) {
    t = Math.max(0, Math.min(1, t));
    return t * t * (3 - 2 * t);
  }

  /* ── setup ──────────────────────────────────────────── */
  function setup() {
    W = (hero ? hero.clientWidth  : 0) || window.innerWidth;
    H = (hero ? hero.clientHeight : 0) || window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    numCols = Math.ceil(W / GRID);
    cells = [];
    for (var cy = 0; cy < H; cy += GRID)
      for (var cx = 0; cx < W; cx += GRID)
        cells.push({ x: cx, y: cy, cx: cx + GRID / 2, cy: cy + GRID / 2, elev: 0 });
  }

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
  function drawFrontH(x) {
    var g = ctx.createLinearGradient(x - 40, 0, x, 0);
    g.addColorStop(0, 'rgba(26,26,24,0)'); g.addColorStop(1, 'rgba(26,26,24,0.10)');
    ctx.fillStyle = g; ctx.fillRect(x - 40, 0, 40, H);
  }
  function drawFrontV(y) {
    var g = ctx.createLinearGradient(0, y - 40, 0, y);
    g.addColorStop(0, 'rgba(26,26,24,0)'); g.addColorStop(1, 'rgba(26,26,24,0.10)');
    ctx.fillStyle = g; ctx.fillRect(0, y - 40, W, 40);
  }

  /* ── spawn idle ─────────────────────────────────────── */
  function spawnIdle(now) {
    var roll = Math.random();
    var src  = { startTime: now };

    if (roll < 0.38) {
      /* ── RIPPLE ── */
      src.type = 'ripple';
      src.cx   = W * (0.15 + Math.random() * 0.70);
      src.cy   = H * (0.15 + Math.random() * 0.70);
      /* maxR = distance to farthest canvas corner */
      var corners = [[0,0],[W,0],[0,H],[W,H]], mR = 0;
      for (var k = 0; k < corners.length; k++) {
        var dd = Math.sqrt(
          Math.pow(corners[k][0] - src.cx, 2) +
          Math.pow(corners[k][1] - src.cy, 2));
        if (dd > mR) mR = dd;
      }
      src.maxR     = mR;
      src.duration = 3200 + Math.random() * 1000;

    } else {
      /* ── WAVE (4 directions) ── */
      src.type = 'wave';
      /* weighted: down 35%, right 20%, left 20%, up 25% */
      var dr = Math.random();
      src.dir = dr < 0.35 ? 'down' : dr < 0.55 ? 'right' : dr < 0.75 ? 'left' : 'up';
      /* total travel span: canvas dim + entry/exit margins + trailing lag */
      var axisDim  = (src.dir === 'down' || src.dir === 'up') ? H : W;
      src.axisDim  = axisDim;
      src.totalSpan = axisDim + WAVE_MAIN_W * 2 + TRAIL_LAG_MAX;
      /* constant-speed duration — wave never slows down at the edge */
      src.duration = Math.round(src.totalSpan / WAVE_SPEED);
    }

    idleSource   = src;
    /* next idle: at least 7 s after THIS animation ENDS */
    idleNextTime = now + src.duration + 7000 + Math.random() * 4000;
  }

  /* ── idle target for one cell ───────────────────────── */
  function getIdleTarget(cx, cy, now) {
    var s = idleSource;
    if (!s) return 0;
    var t = (now - s.startTime) / s.duration;
    if (t < 0)  return 0;
    if (t >= 1) { idleSource = null; return 0; }

    var contrib = 0;

    /* ════════════ RIPPLE ════════════
       4 concentric rings expanding from centre.
       Each inner ring is narrower and weaker.
       All share the same easeOutQuad expansion speed.
    ════════════════════════════════════ */
    if (s.type === 'ripple') {
      var dx   = cx - s.cx, dy = cy - s.cy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var outerR = s.maxR * easeOutQuad(t);

      for (var j = 0; j < RING_AMPS.length; j++) {
        var ringR = outerR - j * s.maxR * RING_STEP;
        if (ringR < 0) continue; /* ring hasn't emerged yet */
        var rW  = (RING_W_BASE + RING_W_GROW * t) * Math.pow(0.78, j);
        var rd  = Math.abs(dist - ringR);
        if (rd < rW) {
          var fade = t > 0.68 ? (1 - t) / 0.32 : 1;
          var c    = smoothstep(1 - rd / rW) * RING_AMPS[j] * fade;
          if (c > contrib) contrib = c;
        }
      }

    /* ════════════ WAVE ════════════
       Constant speed, 4 directions.
       No artificial fade-out — wave travels off-screen naturally.
       3 trailing residual bands follow behind the main wave.
    ════════════════════════════════ */
    } else if (s.type === 'wave') {
      var dir = s.dir;
      /* raw travel distance [0 → totalSpan] at constant speed */
      var rawPos = s.totalSpan * t;

      /* main wave centre in canvas coordinates */
      var mainPos, cellCoord;
      if      (dir === 'down')  { mainPos = rawPos - WAVE_MAIN_W;              cellCoord = cy; }
      else if (dir === 'up')    { mainPos = s.axisDim + WAVE_MAIN_W - rawPos;  cellCoord = cy; }
      else if (dir === 'right') { mainPos = rawPos - WAVE_MAIN_W;              cellCoord = cx; }
      else                      { mainPos = s.axisDim + WAVE_MAIN_W - rawPos;  cellCoord = cx; }

      /* gentle fade-in only while wave is just entering the canvas */
      var env = (rawPos < WAVE_MAIN_W * 1.5) ? rawPos / (WAVE_MAIN_W * 1.5) : 1;

      /* main band */
      var dMain = Math.abs(cellCoord - mainPos);
      if (dMain < WAVE_MAIN_W) {
        var cm = smoothstep(1 - dMain / WAVE_MAIN_W) * env;
        if (cm > contrib) contrib = cm;
      }

      /* trailing residual bands — sit BEHIND the main wave
         "behind" = direction the wave came from */
      var trailSign = (dir === 'down' || dir === 'right') ? -1 : 1;
      for (var j = 0; j < WAVE_TRAILS.length; j++) {
        var tr      = WAVE_TRAILS[j];
        var trailPos = mainPos + trailSign * tr[0];
        var dTrail   = Math.abs(cellCoord - trailPos);
        if (dTrail < tr[1]) {
          var ct = smoothstep(1 - dTrail / tr[1]) * tr[2] * env;
          if (ct > contrib) contrib = ct;
        }
      }

    }

    return contrib;
  }

  /* ── ANIMATION PHASE ────────────────────────────────── */
  function renderAnim(ts) {
    if (!startTime) startTime = ts;
    var t = (ts - startTime) / 1000;

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(26,26,24,0.22)';
    ctx.lineWidth   = 1;

    var v  = easeInOut(Math.min(1, t / T1));
    var vx = W * v;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, vx, H); ctx.clip();
    for (var x = 0; x <= W; x += GRID) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    ctx.restore();
    if (v < 1) drawFrontH(vx);

    if (t > T1 + GAP) {
      var h  = easeInOut(Math.min(1, (t - T1 - GAP) / T2));
      var hy = H * h;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, hy); ctx.clip();
      for (var y = 0; y <= H; y += GRID) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      ctx.restore();
      if (h < 1) drawFrontV(hy);
    }

    if (t < TOTAL) {
      raf = requestAnimationFrame(renderAnim);
    } else {
      document.dispatchEvent(new CustomEvent('gridAnimDone'));
      idleNextTime = performance.now() + 1500; /* first idle 1.5 s after reveal */
      raf = requestAnimationFrame(renderInteractive);
    }
  }

  /* ── INTERACTIVE PHASE ──────────────────────────────── */
  function renderInteractive() {
    ctx.fillStyle = '#f2f0eb';
    ctx.fillRect(0, 0, W, H);

    var rSq = RADIUS * RADIUS;
    var now = performance.now();

    /* spawn only when nothing is running AND cooldown elapsed */
    if (!idleSource && now >= idleNextTime) spawnIdle(now);

    /* ── pass 0: update elevations ──────────────────── */
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      var target = 0;

      if (mouseActive) {
        var mdx = c.cx - mouseX, mdy = c.cy - mouseY;
        var dSq = mdx * mdx + mdy * mdy;
        if (dSq < rSq) target = smoothstep(1 - Math.sqrt(dSq) / RADIUS);
      }

      var idle = getIdleTarget(c.cx, c.cy, now);
      if (idle > target) target = idle;

      c.elev += (target > c.elev ? LERP_IN : LERP_OUT) * (target - c.elev);
    }

    /* ── pass 1: height-based top face fill ──────────────── */
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      if (c.elev > 0.004) {
        var bh = Math.pow(c.elev, 0.55);
        var fr = Math.round(242 + (255 - 242) * bh);
        var fg = Math.round(240 + (255 - 240) * bh);
        var fb = Math.round(235 + (255 - 235) * bh);
        ctx.fillStyle = 'rgb(' + fr + ',' + fg + ',' + fb + ')';
        ctx.fillRect(c.x - 0.5, c.y - 0.5, GRID + 1, GRID + 1);
      }
    }

    /* ── pass 2: inter-cell depth shadows ─────────────────
       Compare each cell to its right and bottom neighbour.
       Where elevation drops, cast a shadow stripe into the
       lower cell — width proportional to the height delta.  */
    for (var i = 0; i < cells.length; i++) {
      var c = cells[i];
      if (c.elev < 0.03) continue;
      /* right neighbour */
      var ri = i + 1;
      if (ri < cells.length && cells[ri].cy === c.cy) {
        var df = c.elev - cells[ri].elev;
        if (df > 0.04) {
          ctx.fillStyle = 'rgba(26,26,24,' + Math.min(0.68, Math.pow(df * 2, 0.60)) + ')';
          ctx.fillRect(cells[ri].x, cells[ri].y, Math.min(6, df * 10), GRID);
        }
      }
      /* bottom neighbour */
      var bi = i + numCols;
      if (bi < cells.length) {
        var df2 = c.elev - cells[bi].elev;
        if (df2 > 0.04) {
          ctx.fillStyle = 'rgba(26,26,24,' + Math.min(0.68, Math.pow(df2 * 2, 0.60)) + ')';
          ctx.fillRect(cells[bi].x, cells[bi].y, GRID, Math.min(6, df2 * 10));
        }
      }
    }

    /* ── pass 3: grid lines ──────────────────────────── */
    strokeGrid();

    raf = requestAnimationFrame(renderInteractive);
  }

  /* ── init ───────────────────────────────────────────── */
  function init() {
    hero = document.querySelector('.hero');
    if (hero) {
      hero.addEventListener('mousemove', function (e) {
        var rect = hero.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        mouseActive = true;
      });
      hero.addEventListener('mouseleave', function () { mouseActive = false; });
    }

    var viaTransition = sessionStorage.getItem('pt-active') === '1';
    setTimeout(function () {
      requestAnimationFrame(function () {
        setup();
        raf = requestAnimationFrame(renderAnim);
      });
    }, viaTransition ? 0 : 1100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
