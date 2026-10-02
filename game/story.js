// Guion de "The Bianca Game", migrado 1:1 desde la escena de Unity (SampleScene.unity).
//
// Formato:
//   nodo   = { text, img?, end?, options? }
//   opción = { text, music?, block: [nodos] }
//
// - El jugador avanza nodo a nodo con un clic. Si el nodo tiene `options`, se muestran
//   los botones. Al elegir una opción se entra en su `block`; cuando el bloque se agota
//   se vuelve al nodo padre (y a sus opciones). Un bloque vacío vuelve directamente.
// - `img` cambia la imagen de fondo a partir de ese nodo.
// - `end: true` marca un final: el siguiente clic muestra la pantalla de "volver a empezar".
// - `music` cambia la música de fondo al elegir esa opción.

const IMG = {
  whiteLion: "assets/img/white-lion.png",
  pumpkinCowboy: "assets/img/pumpkin-cowboy.jpg",
  soul: "assets/img/soul.jpg",
  radahn: "assets/img/radahn.jpg",
  trascending: "assets/img/trascending.jpg",
  pokemon: "assets/img/pokemon.gif",
  fallout: "assets/img/fallout.jpg",
};

const MUSIC = {
  pizzaTune: "assets/audio/pizza-tune.mp3",
  pumpkinCowboy: "assets/audio/pumpkin-cowboy.mp3",
};

