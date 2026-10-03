// Jefe 2: la cucaracha del parque. Duelo a muerte con cuchillos.
// Barra de tensión: un marcador va y viene; pulsa cuando esté en la zona verde.
// Acierto: la cucaracha retrocede. Fallo: te lanza un cuchillo.

(() => {
  "use strict";
  const { W, H, C } = BB;

  const LINES = [
    "Será un... Duelo a muerte con cuchillos",
    "¿Duelo a muerte con cuchillos???",
    "¿Duelo a muerte con cuchillos?",
    "¿Qué es lo que piensan hacer???",
    "Yo creo que van a pelear con cuchillos.",
  ];

  class CucarachaScene extends BB.BossScene {
    constructor() {
      super({ name: "CUCARACHA", hp: 5 });
      // En tactil el toque llega con retardo y es menos preciso: mas margen.
      this.touch = !!BB.input.pointer.touch;
      this.marker = 0; // 0..1
      this.dir = 1;
      this.speed = this.touch ? 0.8 : 0.9; // recorrido por segundo
      this.zoneW = this.touch ? 0.28 : 0.22;
      this.zoneX = 0.5;
      this.knives = [];
      this.cucaX = W - 70;
      this.round = 0;
      this.cooldown = 0;
      this.lamp = 0;
    }

    async start() {
      this.newZone();
      await BB.dialog.say([
        "Sales de casa y te diriges al Masymas.",
        "Te encuentras con una cucaracha en el parque...",
        "Toca pelear. Mantén la tensión: pulsa cuando el marcador esté en la zona verde.",
      ]);
    }

    newZone() {
      this.zoneX = BB.rand(0.15 + this.zoneW / 2, 0.85 - this.zoneW / 2);
    }

    tick(dt) {
      this.lamp += dt;
      this.marker += this.dir * this.speed * dt;
      if (this.marker > 1) {
        this.marker = 1;
        this.dir = -1;
      }
      if (this.marker < 0) {
        this.marker = 0;
        this.dir = 1;
      }
      if (this.cooldown > 0) this.cooldown -= dt;

      const inp = BB.input;
      if (this.cooldown <= 0 && (inp.pointer.justDown || inp.justPressed("Space") || inp.justPressed("Enter"))) {
        // Lo que viste en pantalla va unos ms por detras del marcador real:
        // vale cualquier punto que el marcador haya recorrido en ese margen.
        const lag = this.touch ? 0.1 : 0.06;
        const seen = BB.clamp(this.marker - this.dir * this.speed * lag, 0, 1);
        const lo = Math.min(seen, this.marker);
        const hi = Math.max(seen, this.marker);
        const inZone = hi >= this.zoneX - this.zoneW / 2 && lo <= this.zoneX + this.zoneW / 2;
        this.cooldown = 0.25;
        if (inZone) this.good();
        else this.miss();
      }

      for (let i = this.knives.length - 1; i >= 0; i--) {
        const k = this.knives[i];
        k.x -= (this.touch ? 210 : 260) * dt;
        k.y += k.vy * dt;
        if (k.x < 40) {
          this.knives.splice(i, 1);
          this.hurt(15, "-15");
        }
      }
    }

    good() {
      const line = LINES[Math.min(this.round, LINES.length - 1)];
      this.round++;
      BB.floatText(line, W / 2, 60, C.yellow, 1.8);
      this.hitBoss(1);
      this.cucaX = Math.min(W - 30, this.cucaX + 8);
      this.speed += this.touch ? 0.22 : 0.28;
      this.zoneW = Math.max(this.touch ? 0.15 : 0.09, this.zoneW - 0.025);
      this.newZone();
    }

    miss() {
      BB.sfx.bad();
      BB.floatText("...", this.cucaX, 120, C.white);
      this.knives.push({ x: this.cucaX - 10, y: 130, vy: BB.rand(-10, 10) });
      this.cucaX = Math.max(W - 110, this.cucaX - 6);
    }

    render() {
      // Parque de noche: cielo, césped, farola
      BB.rect(0, 0, W, H, C.navy);
      for (let i = 0; i < 18; i++) {
        BB.rect((i * 53 + 17) % W, (i * 29 + 11) % 90, 1, 1, C.silver);
      }
      BB.rect(0, 140, W, H - 140, C.forest);
      BB.rect(0, 140, W, 3, C.dgreen);
      BB.rect(0, 160, W, 56, C.dark);
      BB.rect(0, 160, W, 2, C.gray);
      // Farola
      BB.rect(190, 60, 3, 82, C.gray);
      BB.rect(184, 56, 15, 6, C.gray);
      const glow = 0.25 + Math.sin(this.lamp * 6) * 0.05;
      BB.ctx.save();
      BB.ctx.globalAlpha = glow;
      BB.rect(150, 62, 83, 80, C.yellow);
      BB.ctx.restore();
      BB.rect(186, 58, 11, 4, C.yellow);

      // Combatientes
      BB.sprite("pumpkin-56", 60, 160, { anchor: "bottom" });
      BB.sprite("cuchillo", 84, 128);
      const bob = Math.sin(this.t * 10) * 1.5;
      BB.sprite("cucaracha", this.cucaX, 150 + bob, { anchor: "bottom", scale: 2 });
      BB.sprite("cuchillo", this.cucaX - 40, 124, { flip: true });

      for (const k of this.knives) BB.sprite("cuchillo", k.x, k.y, { anchor: "center", flip: true });

      // Barra de tensión
      const bx = 60;
      const bw = W - 120;
      const by = 180;
      BB.frame(bx - 6, by - 10, bw + 12, 26);
      BB.text("TENSIÓN", W / 2, by - 6, { size: 6, align: "center" });
      BB.rect(bx, by + 4, bw, 8, C.silver);
      BB.rect(bx + (this.zoneX - this.zoneW / 2) * bw, by + 4, this.zoneW * bw, 8, C.green);
      BB.rect(bx + this.marker * bw - 1, by + 2, 3, 12, C.red);
    }
  }

  BB.bosses = BB.bosses || {};
  BB.bosses.cucaracha = {
    id: "cucaracha",
    title: "LA CUCARACHA",
    subtitle: "duelo a muerte con cuchillos",
    intro: [
      "No queda ni agua ni Coca-Cola (zero) en casa.",
      "Toca ir al Masymas. Pero el parque está en medio...",
    ],
    win: [
      "La cucaracha no puede con tanta tensión y decide huir.",
      "A partir de este momento las cucarachas del parque te guardan respeto.",
    ],
    lose: ["Nunca había visto o escuchado algo así. Nunca. Las cucarachas se quedan con tu Bianca."],
    make: () => new CucarachaScene(),
    // Elección tras ganar: afecta al final
    async afterWin() {
      const i = await BB.dialog.ask("Unas cucarachas te escoltan. ¿Qué haces?", ["Dar una patata", "Ignorarlas"]);
      BB.state.flags.patata = i === 0;
      if (i === 0) {
        BB.sfx.ok();
        await BB.dialog.say(["Las cucarachas aceptan la patata. Una bonita amistad empieza."]);
      } else {
        await BB.dialog.say(["Las ignoras. Notas unas miradas clavadas en ti."]);
      }
    },
  };
})();
