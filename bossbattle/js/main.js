// Flujo del juego: título -> intro -> jefes en orden -> (jefe oculto) -> final.
// Las escenas de historia y los jefes se encadenan con async/await.

(() => {
  "use strict";
  const { W, H, C } = BB;

  const ASSETS = {
    sprites: {
      "pumpkin-56": "assets/sprites/pumpkin-56.png",
      "pumpkin-96": "assets/sprites/pumpkin-96.png",
      "soul-28": "assets/sprites/soul-28.png",
      "soul-72": "assets/sprites/soul-72.png",
      "radahn-80": "assets/sprites/radahn-80.png",
      "radahn-120": "assets/sprites/radahn-120.png",
      "lion-64": "assets/sprites/lion-64.png",
      kira: "assets/sprites/kira.png",
      cucaracha: "assets/sprites/cucaracha.png",
      enchufe: "assets/sprites/enchufe.png",
      rayo: "assets/sprites/rayo.png",
      bianca: "assets/sprites/bianca.png",
      cola: "assets/sprites/cola.png",
      cola_falsa: "assets/sprites/cola_falsa.png",
      agua: "assets/sprites/agua.png",
      patata: "assets/sprites/patata.png",
      cuchillo: "assets/sprites/cuchillo.png",
      meteorito: "assets/sprites/meteorito.png",
      escudo: "assets/sprites/escudo.png",
      carnero: "assets/sprites/carnero.png",
      corazon: "assets/sprites/corazon.png",
      flecha: "assets/sprites/flecha.png",
      masymas: "assets/sprites/masymas.png",
      puerta: "assets/sprites/puerta.png",
    },
    bgs: {
      fallout: "assets/bg/fallout.png",
      radahn: "assets/bg/radahn.png",
      mesa: "assets/bg/mesa.png",
      trascending: "assets/bg/trascending.png",
      pumpkin: "assets/bg/pumpkin.png",
    },
  };
  const MUSIC = {
    calm: "assets/audio/pizza-tune.mp3",
    battle: "assets/audio/pumpkin-cowboy.mp3",
  };
  const ORDER = ["soul", "cucaracha", "masymas", "kira", "radahn"];

  class Restart extends Error {}

  // ---------- Escenas de apoyo ----------
  class TitleScene {
    constructor() {
      this.t = 0;
      this.done = new Promise((r) => (this.resolve = r));
    }
    update(dt) {
      this.t += dt;
      if (this.t > 0.5 && BB.input.advance) {
        BB.sfx.ok();
        this.resolve();
      }
    }
    draw() {
      BB.sprite("pumpkin", 0, 0, { scale: 2 });
      BB.ctx.save();
      BB.ctx.globalAlpha = 0.45;
      BB.rect(0, 0, W, H, C.black);
      BB.ctx.restore();
      BB.text("Belf, Elena & Marcos presentan", W / 2, 24, { size: 8, align: "center", color: C.silver, shadow: C.black });
      BB.text("PUMPKIN COWBOY", W / 2, 54, { size: 16, align: "center", color: C.amber, shadow: C.darkred });
      BB.text("BOSS BATTLE", W / 2, 78, { size: 12, align: "center", color: C.white, shadow: C.black });
      const bob = Math.sin(this.t * 2) * 3;
      BB.sprite("pumpkin-96", W / 2, 180 + bob, { anchor: "bottom" });
      if (Math.floor(this.t * 2) % 2 === 0) {
        BB.text("toca para empezar", W / 2, 196, { size: 7, align: "center", color: C.yellow, shadow: C.black });
      }
      BB.text("M: silenciar", W - 6, H - 9, { size: 5, align: "right", color: C.lgray });
    }
  }

  class StoryScene {
    constructor(bg) {
      this.bg = bg;
      this.t = 0;
    }
    update(dt) {
      this.t += dt;
      BB.dialog.update(dt);
    }
    draw() {
      if (this.bg) BB.sprite(this.bg, 0, 0, { scale: 2 });
      else BB.rect(0, 0, W, H, C.navy);
      if (this.extra) this.extra(this.t);
      BB.dialog.draw();
    }
  }

  async function story(bg, lines, speaker = "", extra = null) {
    const s = new StoryScene(bg);
    s.extra = extra;
    BB.setScene(s);
    await BB.dialog.say(lines, speaker);
  }

  class VsScene {
    constructor(def) {
      this.def = def;
      this.t = 0;
      this.done = new Promise((r) => (this.resolve = r));
    }
    update(dt) {
      this.t += dt;
      if (this.t > 2.6 || (this.t > 0.8 && BB.input.advance)) this.resolve();
    }
    draw() {
      BB.rect(0, 0, W, H, C.black);
      const k = Math.min(1, this.t / 0.5);
      BB.rect(0, 0, W * k, H / 2, C.orange);
      BB.rect(W - W * k, H / 2, W * k, H / 2, C.darkred);
      BB.sprite("pumpkin-96", 70, H / 2 - 4, { anchor: "bottom" });
      BB.text("PUMPKIN COWBOY", 20, 20, { size: 8, color: C.black });
      BB.text("VS", W / 2, H / 2 - 10, { size: 20, align: "center", color: C.white, shadow: C.black });
      const sp = { soul: ["soul-72", 1], cucaracha: ["cucaracha", 3], masymas: ["puerta", 3], kira: ["kira", 3], radahn: ["radahn-80", 1], crucigrama: [null, 1] }[this.def.id];
      if (sp && sp[0]) BB.sprite(sp[0], W - 70, H / 2 + 40, { anchor: "center", scale: sp[1] });
      if (this.t > 0.6) {
        BB.text(this.def.title, W - 20, H - 40, { size: 10, align: "right", color: C.white, shadow: C.black });
        BB.text(this.def.subtitle, W - 20, H - 24, { size: 8, align: "right", color: C.silver });
      }
    }
  }

  class EndScene {
    constructor(secret) {
      this.secret = secret;
      this.t = 0;
    }
    update(dt) {
      this.t += dt;
      BB.dialog.update(dt);
    }
    draw() {
      BB.sprite(this.secret ? "trascending" : "mesa", 0, 0, { scale: 2 });
      const bob = Math.sin(this.t * 1.5) * (this.secret ? 10 : 2);
      BB.sprite("pumpkin-96", W / 2, 150 + bob, { anchor: "bottom" });
      BB.sprite("bianca", W / 2 + 40, 110 + bob, { anchor: "center", scale: 2 });
      BB.dialog.draw();
    }
  }

  class CreditsScene {
    constructor() {
      this.t = 0;
      this.done = new Promise((r) => (this.resolve = r));
      this.lines = [
        "PUMPKIN COWBOY: BOSS BATTLE",
        "",
        "Belf, Elena & Marcos",
        "",
        "Protagonista: Pumpkin Cowboy",
        "Gato: Soul",
        "Perra suelta: Kira",
        "Cucaracha: ella misma",
        "Supermercado: no existe",
        "Consorte: Radahn",
        "Crucigrama: The Guardian 16983",
        "",
        "Muertes contra Radahn: " + BB.state.deaths,
        "Amistad cucarachil: " + (BB.state.flags.patata ? "sí" : "no"),
        "Final verdadero: " + (BB.state.flags.meNiego ? "sí" : "no"),
        "",
        "Gracias por conseguir la Bianca.",
        "",
        "toca para volver al título",
      ];
    }
    update(dt) {
      this.t += dt;
      if (this.t > 1.5 && BB.input.advance) this.resolve();
    }
    draw() {
      BB.rect(0, 0, W, H, C.black);
      const y0 = H - this.t * 18;
      this.lines.forEach((l, i) => {
        const y = y0 + i * 14;
        if (y > -10 && y < H) BB.text(l, W / 2, y, { size: 8, align: "center", color: i === 0 ? C.amber : C.white });
      });
      BB.sprite("lion-64", W / 2, Math.max(H - this.t * 18 + this.lines.length * 14 + 20, -70), { anchor: "center" });
    }
  }

  // ---------- Flujo ----------
  async function runBoss(id) {
    const def = BB.bosses[id];
    BB.music.play(MUSIC.calm, { volume: 0.35 });
    await story("pumpkin", def.intro);

    const vs = new VsScene(def);
    BB.setScene(vs);
    BB.sfx.warn();
    await vs.done;

    for (;;) {
      const scene = def.make();
      BB.music.play(MUSIC.battle, { volume: 0.45 });
      BB.setScene(scene);
      const win = await scene.result;
      if (win) {
        BB.music.play(MUSIC.calm, { volume: 0.35 });
        await BB.dialog.say(def.win);
        if (def.afterWin) await def.afterWin();
        if (id !== "radahn" && id !== "crucigrama") {
          const before = BB.state.hp;
          BB.state.hp = Math.min(BB.state.maxHp, BB.state.hp + 40);
          BB.sfx.ok();
          await BB.dialog.say(["Te imaginas una porción de Bianca. +" + (BB.state.hp - before) + " de vida."]);
        }
        return;
      }
      BB.music.stop();
      await BB.dialog.say(def.lose);
      const i = await BB.dialog.ask("GAME OVER", ["Volver a intentar", "Rendirse"]);
      if (i === 1) throw new Restart();
      BB.state.hp = BB.state.maxHp;
    }
  }

  async function ending() {
    const f = BB.state.flags;
    const secret = f.meNiego;
    const lines = ["Llegas al Mafioso. Como ven tu cara de agobio, deciden regalarte un tiramisú extra."];
    if (f.build === "carnero") lines.push("Son las 22:20. Perfecto.");
    else lines.push("Son las 22:45. Por los pelos.");
    if (f.patata) lines.push("Unas cucarachas te escoltan hasta la puerta. A los pocos días recibes una invitación a una boda cucarachil.");
    else lines.push("De camino, en el parque, notas unas miradas clavadas en ti.");
    lines.push("¡Enhorabuena! Consigues tu Bianca a tiempo.");
    if (secret) {
      lines.push("Tras vencer al crucigrama tu ser abandona la materialidad.");
      lines.push("Mientras levitas, ponderas la necesidad de Bianca.");
      lines.push("...Y aun así te la comes. FINAL VERDADERO.");
    }
    BB.music.play(MUSIC.calm, { volume: 0.35 });
    const e = new EndScene(secret);
    BB.setScene(e);
    await BB.dialog.say(lines);
    const c = new CreditsScene();
    BB.setScene(c);
    await c.done;
  }

  async function game() {
    for (;;) {
      BB.state.reset();
      const title = new TitleScene();
      BB.setScene(title);
      await title.done;
      BB.music.play(MUSIC.calm, { volume: 0.35 });
      try {
        await story("pumpkin", [
          "Te apetece Mafioso. Pides una Bianca, obviamente.",
          "'Vale, la tendrás a las 22:30.' Pues toca esperar.",
          "A ver en qué puedo matar el tiempo...",
        ]);
        for (const id of ORDER) await runBoss(id);
        if (BB.state.flags.meNiego) await runBoss("crucigrama");
        await ending();
      } catch (e) {
        if (!(e instanceof Restart)) throw e;
      }
    }
  }

  async function boot() {
    const all = { ...ASSETS.sprites, ...ASSETS.bgs };
    try {
      await document.fonts.load('8px "Press Start 2P"');
    } catch (_) {
      /* fuente de respaldo */
    }
    await BB.loadImages(all);
    document.getElementById("loading").hidden = true;
    document.getElementById("mute").addEventListener("click", () => BB.music.toggleMute());
    BB.start();
    game();
  }

  boot();
})();