const STORY = {
  title: "Belf, Elena & Marcos presentan...",
  startImage: IMG.whiteLion,
  startMusic: MUSIC.pizzaTune,
  nodes: [
    {
      text: "Te apetece Mafioso, qué pizza eliges?",
      options: [
        {
          text: "Bianca, obviamente",
          block: [
            { text: "\"Vale, la tendrás a las 22:30.\" Pues toca esperar." },
            {
              text: "A ver en que puedo matar el tiempo...",
              options: [
                {
                  text: "Mirar youtube un rato mientras enfundo cartas",
                  music: MUSIC.pumpkinCowboy,
                  block: [
                    { text: "pumpkin cowboy: https://youtu.be/4iTAkRHGbuM?feature=shared", img: IMG.pumpkinCowboy },
                    {
                      text: "That was nice, solo han pasado 5:10 minutos puedo...",
                      options: [
                        {
                          text: "Repetir la canción. Pumpkin cowboooooy!",
                          music: MUSIC.pumpkinCowboy,
                          block: [
                            { text: "Pumpkin cowboy..." },
                            { text: "Pumpkin cowboooooy!" },
                            { text: "PUMPKIN COWBOOOOOOY!!!" },
                            { text: "Ending: PUMPKIN COW... Ostia puta, son las 6 de la mañana. Ya han cerrado la pizzeria. Game over.", end: true },
                          ],
                        },
                        { text: "Hacer otra cosa", block: [] },
                      ],
                    },
                  ],
                },
                {
                  text: "Jugar con Soul",
                  block: [
                    {
                      text: "Localizas a Soul. Está jugando con un enchufe. Rápido! Que haces?",
                      img: IMG.soul,
                      options: [
                        {
                          text: "Nada, selección natural.",
                          block: [
                            { text: "Ending: Game over. Soul acaba frito. Ya no te apetece una Bianca, ahora te apetece una Barbacoa...", end: true },
                          ],
                        },
                        {
                          text: "SOOOOUL!!! Va, vamos a jugar!",
                          block: [
                            { text: "Juegas con Soul un rato. Se pone un poco violento pero solo te hace un rasguño." },
                            { text: "Todavía son las 20:45, bueno va, voy a jugar un poco más" },
                            { text: "Has perdido un cacho de oreja. Son las 22.10." },
                            { text: "Decides ir a por la pizza" },
                            { text: "Ending: Cuando llegas al mafioso, te miran horrorizados la oreja sangrante. Consigues tu bianca y una coca cola (zero) extra de regalo !", end: true },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  text: "Jugar al Elden Ring un rato. Me queda nada para pasármelo otra vez.",
                  block: [
                    {
                      text: "Qué build quieres usar?",
                      img: IMG.radahn,
                      options: [
                        {
                          text: "Usar build de confianza: escudo con pincho",
                          block: [
                            { text: "You died. Volver a intentar" },
                            { text: "You died. Volver a intentar otra vez" },
                            { text: "You died. Volver a intentar una vez mas" },
                            { text: "You died. Volver a intentar y otra" },
                            { text: "You died. Volver a intentar otra mas..." },
                            { text: "You died. Volver a intentar, no hay manera..." },
                            { text: "You died. Volver a intentar, hay que conseguirlo" },
                            { text: "You died. Volver a intentar, volver a empezar..." },
                            { text: "You died. Volver a intentar, joder tio..." },
                            { text: "You died. Volver a intentar, he muerto en primera fase..." },
                            { text: "Enemy defeated." },
                            { text: "Oh no! Son las 22:45!" },
                            { text: "Correr al Mafioso!!!" },
                            { text: "Ending: Llegas al Mafioso y como ven tu cara de agobio, deciden regalarte un tiramisú extra. Enhorabuena consigues tu Bianca a tiempo!", end: true },
                          ],
                        },
                        {
                          text: "Usar build de pata de carnero",
                          block: [
                            { text: "You died. Volver a intentar" },
                            { text: "You died. Volver a intentar, fase 1 hecha" },
                            { text: "You died. Volver a intentar, joder con los rayos" },
                            { text: "You died. Volver a intentar, ese enganche..." },
                            { text: "You died. Volver a intentar, 10%..." },
                            { text: "Enemy defeated." },
                            { text: "Son las 22:20, perfecto!" },
                            { text: "Ending: Te dirijes al Mafioso y llegas a tiempo. YAY! Consigues tu Bianca.", end: true },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  text: "No hacer nada, mirar a la pared esperando que pasen los segundos.",
                  block: [
                    { text: "Esperas" },
                    { text: "Esperas..." },
                    { text: "Sigues esperando" },
                    { text: "Sigues esperando..." },
                    { text: "Sigues esperando...." },
                    { text: "Sigues esperando....." },
                    { text: "Sigues esperando......" },
                    { text: "Sigues esperando......." },
                    { text: "Sigues esperando........" },
                    { text: "Sigues esperando........." },
                    { text: "Sigues esperando.........." },
                    { text: "Sigues esperando...........", img: IMG.trascending },
                    { text: "Ending: Tras meditar un buen rato tu ser abandona la materialidad, mientras levitas, ponderas la necesidad de Bianca. Ya no te hace falta.", end: true },
                  ],
                },
              ],
            },
          ],
        },
        {
          text: "Bianca, estamos tontos?",
          block: [
            { text: "\"Vale, la tendrás a las 22:45.\" Joder pues habrá que esperar..." },
            { text: "Tengo mucho rato antes y no queda ni agua ni coca-cola (zero) en casa. Voy al Masymas a comprar." },
            { text: "Sales de casa.", img: IMG.soul },
            { text: "Soul decide que es hora de iniciar una aventura." },
            { text: "LEROOOOOOY JENKINSSSSSS!" },
            { text: "Soul sale disparado y se escapa fuera de casa." },
            {
              text: "Que he desayunado hoy?",
              options: [
                {
                  text: "Nada, desayunar es de cobardes.",
                  block: [
                    { text: "Soul se dirige a la derecha." },
                    { text: "Por suerte la puerta está cerrada." },
                    { text: "Consigues atrapar a Soul y meterlo en casa." },
                    { text: "Sales de casa y te diriges al Masymas." },
                    { text: "Te encuentras con una cucaracha en el parque...", img: IMG.pokemon },
                    { text: "Toca pelear!" },
                    { text: "Será un... Duelo a muerte con cuchillos" },
                    { text: "Duelo a muerte con cuchillos???" },
                    { text: "Duelo a muerte con cuchillos?" },
                    { text: "Qué es lo que piensan hacer???" },
                    { text: "He estado en peleas con otras pandillas pero nunca habia visto o escuchado algo así. Nunca!" },
                    { text: "Yo creo que van a pelear con cuchillos." },
                    { text: "..." },
                    { text: "La cucaracha no puede con tanta tensión y decide huir." },
                    { text: "Consigues ir al Masymas y comprar de forma segura." },
                    { text: "A partir de este momento las cucarachas del parque te guardan respeto." },
                    { text: "..." },
                    { text: "Se hacen las 22:18. Decides salir al Mafioso." },
                    { text: "Te encuentras unas cucarachas por el camino. Te escoltan hasta que llegas." },
                    {
                      text: "Puedes...",
                      options: [
                        {
                          text: "Dar una patata a las cucarachas",
                          block: [
                            { text: "Ending: Consigues la Bianca y una bonita amistad con las cucarachas. A los pocos días recibes una invitación a una boda cucarachil.", end: true },
                          ],
                        },
                        {
                          text: "Ignorar a las cucarachas",
                          block: [
                            { text: "Ending: Consigues la Bianca. Ahora cuando caminas por el parque y es de noche, notas unas miradas clavadas en ti.", end: true },
                          ],
                        },
                      ],
                    },
                  ],
                },
                {
                  text: "Colacao, el desayuno de los campeones.",
                  block: [
                    { text: "Soul se dirige a la izquierda." },
                    { text: "Suddenly.... KIRAAAAAAA" },
                    { text: "Kira aparece en la escena. Eres transportado al mundo del Fallout", img: IMG.fallout },
                    { text: "Bienvenido al mundo de Fallout, si quieres volver, deberás cumplir con una misión." },
                    { text: "Debes completar este crucigrama!!! https://www.theguardian.com/crosswords/quick/16983" },
                    { text: "He acabado el crucigrama!" },
                    { text: "\"Mentira, pero va, aprobado. Puedes volver a clase. 10 puntos para Gryffindor.\"" },
                    { text: "Aparece el Masymas." },
                    {
                      text: "Quieres entrar?",
                      options: [
                        {
                          text: "Si",
                          block: [
                            { text: "El Masymas no existe, es un espejismo de la sociedad capitalista." },
                            { text: "Ending: Vuelves a casa. Son las 00:08. Llegas tarde, el Mafioso ha cerrado y te quedas sin Bianca.", end: true },
                          ],
                        },
                        {
                          text: "No",
                          block: [
                            { text: "Tu casa se materializa." },
                            { text: "Mejor pasar del Masymas." },
                            { text: "Llegas al Mafioso." },
                            { text: "Hay cola." },
                            { text: "Tras 15 minutos consigues tu Bianca." },
                            { text: "Ending: Felicidades! Has conseguido la Bianca!", end: true },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
