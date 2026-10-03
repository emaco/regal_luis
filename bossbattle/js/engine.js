// Motor mínimo: lienzo lógico de 384x216 escalado con píxeles nítidos, bucle,
// entrada (ratón, táctil, teclado), carga de imágenes, texto, efectos de sonido
// sintetizados y música.
//
// Todo cuelga del espacio de nombres global BB para no depender de módulos ES
// (así el juego funciona abriendo index.html con doble clic).

const BB = (() => {
  "use strict";

  const W = 384;
  const H = 216;
  const FONT = '"Press Start 2P", monospace';

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;

  // ---------- Escalado ----------
  function resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let scale = Math.min(vw / W, vh / H);
    if (scale >= 2) scale = Math.floor(scale); // escala entera cuando cabe
    canvas.style.width = Math.floor(W * scale) + "px";
    canvas.style.height = Math.floor(H * scale) + "px";
  }
  window.addEventListener("resize", resize);
  resize();

  // Teclado virtual (movil): el area visible se encoge y tapa la parte baja del
  // juego. Mientras esta abierto, el contenedor se ajusta al area visible (el
  // juego queda centrado en ella) y el campo de respuesta pasa arriba (clase kb).
  function fitViewport() {
    const vv = window.visualViewport;
    const wrap = document.getElementById("wrap");
    if (!vv || !wrap) return;
    const kb = vv.height < window.innerHeight - 120;
    wrap.classList.toggle("kb", kb);
    if (kb) {
      Object.assign(wrap.style, {
        top: vv.offsetTop + "px",
        left: vv.offsetLeft + "px",
        right: "auto",
        bottom: "auto",
        width: vv.width + "px",
        height: vv.height + "px",
      });
    } else {
      wrap.style.cssText = "";
    }
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", fitViewport);
    window.visualViewport.addEventListener("scroll", fitViewport);
  }

  // ---------- Imágenes ----------
  const images = {};
  function loadImages(map) {
    const jobs = Object.entries(map).map(
      ([name, url]) =>
        new Promise((resolve, reject) => {
          const im = new Image();
          im.onload = () => {
            images[name] = im;
            resolve();
          };
          im.onerror = () => reject(new Error("No se pudo cargar " + url));
          im.src = url;
        })
    );
    return Promise.all(jobs);
  }
  const img = (name) => images[name];

  // ---------- Entrada ----------
  const keys = new Set();
  const keysJust = new Set();
  const pointer = { x: W / 2, y: H / 2, down: false, justDown: false, justUp: false, inside: false, moved: false, touch: false };
  let anyJust = false; // clic o tecla de avance en este frame

  function toLogical(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * W,
      y: ((e.clientY - r.top) / r.height) * H,
    };
  }
  canvas.addEventListener("pointerdown", (e) => {
    const p = toLogical(e);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.down = true;
    pointer.justDown = true;
    pointer.touch = e.pointerType !== "mouse"; // tactil/lapiz: los jefes pueden ser algo mas permisivos
    pointer.inside = true;
    anyJust = true;
    music.resume();
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", (e) => {
    const p = toLogical(e);
    if (Math.abs(p.x - pointer.x) > 0.5 || Math.abs(p.y - pointer.y) > 0.5) pointer.moved = true;
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.inside = p.x >= 0 && p.y >= 0 && p.x < W && p.y < H;
  });
  const up = () => {
    if (pointer.down) pointer.justUp = true;
    pointer.down = false;
  };
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  window.addEventListener("keydown", (e) => {
    if (e.target && e.target.tagName === "INPUT") return;
    if (!keys.has(e.code)) keysJust.add(e.code);
    keys.add(e.code);
    if (e.code === "Space" || e.code === "Enter") anyJust = true;
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
    music.resume();
  });
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyM" && !(e.target && e.target.tagName === "INPUT")) music.toggleMute();
  });
  window.addEventListener("keyup", (e) => keys.delete(e.code));
  window.addEventListener("blur", () => keys.clear());

  const input = {
    pointer,
    key: (code) => keys.has(code),
    justPressed: (code) => keysJust.has(code),
    get advance() {
      return anyJust;
    },
    axisX() {
      return (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0);
    },
    axisY() {
      return (keys.has("ArrowDown") || keys.has("KeyS") ? 1 : 0) - (keys.has("ArrowUp") || keys.has("KeyW") ? 1 : 0);
    },
    endFrame() {
      keysJust.clear();
      pointer.justDown = false;
      pointer.justUp = false;
      pointer.moved = false;
      anyJust = false;
    },
  };

  // ---------- Sonido ----------
  let actx = null;
  function audio() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  function tone({ freq = 440, dur = 0.1, type = "square", vol = 0.08, slide = 0, delay = 0 }) {
    if (music.muted) return;
    try {
      const a = audio();
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type;
      const t0 = a.currentTime + delay;
      o.frequency.setValueAtTime(freq, t0);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(a.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch (_) {
      /* sin audio */
    }
  }
  const sfx = {
    blip: () => tone({ freq: 880, dur: 0.04, vol: 0.04 }),
    select: () => tone({ freq: 660, dur: 0.08 }),
    ok: () => {
      tone({ freq: 523, dur: 0.08 });
      tone({ freq: 784, dur: 0.12, delay: 0.08 });
    },
    bad: () => tone({ freq: 220, dur: 0.25, type: "sawtooth", slide: -150 }),
    hit: () => tone({ freq: 160, dur: 0.18, type: "sawtooth", slide: -100, vol: 0.12 }),
    zap: () => {
      tone({ freq: 1200, dur: 0.12, type: "sawtooth", slide: -900, vol: 0.1 });
      tone({ freq: 90, dur: 0.3, type: "square", vol: 0.1, delay: 0.05 });
    },
    catchIt: () => {
      tone({ freq: 740, dur: 0.06 });
      tone({ freq: 988, dur: 0.1, delay: 0.06 });
    },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone({ freq: f, dur: 0.18, delay: i * 0.12 })),
    lose: () => [392, 349, 311, 262].forEach((f, i) => tone({ freq: f, dur: 0.3, type: "triangle", delay: i * 0.22 })),
    tick: () => tone({ freq: 1000, dur: 0.02, vol: 0.03 }),
    warn: () => tone({ freq: 440, dur: 0.1, type: "triangle", vol: 0.06 }),
  };

  const music = {
    el: new Audio(),
    muted: false,
    current: "",
    play(url, { loop = true, volume = 0.5 } = {}) {
      if (this.current === url && !this.el.paused) return;
      this.current = url;
      this.el.src = url;
      this.el.loop = loop;
      this.el.volume = volume;
      this.el.muted = this.muted;
      this.el.play().catch(() => {});
    },
    stop() {
      this.el.pause();
      this.current = "";
    },
    resume() {
      if (this.current && this.el.paused) this.el.play().catch(() => {});
    },
    toggleMute() {
      this.muted = !this.muted;
      this.el.muted = this.muted;
      const b = document.getElementById("mute");
      if (b) b.textContent = this.muted ? "🔇" : "🔊";
    },
  };
  music.el.preload = "auto";

  // GameOver: si existe assets/gameover/gameover.mp4 se pinta semitransparente
  // cruzando la pantalla (por detras de la interfaz) y su audio suena junto a la
  // musica. Si no existe, un cartel "GAME OVER" con un acorde sintetizado.
  const gameOver = {
    DUR: 4,
    start: 0,
    playing: false,
    video: null,
    play(url) {
      this.stop();
      this.start = performance.now();
      this.playing = true;
      const v = document.createElement("video");
      v.src = url;
      v.volume = 0.8;
      v.muted = music.muted;
      v.playsInline = true;
      v.onerror = () => {
        if (this.video !== v) return;
        this.video = null; // sin clip: cartel + sonido sintetizado
        this.synth();
      };
      v.onended = () => (this.playing = false);
      this.video = v;
      v.play().catch(() => {});
    },
    synth() {
      tone({ freq: 110, dur: 3.5, type: "sawtooth", slide: -45, vol: 0.07 });
      tone({ freq: 164, dur: 3.5, type: "triangle", slide: -60, vol: 0.07 });
      tone({ freq: 55, dur: 3.8, type: "square", slide: -15, vol: 0.05, delay: 0.1 });
      tone({ freq: 880, dur: 0.6, type: "sine", slide: -600, vol: 0.05 });
    },
    stop() {
      if (this.video) this.video.pause();
      this.video = null;
      this.playing = false;
    },
    draw(ctx, W, H) {
      if (!this.playing) return;
      const v = this.video;
      if (v) {
        if (v.readyState < 2) return;
        v.muted = music.muted;
        const k = Math.min(1, v.currentTime / (v.duration || this.DUR));
        const h = Math.round(H * 0.6);
        const w = Math.round(h * ((v.videoWidth || 16) / (v.videoHeight || 9)));
        ctx.save();
        ctx.globalAlpha = 0.45 * Math.min(1, k * 8, (1 - k) * 8);
        ctx.drawImage(v, Math.round(-w + (W + w) * k), Math.round((H - h) / 2), w, h);
        ctx.restore();
        return;
      }
      const k = (performance.now() - this.start) / 1000 / this.DUR;
      if (k >= 1) {
        this.playing = false;
        return;
      }
      const fade = Math.min(1, k * 6, (1 - k) * 4);
      const bandH = 56;
      const y = Math.round((H - bandH) / 2);
      ctx.save();
      ctx.globalAlpha = 0.55 * fade;
      rect(0, y, W, bandH, C.black);
      rect(0, y, W, 2, C.darkred);
      rect(0, y + bandH - 2, W, 2, C.darkred);
      ctx.globalAlpha = 0.6 * fade;
      text("GAME OVER", -90 + (W + 180) * k, y + 18, { size: 20, align: "center", color: C.red, shadow: C.black });
      ctx.restore();
    },
  };

  // ---------- Dibujo ----------
  const C = {
    black: "#181425",
    navy: "#262b44",
    dark: "#3a4466",
    gray: "#5a6988",
    lgray: "#8b9bb4",
    silver: "#c0cbdc",
    white: "#ffffff",
    orange: "#f77622",
    amber: "#feae34",
    yellow: "#fee761",
    red: "#e43b44",
    darkred: "#a22633",
    brown: "#733e39",
    tan: "#e4a672",
    cream: "#ead4aa",
    green: "#63c74d",
    dgreen: "#3e8948",
    forest: "#265c42",
    blue: "#0099db",
    dblue: "#124e89",
    cyan: "#2ce8f5",
    purple: "#68386c",
    pink: "#b55088",
    salmon: "#f6757a",
  };

  function rect(x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function sprite(name, x, y, { flip = false, alpha = 1, scale = 1, anchor = "tl" } = {}) {
    const im = images[name];
    if (!im) return;
    const w = im.width * scale;
    const h = im.height * scale;
    let dx = x;
    let dy = y;
    if (anchor === "center") {
      dx = x - w / 2;
      dy = y - h / 2;
    } else if (anchor === "bottom") {
      dx = x - w / 2;
      dy = y - h;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    if (flip) {
      ctx.translate(Math.round(dx + w), Math.round(dy));
      ctx.scale(-1, 1);
      ctx.drawImage(im, 0, 0, w, h);
    } else {
      ctx.drawImage(im, Math.round(dx), Math.round(dy), w, h);
    }
    ctx.restore();
  }

  // Caja estilo Pokémon: borde doble, fondo blanco.
  function frame(x, y, w, h, { fill = C.white, border = C.black } = {}) {
    rect(x, y, w, h, border);
    rect(x + 1, y + 1, w - 2, h - 2, fill);
    rect(x + 2, y + 2, w - 4, h - 4, border);
    rect(x + 3, y + 3, w - 6, h - 6, fill);
  }

  function text(str, x, y, { color = C.black, size = 8, align = "left", shadow = null } = {}) {
    ctx.font = `${size}px ${FONT}`;
    ctx.textBaseline = "top";
    ctx.textAlign = align;
    if (shadow) {
      ctx.fillStyle = shadow;
      ctx.fillText(str, Math.round(x) + 1, Math.round(y) + 1);
    }
    ctx.fillStyle = color;
    ctx.fillText(str, Math.round(x), Math.round(y));
  }

  function measure(str, size = 8) {
    ctx.font = `${size}px ${FONT}`;
    return ctx.measureText(str).width;
  }

  function wrap(str, maxWidth, size = 8) {
    const words = str.split(" ");
    const lines = [];
    let line = "";
    for (const w of words) {
      const test = line ? line + " " + w : w;
      if (measure(test, size) > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  function hpBar(x, y, w, value, max, { label = "", color = null } = {}) {
    const pct = Math.max(0, Math.min(1, value / max));
    const col = color || (pct > 0.5 ? C.green : pct > 0.2 ? C.amber : C.red);
    if (label) text(label, x, y - 9, { size: 6 });
    rect(x, y, w, 6, C.black);
    rect(x + 1, y + 1, w - 2, 4, C.silver);
    rect(x + 1, y + 1, Math.round((w - 2) * pct), 4, col);
  }

  // ---------- Efectos de pantalla ----------
  const fx = { shakeT: 0, shakeA: 0, flashT: 0, flashD: 0, flashC: C.white };
  function shake(amount = 3, dur = 0.25) {
    fx.shakeA = amount;
    fx.shakeT = dur;
  }
  function flash(color = C.white, dur = 0.12) {
    fx.flashC = color;
    fx.flashT = dur;
    fx.flashD = dur;
  }

  // ---------- Utilidades ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));

  // ---------- Bucle y escenas ----------
  let scene = null;
  let last = performance.now();
  let time = 0;

  function setScene(s) {
    scene = s;
    if (s && s.enter) s.enter();
  }

  function loop(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1;
    time += dt;

    if (scene && scene.update) scene.update(dt);

    ctx.save();
    if (fx.shakeT > 0) {
      fx.shakeT -= dt;
      ctx.translate(Math.round(rand(-fx.shakeA, fx.shakeA)), Math.round(rand(-fx.shakeA, fx.shakeA)));
    }
    rect(-8, -8, W + 16, H + 16, C.black);
    if (scene && scene.draw) scene.draw(ctx);
    ctx.restore();

    if (fx.flashT > 0) {
      fx.flashT -= dt;
      ctx.save();
      ctx.globalAlpha = clamp(fx.flashT / fx.flashD, 0, 1) * 0.8;
      rect(0, 0, W, H, fx.flashC);
      ctx.restore();
    }

    input.endFrame();
    requestAnimationFrame(loop);
  }

  function start() {
    last = performance.now();
    requestAnimationFrame(loop);
  }

  return {
    W, H, C, ctx, canvas, FONT,
    loadImages, img, input, sfx, music, gameOver,
    rect, sprite, frame, text, measure, wrap, hpBar, shake, flash,
    rand, randInt, pick, clamp, lerp, dist, wait,
    setScene, start,
    get time() { return time; },
    get scene() { return scene; },
  };
})();
