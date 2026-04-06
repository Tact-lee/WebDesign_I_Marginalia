(function () {
  var canvas = document.getElementById('gridCanvas');
  var ctx    = canvas.getContext('2d');
  var dpr    = Math.min(window.devicePixelRatio || 1, 2);

  var GRID = 16; // px
  var T1   = 1.1; // s — vertical sweep duration
  var T2   = 0.9; // s — horizontal sweep duration
  var GAP  = 0.18; // s — pause between phases

  var W, H, startTime, raf;

  function ease(t) { return 1 - Math.pow(1 - t, 2.5); }

  function setup() {
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function render(ts) {
    if (!startTime) startTime = ts;
    var t = (ts - startTime) / 1000;

    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(26,26,24,0.08)';
    ctx.lineWidth   = 0.5;

    // Phase 1 — vertical lines revealed by left-to-right clip
    var v     = ease(Math.min(1, t / T1));
    var clipW = W * v;

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, clipW, H);
    ctx.clip();
    for (var x = 0; x <= W; x += GRID) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.restore();

    // Phase 2 — horizontal lines revealed by top-to-bottom clip
    if (t > T1 + GAP) {
      var h     = ease(Math.min(1, (t - T1 - GAP) / T2));
      var clipH = H * h;

      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, W, clipH);
      ctx.clip();
      for (var y = 0; y <= H; y += GRID) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    if (t < T1 + GAP + T2) {
      raf = requestAnimationFrame(render);
    }
  }

  function init() {
    setup();
    raf = requestAnimationFrame(render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}());
