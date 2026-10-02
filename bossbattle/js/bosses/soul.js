// Jefe 1: Soul y el enchufe.
// Soul corre hacia el enchufe de la derecha. Toca a Soul para devolverlo al
// principio. Si llega al enchufe, chispazo y pierdes vida.

(() => {
  "use strict";
  const { W, H, C } = BB;

  class SoulScene extends BB.BossScene {
    constructor() {
      super({ name: "SOUL", hp: 8, bg: "mesa" });
      this.plug = { x: W - 22, y: 104 };
      this.soul = null;
      this.speed = 48;
      this.zapT = 0;
      this.catchAnim = 0;
      this.phrases = ["MIAU", "PRRR", "MIAAAU", "HSSS", "¡NO!", "MIAU?"];
    }

    async start() {
      this.spawn();
      await BB.dialog.say([
        "Localizas a Soul. Está jugando con un enchufe.",
        "¡Rápido! Toca a Soul antes de que llegue al enchufe.",
        "Si lo toca... selección natural. Y tú te llevas el susto.",
      ]);
    }

    spawn() {
      this.soul = {
        x: -20,
        y: BB.rand(40, H - 40),
        baseY: 0,
        wob: BB.rand(0, 6),
        amp: BB.rand(8, 22),
        dir: 1,
        flip: false,
      };
      this.soul.baseY = this.soul.y;
    }

    tick(dt) {
      const s = this.soul;
      if (this.zapT > 0) {
        this.zapT -= dt;
        if (this.zapT <= 0) this.spawn();
        return;
      }
      if (this.catchAnim > 0) this.catchAnim -= dt;

      s.wob += dt * 3;
      s.x += this.speed * dt;
      s.y = BB.clamp(s.baseY + Math.sin(s.wob) * s.amp, 36, H - 30);

      // Soul hace fintas: cambia de carril de vez en cuando
      if (Math.random() < dt * 0.6) s.baseY = BB.clamp(s.baseY + BB.rand(-40, 40), 40, H - 40);

      const p = BB.input.pointer;
      if (p.justDown && BB.dist(p.x, p.y, s.x, s.y) < 20) {
        this.catchSoul();
        return;
      }

      if (s.x > this.plug.x - 10) {
        this.zap();
      }
    }

    catchSoul() {
      BB.floatText(BB.pick(this.phrases), this.soul.x, this.soul.y - 18, C.yellow);
      this.hitBoss(1);
      this.speed += 11;
      this.catchAnim = 0.3;
      if (this.bossHp === 4) {
        BB.dialog.say(["Soul: LEROOOOOOY JENKINSSSSSS!"], "SOUL");
      }
      if (!this.over) this.spawn();
    }

    zap() {
      this.zapT = 0.8;
      BB.sfx.zap();
      BB.flash(C.yellow, 0.3);
      this.hurt(20, "-20 ¡ZAS!");
      BB.floatText("¡CHISPAZO!", this.plug.x - 30, this.plug.y - 24, C.yellow);
    }

    render() {
      // Cable y enchufe
      BB.rect(this.plug.x + 4, this.plug.y + 12, 2, H - this.plug.y - 12, C.black);
      BB.sprite("enchufe", this.plug.x, this.plug.y, { anchor: "center" });
      if (this.zapT > 0) {
        BB.sprite("rayo", this.plug.x - 12, this.plug.y - 24, { scale: 1 });
        BB.sprite("rayo", this.plug.x + 4, this.plug.y - 30, { flip: true });
        BB.sprite("soul-28", this.plug.x - 22, this.plug.y, { anchor: "center", alpha: Math.random() > 0.5 ? 1 : 0.3 });
      } else if (this.soul) {
        const s = this.soul;
        const sc = this.catchAnim > 0 ? 1 : 1;
        BB.sprite("soul-28", s.x, s.y, { anchor: "center", scale: sc, flip: true });
        // Sombra
        BB.rect(s.x - 10, s.y + 12, 20, 2, "rgba(0,0,0,0.35)");
      }
      // Pumpkin cowboy mirando desde la esquina
      BB.sprite("pumpkin-56", 8, H - 6, { anchor: "bottom" });
      if (!BB.dialog.active) {
        BB.text("¡toca a Soul!", W / 2, H - 12, { size: 6, align: "center", color: C.white, shadow: C.black });
      }
    }
  }

  BB.bosses = BB.bosses || {};
  BB.bosses.soul = {
    id: "soul",
    title: "SOUL",
    subtitle: "el gato del enchufe",
    intro: [
      "Son las 20:30. Hay que esperar a la Bianca.",
      "Oyes un ruido en el salón... Es Soul.",
    ],
    win: [
      "Consigues atrapar a Soul y meterlo en casa.",
      "Se pone un poco violento, pero solo te hace un rasguño.",
    ],
    lose: ["Soul acaba frito. Ya no te apetece una Bianca, ahora te apetece una Barbacoa..."],
    make: () => new SoulScene(),
  };
})();
