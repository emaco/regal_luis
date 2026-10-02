/* ===========================================================
   Regalo en proceso — brasas estilo Dark Souls
   Generado a partir de src/main.ts. Para regenerar:  tsc
   =========================================================== */
"use strict";

var prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

function initEmbers() {
  var canvas = document.getElementById("embers");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var width = 0;
  var height = 0;
  var embers = [];
  var maxEmbers = 0;

  function spawn(fromBottom) {
    var maxLife = 140 + Math.random() * 160;
    return {
      x: Math.random() * width,
      y: fromBottom ? height + Math.random() * 40 : Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -(Math.random() * 0.7 + 0.25),
      size: Math.random() * 2 + 0.6,
      life: 0,
      maxLife: maxLife,
      hue: 20 + Math.random() * 22,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: Math.random() * 0.03 + 0.01,
    };
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    maxEmbers = Math.min(150, Math.round((width * height) / 14000));
    embers = [];
    for (var i = 0; i < maxEmbers; i++) embers.push(spawn(false));
  }

  function drawEmber(e) {
    var t = e.life / e.maxLife;
    var alpha = Math.sin(t * Math.PI) * 0.9;
    var flicker = 0.75 + Math.sin(e.life * 0.3 + e.sway) * 0.25;
    ctx.globalAlpha = Math.max(0, alpha * flicker);
    ctx.fillStyle = "hsl(" + e.hue + ", 100%, " + (55 + flicker * 12) + "%)";
    ctx.shadowBlur = 8;
    ctx.shadowColor = "hsl(" + e.hue + ", 100%, 55%)";
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
    ctx.fill();
  }

  function frame() {
    ctx.clearRect(0, 0, width, height);
    for (var i = 0; i < embers.length; i++) {
      var e = embers[i];
      e.life++;
      e.sway += e.swaySpeed;
      e.x += e.vx + Math.sin(e.sway) * 0.3;
      e.y += e.vy;
      if (e.life >= e.maxLife || e.y < -10) {
        embers[i] = spawn(true);
        continue;
      }
      drawEmber(e);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    requestAnimationFrame(frame);
  }

  function drawStaticOnce() {
    ctx.clearRect(0, 0, width, height);
    for (var i = 0; i < embers.length; i++) {
      var e = embers[i];
      e.life = e.maxLife / 2;
      drawEmber(e);
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  window.addEventListener("resize", function () {
    resize();
    if (prefersReducedMotion) drawStaticOnce();
  });

  resize();
  if (prefersReducedMotion) {
    drawStaticOnce();
  } else {
    frame();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEmbers);
} else {
  initEmbers();
}
