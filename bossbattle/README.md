# Pumpkin Cowboy: Boss Battle

Secuela de *The Bianca Game* (`../game/`). Pumpkin Cowboy se enfrenta, uno a uno, a los
villanos de la edición anterior en combates 2D de estilo Game Boy. Cada jefe es un
minijuego distinto. HTML, CSS y JavaScript puro, sin dependencias ni paso de build.

## Jugar

Abrir `index.html` en el navegador (doble clic vale), o servir la carpeta:

```
python -m http.server 8080 --directory bossbattle
```

Pensado para pantalla apaisada. Funciona con ratón, teclado y táctil.

## Los jefes (gauntlet lineal)

| Orden | Jefe | Minijuego |
| --- | --- | --- |
| 1 | **Soul**, el gato del enchufe | Toca a Soul antes de que llegue al enchufe. Si llega, chispazo. |
| 2 | **La cucaracha** del parque | Duelo a muerte con cuchillos: pulsa cuando el marcador esté en la zona verde. Al ganar, eliges si dar una patata (afecta al final). |
| 3 | **El Masymas**, espejismo capitalista | Coge agua y Coca-Cola (zero) con la cesta. Lo que parpadea no existe; la Coca-Cola con azúcar hace daño. |
| 4 | **Kira**, la border collie suelta | Esquiva sus embestidas por tres carriles en el yermo de Fallout. Después, una terminal te pide acabar un crucigrama. |
| 5 | **Radahn**, Consort of Miquella | Elige build (escudo con pincho o pata de carnero) y esquiva meteoritos, rayos y enganches. Cada muerte cuenta: a la décima (escudo) o quinta (carnero) el jefe cae igual, como en el original. |
| ? | **El Crucigrama** (oculto) | Solo si en la terminal de Kira eliges "Me niego a acabar esto". Sus ataques son pistas; escribe la palabra antes de que acabe el tiempo. Desbloquea el final verdadero. |

Vida compartida en todo el recorrido. Entre jefes recuperas 40 con una porción
imaginaria de Bianca. Al perder puedes reintentar el jefe con la vida llena.

## Controles

- Avanzar diálogo: clic, toque, Espacio o Enter.
- Opciones: flechas y Enter, o clic.
- Soul: clic/toque sobre el gato.
- Cucaracha: clic, toque o Espacio.
- Masymas: mover el puntero o flechas izquierda/derecha.
- Kira: flechas izquierda/derecha, o tocar a los lados de la pantalla.
- Radahn: arrastrar con el puntero, o flechas/WASD.
- Crucigrama: escribir en el campo de texto y Enter.
- `M` o el botón del altavoz: silenciar.

## Estructura

| Ruta | Qué hace |
| --- | --- |
| `index.html`, `style.css` | Lienzo de 384x216 escalado con píxeles nítidos, campo de texto del crucigrama, aviso de girar el móvil. |
| `js/engine.js` | Motor: bucle, entrada, carga de imágenes, texto con fuente pixel, sonidos sintetizados, música, sacudida y destello. |
| `js/ui.js` | Diálogo estilo Pokémon (máquina de escribir, elecciones), textos flotantes, estado del jugador y clase base `BossScene`. |
| `js/bosses/*.js` | Un archivo por jefe. Cada uno registra en `BB.bosses` su escena, textos de intro/victoria/derrota y, si aplica, una elección tras ganar. |
| `js/main.js` | Flujo: título, intro, jefes en orden, jefe oculto, final, créditos. Lista de assets. |
| `assets/sprites/` | Sprites. Los de foto (`pumpkin-*`, `soul-*`, `radahn-*`, `lion-*`) salen de `tools/pixelate.py`; el resto de `tools/draw_sprites.py`. |
| `assets/bg/` | Fondos de 192x108 pixelados desde las fotos originales. |
| `assets/audio/` | Música reutilizada del primer juego. |

## Regenerar los gráficos

Los sprites dibujados a mano son mapas ASCII en `tools/draw_sprites.py`. Para
cambiar uno, editar las letras (cada letra es un color de la paleta Endesga 32) y
ejecutar:

```
python tools/draw_sprites.py
```

Los sprites y fondos de foto se generan con `tools/pixelate.py`. El recorte de fondo
usa `rembg`, que descarga un modelo de unos 170 MB la primera vez:

```
uv run --with "rembg[cpu]" --with pillow python tools/pixelate.py
```

Las fotos de origen son las de `../game/assets/img/`.

## Añadir un jefe

1. Crear `js/bosses/nuevo.js` siguiendo cualquiera de los existentes: una clase que
   extiende `BB.BossScene` con `start()`, `tick(dt)` y `render()`, y un registro en
   `BB.bosses.nuevo` con `title`, `subtitle`, `intro`, `win`, `lose` y `make()`.
2. Añadir el script a `index.html` antes de `main.js`.
3. Añadir el id a `ORDER` en `js/main.js`.
