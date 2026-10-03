// Diálogo estilo Pokémon (máquina de escribir, avance con clic/espacio,
// elecciones) y clase base de las peleas contra jefes.

(() => {
  "use strict";
  const { W, H, C } = BB;

  // ---------- Diálogo ----------
  const BOX_H = 44;
  const dialog = {
    active: false,
    lines: [],
    index: 0,
    shown: 0,
    speed: 45, // caracteres por segundo
    choices: null,
    choice: 0,
    resolve: null,
    speaker: "",
    blink: 0,

    // say(["texto", ...]) -> Promise que se resuelve al pasar la última línea
    say(lines, speaker = "") {
      if (typeof lines === "string") lines = [lines];
      this.lines = lines;
      this.index = 0;
      this.shown = 0;
      this.speaker = speaker;
      this.choices = null;
      this.active = true;
      return new Promise((r) => (this.resolve = r));
    },

    // ask("pregunta", ["opción A", "opción B"]) -> Promise<índice>
    ask(prompt, options, speaker = "") {
      this.lines = [prompt];
      this.index = 0;
      this.shown = 0;
      this.speaker = speaker;
      this.choices = options;
      this.choice = 0;
      this.active = true;
      return new Promise((r) => (this.resolve = r));
    },

    currentFull() {
      return this.lines[this.index] || "";
    },

    update(dt) {
      if (!this.active) return;
      this.blink += dt;
      const full = this.currentFull();
      const wasDone = this.shown >= full.length;
      if (!wasDone) {
        const before = Math.floor(this.shown);
        this.shown = Math.min(full.length, this.shown + this.speed * dt);
        if (Math.floor(this.shown) !== before && Math.floor(this.shown) % 3 === 0) BB.sfx.blip();
      }
      const done = this.shown >= full.length;
      const inp = BB.input;

      if (this.choices && done) {
        // Navegación de opciones
        if (inp.justPressed("ArrowUp") || inp.justPressed("KeyW")) {
          this.choice = (this.choice + this.choices.length - 1) % this.choices.length;
          BB.sfx.select();
        }
        if (inp.justPressed("ArrowDown") || inp.justPressed("KeyS")) {
          this.choice = (this.choice + 1) % this.choices.length;
          BB.sfx.select();
        }
        const hovered = this.choiceAt(inp.pointer.x, inp.pointer.y);
        if (hovered !== -1 && inp.pointer.inside && (inp.pointer.moved || inp.pointer.justDown)) this.choice = hovered;
        if (inp.justPressed("Enter") || inp.justPressed("Space") || (inp.pointer.justDown && hovered !== -1)) {
          BB.sfx.ok();
          this.finish(this.choice);
        }
        return;
      }

      if (inp.advance) {
        if (!done) {
          this.shown = full.length;
        } else if (this.index < this.lines.length - 1) {
          this.index++;
          this.shown = 0;
        } else {
          this.finish(undefined);
        }
      }
    },

    finish(value) {
      this.active = false;
      const r = this.resolve;
      this.resolve = null;
      if (r) r(value);
    },

    choiceBox() {
      const n = this.choices ? this.choices.length : 0;
      let longest = 0;
      for (const c of this.choices || []) longest = Math.max(longest, BB.measure(c, 8));
      const w = Math.min(W - 12, Math.ceil(longest) + 30);
      const h = n * 14 + 10;
      return { x: W - w - 6, y: H - BOX_H - h - 4, w, h };
    },

    choiceAt(px, py) {
      if (!this.choices) return -1;
      const b = this.choiceBox();
      if (px < b.x || px > b.x + b.w || py < b.y || py > b.y + b.h) return -1;
      const i = Math.floor((py - b.y - 5) / 14);
      return i >= 0 && i < this.choices.length ? i : -1;
    },

    draw() {
      if (!this.active) return;
      const y = H - BOX_H - 4;
      BB.frame(4, y, W - 8, BOX_H);
      if (this.speaker) {
        const w = BB.measure(this.speaker, 6) + 8;
        BB.frame(10, y - 8, w, 13, { fill: C.yellow });
        BB.text(this.speaker, 14, y - 4, { size: 6 });
      }
      const full = this.currentFull();
      const visible = full.slice(0, Math.floor(this.shown));
      const lines = BB.wrap(visible, W - 32);
      lines.slice(0, 3).forEach((l, i) => BB.text(l, 14, y + 9 + i * 11));
      const done = this.shown >= full.length;
      if (done && !this.choices && Math.floor(this.blink * 2) % 2 === 0) {
        BB.sprite("flecha", W - 20, y + BOX_H - 10);
      }
      if (this.choices && done) {
        const b = this.choiceBox();
        BB.frame(b.x, b.y, b.w, b.h);
        this.choices.forEach((opt, i) => {
          const yy = b.y + 6 + i * 14;
          if (i === this.choice) BB.text(">", b.x + 8, yy);
          BB.text(opt, b.x + 20, yy, { size: 8 });
        });
      }
    },
  };

  // ---------- Textos flotantes ----------
  const floaters = [];
  function floatText(str, x, y, color = C.white, dur = 1.2) {
    floaters.push({ str, x, y, color, t: 0, dur });
  }
  function updateFloaters(dt) {
    for (let i = floaters.length - 1; i >= 0; i--) {
      const f = floaters[i];
      f.t += dt;
      f.y -= 14 * dt;
      if (f.t > f.dur) floaters.splice(i, 1);
    }
  }
  function drawFloaters() {
    for (const f of floaters) {
      BB.text(f.str, f.x, f.y, { color: f.color, size: 7, align: "center", shadow: C.black });
    }
  }

  // ---------- Estado global del jugador ----------
  const state = {
    maxHp: 100,
    hp: 100,
    deaths: 0,
    flags: { patata: false, meNiego: false, tuMadre: false, tiramisu: false, build: "" },
    reset() {
      this.hp = this.maxHp;
      this.deaths = 0;
      this.flags = { patata: false, meNiego: false, tuMadre: false, tiramisu: false, build: "" };
    },
  };

  // ---------- Clase base de pelea ----------
  class BossScene {
    constructor({ name, hp, hpLabel = "", bg = null }) {
      this.name = name;
      this.bossHp = hp;
      this.bossMax = hp;
      this.hpLabel = hpLabel;
      this.bg = bg;
      this.t = 0;
      this.over = false;
      this.resolveResult = null;
      this.result = new Promise((r) => (this.resolveResult = r));
      this.flashHurt = 0;
    }

    enter() {
      this.start();
    }

    // Para sobreescribir
    start() {}
    tick(dt) {}
    render() {}

    update(dt) {
      updateFloaters(dt);
      dialog.update(dt);
      if (dialog.active || this.over) return;
      this.t += dt;
      if (this.flashHurt > 0) this.flashHurt -= dt;
      this.tick(dt);
    }

    draw() {
      if (this.bg) BB.sprite(this.bg, 0, 0, { scale: 2 });
      this.render();
      drawFloaters();
      if (!this.drawsGameOver) BB.gameOver.draw(BB.ctx, W, H); // por detras de la interfaz
      this.drawHud();
      dialog.draw();
    }

    drawHud() {
      // Jefe arriba a la izquierda, jugador arriba a la derecha
      BB.frame(4, 4, 126, 26);
      BB.text(this.name, 10, 9, { size: 8 });
      BB.hpBar(10, 20, 114, this.bossHp, this.bossMax, { color: C.red });
      BB.frame(W - 130, 4, 126, 26);
      BB.text("PUMPKIN COWBOY", W - 124, 9, { size: 8 });
      BB.hpBar(W - 124, 20, 114, state.hp, state.maxHp);
    }

    hurt(n, label = "") {
      if (this.over) return;
      state.hp = Math.max(0, state.hp - n);
      this.flashHurt = 0.3;
      BB.shake(3, 0.25);
      BB.flash(C.red, 0.15);
      BB.sfx.hit();
      if (label) floatText(label, W - 64, 34, C.salmon);
      if (state.hp <= 0) this.finish(false);
    }

    heal(n, label = "") {
      state.hp = Math.min(state.maxHp, state.hp + n);
      BB.sfx.ok();
      if (label) floatText(label, W - 64, 34, C.green);
    }

    hitBoss(n, label = "") {
      if (this.over) return;
      this.bossHp = Math.max(0, this.bossHp - n);
      BB.sfx.catchIt();
      if (label) floatText(label, 64, 34, C.yellow);
      if (this.bossHp <= 0) this.finish(true);
    }

    async finish(win) {
      if (this.over) return;
      this.over = true;
      if (win) BB.sfx.win();
      else BB.sfx.lose();
      await BB.wait(0.6);
      this.resolveResult(win);
    }
  }

  BB.dialog = dialog;
  BB.floatText = floatText;
  BB.state = state;
  BB.BossScene = BossScene;
})();
