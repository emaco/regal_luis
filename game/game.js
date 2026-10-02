// Motor de "The Bianca Game": recorre el árbol de STORY (story.js) replicando el
// comportamiento del TextManager original de Unity.
//
//   - Clic / toque / Espacio / Enter: avanza al siguiente texto.
//   - Si el texto tiene opciones, aparecen botones (también teclas 1-4).
//   - Al agotar un bloque se vuelve al nodo padre, que vuelve a ofrecer sus opciones.
//   - Un final (`end: true`) muestra la pantalla de "volver a empezar".

(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const ui = {
    bg: $("#bg"),
    bgBlur: $("#bg-blur"),
    text: $("#text"),
    options: $("#options"),
    hint: $("#hint"),
    title: $("#title-screen"),
    titleText: $("#title-text"),
    end: $("#end-screen"),
    endText: $("#end-text"),
    restart: $("#restart"),
    mute: $("#mute"),
    stage: $("#stage"),
    dialog: $("#dialog"),
  };

  // ---------- Audio ----------
  const music = new Audio();
  music.loop = true;
  music.preload = "auto";
  let muted = false;

  function playMusic(src) {
    // Igual que en Unity: si ya suena esa pista no se reinicia.
    if (music.src.endsWith(src) && !music.paused) return;
    music.src = src;
    music.currentTime = 0;
    music.play().catch(() => {
      /* el navegador bloqueó el autoplay: se reintenta en el siguiente clic */
    });
  }

  function toggleMute() {
    muted = !muted;
    music.muted = muted;
    ui.mute.textContent = muted ? "🔇" : "🔊";
    ui.mute.setAttribute("aria-label", muted ? "Activar sonido" : "Silenciar");
  }

  // ---------- Estado ----------
  let stack = []; // [{ nodes, index }]
  let choosing = false;
  let finished = false;
  let started = false;
  let lastInput = 0;

  function current() {
    const top = stack[stack.length - 1];
    return top ? top.nodes[top.index] : null;
  }

  function setImage(src) {
    if (!src) return;
    if (ui.bg.getAttribute("src") === src) return;
    ui.bg.src = src;
    ui.bgBlur.src = src;
  }

  function linkify(text) {
    const esc = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    return esc.replace(
      /https?:\/\/[^\s"<]+/g,
      (url) => `<a href="${url}" target="_blank" rel="noopener">${url}</a>`
    );
  }

  function render(node) {
    setImage(node.img);
    const isEnding = /^Ending:\s*/i.test(node.text);
    ui.text.innerHTML = linkify(node.text.replace(/^Ending:\s*/i, ""));
    ui.text.classList.toggle("ending", isEnding);
    ui.hint.hidden = false;
  }

  function showOptions(options) {
    choosing = true;
    ui.hint.hidden = true;
    ui.options.innerHTML = "";
    options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "option";
      btn.innerHTML = `<span class="key">${i + 1}</span>${linkify(opt.text)}`;
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        chooseOption(i);
      });
      ui.options.appendChild(btn);
    });
    ui.options.hidden = false;
  }

  function hideOptions() {
    choosing = false;
    ui.options.hidden = true;
    ui.options.innerHTML = "";
  }

  // Equivalente a TextManager.Play()
  function advance(fromLoop) {
    const node = current();
    if (!node) return finish();

    if (node.end) return finish();

    if (!fromLoop && node.options && node.options.length) {
      showOptions(node.options);
      return;
    }

    const top = stack[stack.length - 1];
    top.index += 1;
    if (top.index < top.nodes.length) {
      render(top.nodes[top.index]);
    } else {
      stack.pop();
      const parent = current();
      if (parent) render(parent); // vuelve al nodo con opciones del padre
      else finish();
    }
  }

  // Equivalente a TextManager.ChooseOption()
  function chooseOption(i) {
    const node = current();
    const opt = node && node.options && node.options[i];
    if (!opt) return;
    lastInput = performance.now();
    hideOptions();
    if (opt.music) playMusic(opt.music);
    if (opt.block && opt.block.length) {
      stack.push({ nodes: opt.block, index: 0 });
      render(opt.block[0]);
    } else {
      advance(true);
    }
  }

  function finish() {
    finished = true;
    ui.hint.hidden = true;
    ui.dialog.hidden = true;
    ui.endText.textContent = ui.text.textContent;
    ui.end.hidden = false;
  }

  function start() {
    stack = [{ nodes: STORY.nodes, index: 0 }];
    finished = false;
    hideOptions();
    ui.end.hidden = true;
    ui.dialog.hidden = false;
    setImage(STORY.startImage);
    playMusic(STORY.startMusic);
    render(STORY.nodes[0]);
  }

  function onAdvanceInput() {
    if (!started || finished || choosing) return;
    const now = performance.now();
    if (now - lastInput < 250) return; // evita dobles toques
    lastInput = now;
    if (music.paused && !muted) music.play().catch(() => {});
    advance(false);
  }

  // ---------- Eventos ----------
  ui.titleText.textContent = STORY.title;
  document.title = "The Bianca Game";

  ui.title.addEventListener("click", () => {
    started = true;
    ui.title.hidden = true;
    start();
  });

  ui.stage.addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    onAdvanceInput();
  });

  ui.restart.addEventListener("click", (e) => {
    e.stopPropagation();
    start();
  });

  ui.mute.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMute();
  });

  document.addEventListener("keydown", (e) => {
    if (!started) {
      if (e.key === " " || e.key === "Enter") ui.title.click();
      return;
    }
    if (finished) {
      if (e.key === " " || e.key === "Enter") start();
      return;
    }
    if (choosing) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 4) chooseOption(n - 1);
      return;
    }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onAdvanceInput();
    }
  });
})();
