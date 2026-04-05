(function () {
  var canvas = document.getElementById('gridCanvas');
  var ctx    = canvas.getContext('2d');
  var dpr    = Math.min(window.devicePixelRatio || 1, 2);

  var GRID    = 80;
  var STAGGER = 36;
  var DUR     = 620;
  var GAP     = 320;

  var W, H, vLines, hLines, startTime, raf;

  function ease(t) { return 1 - Math.pow(1 - t, 2.2); }

  function setup() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    vLines = [];
    for (var x = 0, i = 0; x <= W; x += GRID, i++) {
      vLines.push({ x: x, delay: i * STAGGER });
    }
    var vEnd = (vLines.length - 1) * STAGGER + DUR + GAP;

    hLines = [];
    for (var y = 0, j = 0; y <= H; y += GRID, j++) {
      hLines.push({ y: y, delay: vEnd + j * STAGGER });
    }
  }

  function render(ts) {
    if (!startTime) startTime = ts;
    var elapsed = ts - startTime;

    ctx.clearRect(0, 0, W, H);
    ctx.lineWidth   = 0.5;
    ctx.strokeStyle = 'rgba(26,26,24,0.08)';

    var allDone = true;

    for (var vi = 0; vi < vLines.length; vi++) {
      var vl = vLines[vi];
      var vt = (elapsed - vl.delay) / DUR;
      if (vt <= 0) { allDone = false; continue; }
      if (vt < 1)  allDone = false;
      var vp = ease(Math.min(1, vt));
      ctx.beginPath();
      ctx.moveTo(vl.x, 0);
      ctx.lineTo(vl.x, H * vp);
      ctx.stroke();
    }

    for (var hi = 0; hi < hLines.length; hi++) {
      var hl = hLines[hi];
      var ht = (elapsed - hl.delay) / DUR;
      if (ht <= 0) { allDone = false; continue; }
      if (ht < 1)  allDone = false;
      var hp = ease(Math.min(1, ht));
      ctx.beginPath();
      ctx.moveTo(0, hl.y);
      ctx.lineTo(W * hp, hl.y);
      ctx.stroke();
    }

    if (!allDone) raf = requestAnimationFrame(render);
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
