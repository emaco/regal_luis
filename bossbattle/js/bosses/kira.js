// Jefe 4: Kira, la border collie que siempre va suelta.
// Te ha arrastrado al yermo de Fallout. Tres carriles: Kira embiste por uno
// (aviso "!" antes). Aguanta hasta que se canse. Después, la terminal.

(() => {
  "use strict";
  const { W, H, C } = BB;

  const LANES = [W / 2 - 110, W / 2, W / 2 + 110];
  const SURVIVE = 28; // segundos

  class KiraScene extends BB.BossScene {
    constructor() {
      super({ name: "KIRA", hp: SURVIVE, bg: "fallout" });
      this.lane = 1;
      this.px = LANES[1];
      this.charges = []; // {lane, t, state: 'warn'|'run', y}
      this.nextT = 1.2;
      this.interval = 1.7;
      this.hitCd = 0;
      this.weeds = [];
      this.barkT = 0;
    }

    async start() {
      await BB.dialog.say([
        "Suddenly.... KIRAAAAAAA",
        "Kira aparece en la escena. Eres transportado al mundo del Fallout.",
        "Esquiva sus embestidas: muévete entre carriles con las flechas o tocando a los lados.",
      ]);
    }

    tick(dt) {
      // Movimiento entre carriles
      const inp = BB.input;
      if (inp.justPressed("ArrowLeft") || inp.justPressed("KeyA")) this.lane = Math.max(0, this.lane - 1);
      if (inp.justPressed("ArrowRight") || inp.justPressed("KeyD")) this.lane = Math.min(2, this.lane + 1);
      if (inp.pointer.justDown) {
        if (inp.pointer.x < W / 2 - 20) this.lane = Math.max(0, this.lane - 1);
        else if (inp.pointer.x > W / 2 + 20) this.lane = Math.min(2, this.lane + 1);
      }
      this.px = BB.lerp(this.px, LANES[this.lane], Math.min(1, dt * 14));

      // Tiempo = vida del jefe
      this.bossHp = Math.max(0, this.bossHp - dt);
      if (this.bossHp <= 0) {
        this.finish(true);
        return;
      }
      if (this.hitCd > 0) this.hitCd -= dt;

      // Embestidas
      this.nextT -= dt;
      if (this.nextT <= 0) {
        this.nextT = this.interval;
        this.interval = Math.max(0.75, this.interval - 0.06);
        const n = this.t > 12 && Math.random() < 0.45 ? 2 : 1;
        const lanes = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, n);
        for (const l of lanes) this.charges.push({ lane: l, t: 0, state: "warn", y: 20 });
        BB.sfx.warn();
      }
      for (let i = this.charges.length - 1; i >= 0; i--) {
        const c = this.charges[i];
        c.t += dt;
        if (c.state === "warn" && c.t > 0.7) {
          c.state = "run";
          c.t = 0;
          this.barkT = 0.3;
        }
        if (c.state === "run") {
          c.y += 330 * dt;
          const py = H - 30;
          if (c.lane === this.lane && Math.abs(c.y - py) < 18 && this.hitCd <= 0) {
            this.hitCd = 0.8;
            this.hurt(20, "¡GUAU!");
          }
          if (c.y > H + 30) this.charges.splice(i, 1);
        }
      }
      if (this.barkT > 0) this.barkT -= dt;

      // Plantas rodadoras decorativas
      if (Math.random() < dt * 0.4) this.weeds.push({ x: -10, y: BB.rand(120, 190), r: BB.rand(0, 6) });
      for (let i = this.weeds.length - 1; i >= 0; i--) {
        const w = this.weeds[i];
        w.x += 40 * dt;
        w.r += dt * 4;
        if (w.x > W + 10) this.weeds.splice(i, 1);
      }
    }

    render() {
      // Carriles
      for (const lx of LANES) {
        BB.ctx.save();
        BB.ctx.globalAlpha = 0.18;
        BB.rect(lx - 34, 30, 68, H - 30, C.black);
        BB.ctx.restore();
      }
      for (const w of this.weeds) {
        BB.rect(w.x - 3, w.y - 3, 6, 6, C.brown);
        BB.rect(w.x - 1 + Math.cos(w.r) * 3, w.y - 1 + Math.sin(w.r) * 3, 2, 2, C.tan);
      }
      // Avisos y Kira
      for (const c of this.charges) {
        const lx = LANES[c.lane];
        if (c.state === "warn") {
          if (Math.floor(c.t * 10) % 2 === 0) {
            BB.text("!", lx, 34, { size: 12, align: "center", color: C.red, shadow: C.black });
          }
          BB.sprite("kira", lx, 20, { anchor: "center", alpha: 0.6 });
        } else {
          BB.sprite("kira", lx, c.y, { anchor: "center", scale: 2 });
          BB.rect(lx - 10, c.y - 40, 20, 3, "rgba(255,255,255,0.25)");
        }
      }
      if (this.barkT > 0) BB.text("¡GUAU!", W / 2, 50, { size: 10, align: "center", color: C.white, shadow: C.black });
      // Jugador
      const hurtBlink = this.hitCd > 0 && Math.floor(this.t * 20) % 2 === 0;
      if (!hurtBlink) BB.sprite("pumpkin-56", this.px, H - 4, { anchor: "bottom" });
      BB.text("aguanta " + Math.ceil(this.bossHp) + "s", W / 2, H - 12, { size: 6, align: "center", color: C.white, shadow: C.black });
    }
  }

  BB.bosses = BB.bosses || {};
  BB.bosses.kira = {
    id: "kira",
    title: "KIRA",
    subtitle: "la border collie que siempre va suelta",
    intro: ["Sales del Masymas.", "Al volver por el parque..."],
    win: ["Kira se cansa, te lame la cara y se va corriendo por donde ha venido.", "Pero sigues en el yermo."],
    lose: ["Kira te pastorea hasta el fin del mundo. Te quedas sin Bianca."],
    make: () => new KiraScene(),
    // La terminal del yermo: aquí se esconde la condición secreta.
    async afterWin() {
      await BB.dialog.say(
        ["Bienvenido al mundo de Fallout. Si quieres volver, deberás cumplir con una misión.", "¡Debes completar este crucigrama!"],
        "TERMINAL"
      );
      const i = await BB.dialog.ask("¿Qué respondes?", ["¡He acabado el crucigrama!", "Me niego a acabar esto."]);
      if (i === 0) {
        await BB.dialog.say(["Mentira, pero va, aprobado. Puedes volver a clase. 10 puntos para Gryffindor."], "TERMINAL");
      } else {
        BB.state.flags.meNiego = true;
        BB.sfx.bad();
        BB.flash(C.white, 0.6);
        await BB.dialog.say(
          ["Quedas perdido en el tiempo y el espacio.", "...", "Algo, en algún lugar, ha apuntado tu nombre en una casilla."],
          "TERMINAL"
        );
      }
      await BB.dialog.say(["Tu casa se materializa. Mejor pasar del Masymas.", "Solo queda una cosa antes del Mafioso."]);
    },
  };
})();
