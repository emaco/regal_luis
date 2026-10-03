// Jefe oculto: EL CRUCIGRAMA.
// Solo aparece si en la terminal de Kira elegiste "Me niego a acabar esto".
// Sus ataques son pistas. Escribe la palabra antes de que se agote el tiempo.

(() => {
  "use strict";
  const { W, H, C } = BB;

  const CLUES = [
    { clue: "Pizza blanca que motiva toda esta aventura (6)", answer: "BIANCA" },
    { clue: "Gato aficionado a los enchufes (4)", answer: "SOUL" },
    { clue: "Pizzería de confianza (7)", answer: "MAFIOSO" },
    { clue: "Postre extra que te regalan por tu cara de agobio (8)", answer: "TIRAMISU" },
    { clue: "Perra que siempre va suelta (4)", answer: "KIRA" },
    { clue: "Supermercado que puede ser un espejismo (7)", answer: "MASYMAS" },
    { clue: "Consorte de Miquella (6)", answer: "RADAHN" },
    { clue: "Insecto del parque que ahora te respeta (9)", answer: "CUCARACHA" },
    { clue: "El desayuno de los campeones (7)", answer: "COLACAO" },
    { clue: "Lo que gritas antes de salir disparado, apellido (7)", answer: "JENKINS" },
    { clue: "Fruta con sombrero que canta (8)", answer: "CALABAZA" },
    { clue: "Mundo postapocalíptico al que te manda Kira (7)", answer: "FALLOUT" },
  ];
  const TIME = 22;
  const NEEDED = 7;

  class CrucigramaScene extends BB.BossScene {
    constructor() {
      super({ name: "EL CRUCIGRAMA", hp: NEEDED });
      this.pool = CLUES.slice().sort(() => Math.random() - 0.5);
      this.current = null;
      this.timer = 0;
      this.solved = [];
      this.input = document.getElementById("word");
      this.clueText = document.getElementById("clueText"); // la pista tambien va en HTML (movil con teclado)
      this.clueBar = document.querySelector("#clueBar i");
      this.feedback = "";
      this.feedbackT = 0;
      this.waiting = false;
      this.gridSeed = Math.random() * 100;
      this.allMadre = true; // true mientras TODAS las respuestas sean "Tu madre"
    }

    async start() {
      await BB.dialog.say(
        ["...", "Te dije que no te fueras sin acabarme.", "Cada pista es un golpe. Responde o sufre.", "Escribe la palabra y pulsa Enter."],
        "CRUCIGRAMA"
      );
      this.next();
    }

    next() {
      if (this.pool.length === 0) this.pool = CLUES.slice().sort(() => Math.random() - 0.5);
      this.current = this.pool.pop();
      this.timer = TIME;
      if (this.clueText) this.clueText.textContent = this.current.clue;
      this.showInput(true);
    }

    showInput(on) {
      if (!this.input) return;
      this.input.hidden = !on;
      this.input.value = "";
      if (on) {
        this.input.focus();
        this.input.onkeydown = (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            this.submit();
          }
          e.stopPropagation();
        };
      } else {
        this.input.onkeydown = null;
        this.input.blur();
      }
    }

    normalize(s) {
      return s
        .toUpperCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^A-Z]/g, "");
    }

    async submit() {
      if (!this.current || this.waiting || this.over) return;
      const guess = this.normalize(this.input.value);
      if (!guess) return;
      this.waiting = true;
      this.showInput(false);
      if (guess === "TUMADRE") {
        this.feedback = "¡Es muy efectivo!";
        this.feedbackT = 1.2;
        BB.flash(C.white, 0.15);
        this.hitBoss(3, "¡Es muy efectivo!"); // "Tu madre" pega mas que una respuesta normal
      } else if (guess === this.current.answer) {
        this.allMadre = false;
        this.solved.push(this.current.answer);
        this.feedback = "¡" + this.current.answer + "!";
        this.feedbackT = 1.2;
        BB.flash(C.white, 0.15);
        this.hitBoss(1, "casilla rellena");
      } else {
        this.allMadre = false;
        this.feedback = "Era " + this.current.answer;
        this.feedbackT = 1.6;
        this.hurt(15, "-15 casilla negra");
      }
      await BB.wait(1.3);
      this.waiting = false;
      if (!this.over) this.next();
    }

    async timeout() {
      if (this.waiting || this.over) return;
      // Al agotarse el tiempo se comprueba lo que hubiera escrito
      if (this.normalize(this.input.value)) {
        this.submit();
        return;
      }
      this.waiting = true;
      this.allMadre = false;
      this.showInput(false);
      this.feedback = "Tiempo. Era " + this.current.answer;
      this.feedbackT = 1.6;
      this.hurt(15, "-15 tiempo");
      await BB.wait(1.3);
      this.waiting = false;
      if (!this.over) this.next();
    }

    tick(dt) {
      if (this.feedbackT > 0) this.feedbackT -= dt;
      if (!this.current || this.waiting) return;
      this.timer -= dt;
      if (this.clueBar) this.clueBar.style.width = BB.clamp(this.timer / TIME, 0, 1) * 100 + "%";
      if (this.timer < 5 && Math.floor(this.timer * 2) !== Math.floor((this.timer + dt) * 2)) BB.sfx.tick();
      if (this.timer <= 0) this.timeout();
      // En móvil el teclado puede quitar el foco al input: lo recuperamos al tocar
      if (BB.input.pointer.justDown && this.input && !this.input.hidden) this.input.focus();
    }

    async finish(win) {
      if (win && this.allMadre) BB.state.flags.tuMadre = true; // final secreto
      this.showInput(false);
      super.finish(win);
    }

    render() {
      // Fondo: rejilla de crucigrama infinita
      BB.rect(0, 0, W, H, C.silver);
      const cell = 12;
      for (let y = 0; y < H; y += cell) {
        for (let x = 0; x < W; x += cell) {
          const k = Math.sin(x * 12.9898 + y * 78.233 + this.gridSeed) * 43758.5453;
          const black = k - Math.floor(k) < 0.28;
          BB.rect(x, y, cell, cell, black ? C.black : C.white);
          BB.rect(x, y, cell, 1, C.lgray);
          BB.rect(x, y, 1, cell, C.lgray);
        }
      }
      // Palabras resueltas se "escriben" en la rejilla
      this.solved.forEach((w, i) => {
        const y = 40 + i * 14;
        for (let j = 0; j < w.length; j++) {
          BB.rect(20 + j * 12, y, 12, 12, C.yellow);
          BB.rect(20 + j * 12, y, 12, 1, C.black);
          BB.rect(20 + j * 12, y, 1, 12, C.black);
          BB.text(w[j], 26 + j * 12, y + 2, { size: 7, align: "center" });
        }
      });
      // Ojos del crucigrama
      const blink = Math.floor(this.t * 0.7) % 7 === 0 ? 1 : 5;
      BB.rect(W / 2 - 40, 44, 14, blink, C.red);
      BB.rect(W / 2 + 26, 44, 14, blink, C.red);

      if (this.current && !BB.dialog.active) {
        BB.frame(20, 92, W - 40, 50);
        BB.text("PISTA", 28, 97, { size: 6, color: C.darkred });
        BB.wrap(this.current.clue, W - 60, 7).forEach((l, i) => BB.text(l, 28, 108 + i * 10, { size: 7 }));
        // Temporizador
        const pct = BB.clamp(this.timer / TIME, 0, 1);
        BB.rect(28, 133, W - 56, 4, C.lgray);
        BB.rect(28, 133, (W - 56) * pct, 4, pct > 0.3 ? C.green : C.red);
        if (this.waiting && this.feedbackT > 0) {
          BB.frame(W / 2 - 130, 146, 260, 16);
          BB.text(this.feedback, W / 2, 150, { size: 8, align: "center", color: C.black });
        } else if (!this.waiting) {
          BB.frame(W / 2 - 130, 146, 260, 16);
          BB.text("escribe la palabra y pulsa Enter", W / 2, 150, { size: 7, align: "center", color: C.dark });
        }
      }
      BB.sprite("pumpkin-56", 20, H - 4, { anchor: "bottom", scale: 0.5 });
    }
  }

  BB.bosses = BB.bosses || {};
  BB.bosses.crucigrama = {
    id: "crucigrama",
    title: "???",
    subtitle: "nunca debiste negarte",
    hidden: true,
    intro: ["Corres hacia el Mafioso. La calle se dobla.", "Las baldosas se vuelven blancas y negras. Cuadradas. Numeradas."],
    // Con el final secreto (todo "Tu madre") el crucigrama reacciona distinto.
    get win() {
      if (BB.state.flags.tuMadre) {
        return ["Imposible... ¿¡cómo conoces las palabras de la lengua antigua!? Tú ganas... ¡Un gritón de puntos para Gryffindor!"];
      }
      return ["El crucigrama se queda sin casillas.", "Se rinde. 'Vale. Aprobado de verdad. 10 puntos para Gryffindor.'"];
    },
    lose: ["Quedas perdido en el tiempo y el espacio. Tu Bianca se la comen otros."],
    make: () => new CrucigramaScene(),
  };
})();
