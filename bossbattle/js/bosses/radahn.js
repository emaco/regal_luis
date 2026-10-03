// Jefe 5: Radahn, Consort of Miquella.
// Esquiva meteoritos y rayos de gravedad moviéndote libremente. Un toque y
// YOU DIED, pero cada muerte cuenta: como en el original, a la décima (o
// quinta) muerte el jefe cae igual. Si sobrevives al tiempo, también.

(() => {
  "use strict";
  const { W, H, C } = BB;

  const DEATH_PAUSE = 3.4; // lo que dura el clip de GameOver
  const DEATHS = {
    escudo: [
      "You died. Volver a intentar",
      "You died. Volver a intentar otra vez",
      "You died. Volver a intentar una vez mas",
      "You died. Volver a intentar y otra",
      "You died. Volver a intentar otra mas...",
      "You died. Volver a intentar, no hay manera...",
      "You died. Volver a intentar, hay que conseguirlo",
      "You died. Volver a intentar, volver a empezar...",
      "You died. Volver a intentar, joder tio...",
      "You died. Volver a intentar, he muerto en primera fase...",
    ],
    carnero: [
      "You died. Volver a intentar",
      "You died. Volver a intentar, fase 1 hecha",
      "You died. Volver a intentar, joder con los rayos",
      "You died. Volver a intentar, ese enganche...",
      "You died. Volver a intentar, 10%...",
    ],
  };
  const SURVIVE = 32;

  class RadahnScene extends BB.BossScene {
    constructor() {
      super({ name: "RADAHN", hp: SURVIVE, bg: "radahn" });
      this.build = "";
      this.px = W / 2;
      this.py = H - 40;
      this.speed = 100;
      this.meteors = []; // {x,y,t,state}
      this.beams = []; // {x,t,state}
      this.sweep = null; // {y, dir, x, t}
      this.nextMeteor = 1.5;
      this.nextBeam = 4;
      this.nextSweep = 7;
      this.deathT = 0;
      this.deathLine = "";
      this.drawsGameOver = true; // el clip se pinta en render(), entre el fondo oscuro y el texto
      this.shieldCd = 0;
      this.bossX = W / 2;
      this.phase = 1;
    }

    async start() {
      const i = await BB.dialog.ask("¿Qué build quieres usar?", ["Escudo con pincho: lento, bloquea 1", "Pata de carnero: rápido"]);
      this.build = i === 0 ? "escudo" : "carnero";
      BB.state.flags.build = this.build;
      this.speed = this.build === "escudo" ? 95 : 150;
      await BB.dialog.say(["Radahn, Consort of Miquella, desciende de las estrellas.", "Esquiva. Sobrevive. Muere las veces que haga falta."]);
    }

    reset() {
      this.meteors = [];
      this.beams = [];
      this.sweep = null;
      this.nextMeteor = 1.2;
      this.nextBeam = 3;
      this.nextSweep = 6;
      this.px = W / 2;
      this.py = H - 40;
      this.shieldCd = 0;
      // Al reaparecer se restauran las barras: el tiempo de Radahn y tu vida
      this.bossHp = SURVIVE;
      this.phase = 1;
      BB.state.hp = BB.state.maxHp;
    }

    die() {
      if (this.over) return;
      if (this.build === "escudo" && this.shieldCd <= 0) {
        this.shieldCd = 7;
        BB.sfx.ok();
        BB.flash(C.silver, 0.2);
        BB.floatText("¡bloqueado!", this.px, this.py - 30, C.silver);
        return;
      }
      BB.state.deaths++;
      BB.sfx.lose();
      BB.gameOver.play("assets/gameover/gameover.mp4");
      BB.shake(5, 0.5);
      const lines = DEATHS[this.build];
      const n = Math.min(BB.state.deaths, lines.length);
      this.deathLine = lines[n - 1];
      this.deathT = DEATH_PAUSE;
      if (n >= lines.length) {
        // A la enésima muerte el juego original te daba la victoria igual.
        this.deathT = DEATH_PAUSE;
        this.finalDeath = true;
      }
    }

    tick(dt) {
      if (this.deathT > 0) {
        this.deathT -= dt;
        if (this.deathT <= 0) {
          if (this.finalDeath) {
            BB.state.flags.cansino = true; // ganas por cansino, no por aguantar
            this.finish(true);
            return;
          }
          this.reset();
        }
        return;
      }
      this.bossHp = Math.max(0, this.bossHp - dt);
      if (this.bossHp <= 0) {
        this.finish(true);
        return;
      }
      if (this.shieldCd > 0) this.shieldCd -= dt;
      this.phase = this.bossHp < SURVIVE / 2 ? 2 : 1;

      // Movimiento libre: puntero (arrastrar) o teclado
      const inp = BB.input;
      if (inp.pointer.down && inp.pointer.inside) {
        const dx = inp.pointer.x - this.px;
        const dy = inp.pointer.y - this.py;
        const d = Math.hypot(dx, dy);
        if (d > 2) {
          const step = Math.min(d, this.speed * dt);
          this.px += (dx / d) * step;
          this.py += (dy / d) * step;
        }
      }
      this.px += inp.axisX() * this.speed * dt;
      this.py += inp.axisY() * this.speed * dt;
      this.px = BB.clamp(this.px, 12, W - 12);
      this.py = BB.clamp(this.py, 70, H - 14);

      this.bossX = W / 2 + Math.sin(this.t * 0.7) * 90;

      // Meteoritos
      this.nextMeteor -= dt;
      if (this.nextMeteor <= 0) {
        this.nextMeteor = this.phase === 2 ? BB.rand(0.45, 0.8) : BB.rand(0.8, 1.3);
        const aim = Math.random() < 0.5;
        this.meteors.push({ x: aim ? this.px : BB.rand(20, W - 20), y: aim ? this.py : BB.rand(80, H - 20), t: 0, state: "warn" });
      }
      for (let i = this.meteors.length - 1; i >= 0; i--) {
        const m = this.meteors[i];
        m.t += dt;
        if (m.state === "warn" && m.t > 0.9) {
          m.state = "boom";
          m.t = 0;
          BB.sfx.hit();
          BB.shake(2, 0.15);
          if (BB.dist(m.x, m.y, this.px, this.py) < 20) this.die();
        }
        if (m.state === "boom" && m.t > 0.35) this.meteors.splice(i, 1);
      }

      // Rayos de gravedad verticales
      this.nextBeam -= dt;
      if (this.nextBeam <= 0) {
        this.nextBeam = this.phase === 2 ? BB.rand(1.6, 2.4) : BB.rand(2.6, 3.6);
        const n = this.phase === 2 ? 2 : 1;
        for (let k = 0; k < n; k++) this.beams.push({ x: Math.random() < 0.6 ? this.px + BB.rand(-20, 20) : BB.rand(20, W - 20), t: 0, state: "warn" });
        BB.sfx.warn();
      }
      for (let i = this.beams.length - 1; i >= 0; i--) {
        const b = this.beams[i];
        b.t += dt;
        if (b.state === "warn" && b.t > 0.8) {
          b.state = "fire";
          b.t = 0;
          BB.sfx.zap();
        }
        if (b.state === "fire") {
          // Un rayo solo golpea una vez: si el escudo lo bloquea, ya esta absorbido.
          if (b.t < 0.4 && !b.hit && Math.abs(this.px - b.x) < 14) {
            b.hit = true;
            this.die();
          }
          if (b.t > 0.5) this.beams.splice(i, 1);
        }
      }

      // Enganche: barrido horizontal
      this.nextSweep -= dt;
      if (this.nextSweep <= 0 && !this.sweep) {
        this.nextSweep = this.phase === 2 ? 5 : 8;
        const dir = Math.random() < 0.5 ? 1 : -1;
        this.sweep = { y: this.py, dir, x: dir === 1 ? -40 : W + 40, t: 0 };
        BB.floatText("¡ENGANCHE!", W / 2, 60, C.red, 1);
      }
      if (this.sweep) {
        const s = this.sweep;
        s.t += dt;
        if (s.t > 0.8) {
          s.x += s.dir * 300 * dt;
          if (!s.hit && Math.abs(s.x - this.px) < 16 && Math.abs(s.y - this.py) < 12) {
            s.hit = true; // el barrido tambien golpea una sola vez
            this.die();
          }
          if (s.x < -60 || s.x > W + 60) this.sweep = null;
        }
      }
    }

    render() {
      // Radahn flotando arriba
      const bob = Math.sin(this.t * 2) * 3;
      BB.sprite("radahn-80", this.bossX, 36 + bob, { anchor: "center" });

      for (const m of this.meteors) {
        if (m.state === "warn") {
          const r = 16 + Math.sin(m.t * 20) * 2;
          BB.ctx.save();
          BB.ctx.globalAlpha = 0.5;
          BB.ctx.strokeStyle = C.red;
          BB.ctx.lineWidth = 2;
          BB.ctx.beginPath();
          BB.ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
          BB.ctx.stroke();
          BB.ctx.restore();
          const fall = 1 - m.t / 0.9;
          BB.sprite("meteorito", m.x, m.y - fall * 140, { anchor: "center" });
        } else {
          const k = m.t / 0.35;
          BB.ctx.save();
          BB.ctx.globalAlpha = 1 - k;
          BB.rect(m.x - 20 * k - 4, m.y - 20 * k - 4, 40 * k + 8, 40 * k + 8, C.orange);
          BB.rect(m.x - 12 * k - 3, m.y - 12 * k - 3, 24 * k + 6, 24 * k + 6, C.yellow);
          BB.ctx.restore();
        }
      }
      for (const b of this.beams) {
        if (b.state === "warn") {
          BB.ctx.save();
          BB.ctx.globalAlpha = 0.25 + Math.sin(b.t * 25) * 0.15;
          BB.rect(b.x - 12, 0, 24, H, C.purple);
          BB.ctx.restore();
        } else {
          BB.ctx.save();
          BB.ctx.globalAlpha = b.t < 0.4 ? 0.9 : 0.3;
          BB.rect(b.x - 14, 0, 28, H, C.pink);
          BB.rect(b.x - 6, 0, 12, H, C.white);
          BB.ctx.restore();
        }
      }
      if (this.sweep) {
        const s = this.sweep;
        if (s.t <= 0.8) {
          BB.ctx.save();
          BB.ctx.globalAlpha = 0.3;
          BB.rect(0, s.y - 10, W, 20, C.red);
          BB.ctx.restore();
        } else {
          BB.rect(s.x - 30, s.y - 3, 60, 6, C.amber);
          BB.rect(s.x - 36, s.y - 1, 72, 2, C.yellow);
        }
      }

      // Jugador
      if (this.deathT <= 0) {
        BB.sprite("pumpkin-56", this.px, this.py + 14, { anchor: "bottom", scale: 0.5 });
        if (this.build === "escudo") BB.sprite("escudo", this.px + 14, this.py - 4, { anchor: "center", alpha: this.shieldCd > 0 ? 0.3 : 1 });
        else BB.sprite("carnero", this.px + 14, this.py - 2, { anchor: "center" });
      }
      BB.text("muertes: " + BB.state.deaths, 8, H - 10, { size: 6, color: C.white, shadow: C.black });
      BB.text(Math.ceil(this.bossHp) + "s", W - 8, H - 10, { size: 6, align: "right", color: C.white, shadow: C.black });

      if (this.deathT > 0) {
        BB.ctx.save();
        BB.ctx.globalAlpha = 0.75;
        BB.rect(0, 0, W, H, C.black);
        BB.ctx.restore();
        BB.gameOver.draw(BB.ctx, W, H);
        BB.text("YOU DIED", W / 2, H / 2 - 18, { size: 16, align: "center", color: C.darkred });
        BB.wrap(this.deathLine, W - 40, 6).forEach((l, i) => BB.text(l, W / 2, H / 2 + 8 + i * 9, { size: 6, align: "center", color: C.silver }));
      }
    }
  }

  BB.bosses = BB.bosses || {};
  BB.bosses.radahn = {
    id: "radahn",
    title: "RADAHN",
    subtitle: "Consort of Miquella",
    intro: ["Decides matar el rato con un poco de Elden Ring.", "Me queda nada para pasármelo otra vez..."],
    // Si ganas por acumular muertes, Radahn se rinde por cansancio.
    get win() {
      const run = "¡Oh no! ¡Son las 22:45! ¡Correr al Mafioso!";
      if (BB.state.flags.cansino) {
        return ["Dormammu, he venido a negociar.", "RADAHN: ¡AGHHHHH!", "Radahn se suicida. Ganas por cansino.", run];
      }
      return ["Enemy defeated.", run];
    },
    lose: ["Esto no debería pasar nunca."],
    make: () => new RadahnScene(),
  };
})();
