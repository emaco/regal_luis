// Jefe 3: el Masymas, espejismo de la sociedad capitalista.
// Caen productos de las estanterías. Coge agua y Coca-Cola (zero) con la cesta.
// Los espejismos parpadean y la Coca-Cola con azúcar es una trampa.

(() => {
  "use strict";
  const { W, H, C } = BB;

  class MasymasScene extends BB.BossScene {
    constructor() {
      super({ name: "MASYMAS", hp: 10 });
      this.px = W / 2;
      this.items = [];
      this.spawnT = 0;
      this.spawnEvery = 0.9;
      this.fall = 55;
      this.price = 1.2;
      this.flicker = 0;
    }

    async start() {
      await BB.dialog.say([
        "Aparece el Masymas. Las estanterías tiemblan.",
        "Coge el agua y la Coca-Cola (zero) con la cesta.",
        "Cuidado: lo que parpadea es un espejismo. Y la Coca-Cola con azúcar... ni tocarla.",
      ]);
    }

    spawn() {
      const r = Math.random();
      let type;
      if (r < 0.34) type = "agua";
      else if (r < 0.62) type = "cola";
      else if (r < 0.8) type = "cola_falsa";
      else if (r < 0.96) type = Math.random() < 0.5 ? "agua" : "cola";
      else type = "bianca";
      const mirage = r >= 0.8 && r < 0.96; // versión parpadeante de un producto bueno
      const lane = BB.randInt(0, 5);
      this.items.push({
        type,
        mirage,
        x: 36 + lane * 62 + BB.rand(-10, 10),
        y: 30,
        vy: this.fall * BB.rand(0.9, 1.25),
        phase: BB.rand(0, 6),
      });
    }

    tick(dt) {
      this.flicker += dt;
      this.spawnT += dt;
      if (this.spawnT > this.spawnEvery) {
        this.spawnT = 0;
        this.spawn();
      }

      // Movimiento de la cesta: puntero o teclado
      const inp = BB.input;
      if (inp.pointer.inside && (inp.pointer.down || Math.abs(inp.pointer.x - this.px) > 2)) {
        this.px = BB.lerp(this.px, inp.pointer.x, Math.min(1, dt * 12));
      }
      this.px += inp.axisX() * 170 * dt;
      this.px = BB.clamp(this.px, 30, W - 30);

      const by = H - 66;
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i];
        it.y += it.vy * dt;
        if (it.y > by - 8 && it.y < by + 12 && Math.abs(it.x - this.px) < 26) {
          this.items.splice(i, 1);
          this.collect(it);
          continue;
        }
        if (it.y > H + 10) this.items.splice(i, 1);
      }
    }

    collect(it) {
      if (it.mirage) {
        this.hurt(12, "¡espejismo!");
        BB.floatText("no existe", it.x, it.y - 10, C.salmon);
        return;
      }
      if (it.type === "cola_falsa") {
        this.hurt(12, "¡con azúcar!");
        return;
      }
      if (it.type === "bianca") {
        this.heal(15, "+15 Bianca");
        return;
      }
      this.price *= 1.09;
      BB.floatText(this.price.toFixed(2) + "€", it.x, it.y - 10, C.yellow);
      this.hitBoss(1);
      this.fall += 4;
      this.spawnEvery = Math.max(0.42, this.spawnEvery - 0.045);
      if (this.bossHp === 5) BB.dialog.say(["Megafonía: 'Los precios han subido mientras leías esto.'"], "MASYMAS");
    }

    render() {
      // Interior de supermercado: suelo, estanterías
      BB.rect(0, 0, W, H, C.cream);
      BB.rect(0, H - 30, W, 30, C.silver);
      for (let i = 0; i < 6; i++) {
        const x = 20 + i * 62;
        BB.rect(x - 6, 30, 40, H - 60, C.tan);
        for (let s = 0; s < 5; s++) {
          BB.rect(x - 6, 44 + s * 26, 40, 3, C.brown);
          for (let p = 0; p < 4; p++) {
            const col = [C.blue, C.red, C.green, C.amber][(p + s + i) % 4];
            BB.rect(x - 3 + p * 9, 34 + s * 26, 7, 10, col);
          }
        }
      }
      BB.sprite("masymas", W / 2, 20, { anchor: "center" });
      BB.text("MASYMAS", W / 2, 13, { size: 7, align: "center", color: C.red });

      for (const it of this.items) {
        let alpha = 1;
        if (it.mirage) alpha = 0.35 + 0.35 * Math.sin(this.flicker * 9 + it.phase);
        BB.sprite(it.type, it.x, it.y, { anchor: "center", alpha });
      }

      // Pumpkin con la cesta en alto
      const by = H - 66;
      BB.sprite("pumpkin-56", this.px, H - 2, { anchor: "bottom" });
      BB.rect(this.px - 26, by, 52, 14, C.brown);
      BB.rect(this.px - 24, by + 2, 48, 10, C.tan);
      BB.rect(this.px - 26, by, 52, 2, C.black);
      BB.rect(this.px - 2, by + 14, 4, 6, C.brown);
      BB.text("compra: " + this.price.toFixed(2) + "€", 6, H - 10, { size: 6, color: C.black });
    }
  }

  BB.bosses = BB.bosses || {};
  BB.bosses.masymas = {
    id: "masymas",
    title: "EL MASYMAS",
    subtitle: "espejismo de la sociedad capitalista",
    intro: ["Llegas al Masymas. O eso crees.", "Las puertas automáticas no se abren: te atraviesan."],
    win: [
      "El Masymas no existe, es un espejismo de la sociedad capitalista.",
      "Pero oye, la Coca-Cola (zero) te la llevas igual.",
    ],
    lose: ["Vuelves a casa sin nada. Son las 00:08. El Mafioso ha cerrado."],
    make: () => new MasymasScene(),
  };
})();
