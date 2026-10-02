# The Bianca Game (web)

Aventura de texto migrada desde el proyecto original de Unity a HTML/CSS/JS puro,
sin dependencias ni paso de build.

## Jugar en local

Abrir `index.html` directamente en el navegador, o servir la carpeta:

```
npx serve game
```

## Estructura

| Archivo | Qué hace |
| --- | --- |
| `index.html` | Marcado: fondo, caja de texto, opciones, pantallas de título y final. |
| `style.css` | Estilos. Responsive, funciona en móvil. |
| `story.js` | El guion completo como árbol de nodos. Es lo único que hay que tocar para cambiar textos, imágenes u opciones. |
| `game.js` | Motor: avanza por el árbol, muestra opciones, cambia fondo y música. |
| `assets/img/` | Imágenes del juego original. |
| `assets/audio/` | Música, convertida de WAV a MP3 (de 14 MB a 0,7 MB). |

## Editar el guion

Cada nodo de `story.js` es `{ text, img?, end?, options? }`:

- `text`: lo que se muestra. Las URLs se convierten en enlaces automáticamente.
- `img`: cambia la imagen de fondo a partir de ese nodo (ver `IMG`).
- `end: true`: final de partida. El siguiente clic muestra "Volver a empezar".
- `options`: lista de `{ text, music?, block }`. Al elegir una opción se entra en su
  `block` (lista de nodos). Cuando el bloque termina se vuelve al nodo padre y a sus
  opciones. Un `block: []` vuelve directamente.

## Controles

- Clic, toque, Espacio o Enter: siguiente texto.
- Teclas 1-4 o clic en el botón: elegir opción.
- Botón de altavoz arriba a la derecha: silenciar.
