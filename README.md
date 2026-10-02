# regal_luis -- Landing page

Landing page telling Luis his present is on the way and inviting him to play
the game meanwhile. Dark Souls styling: warm near-black background, heavy
vignette, drifting embers, Roman-capital serif (Cinzel), and a gold accent
carried over from the game in `game/`.

(Note: this README stayed in UTF-16 encoding, so it uses plain ASCII. The
other files are UTF-8 and render accents correctly. The page copy itself is
in Spanish on purpose, for Luis.)

## Files

| File            | What it is                                                        |
| --------------- | ----------------------------------------------------------------- |
| `index.html`    | Main screen: "Regalo en proceso / mientras tanto..." + Empezar button. |
| `styles.css`    | Dark Souls styling (YOU DIED-style title, menu-selection button). |
| `src/main.ts`   | Ember particle canvas. TypeScript source.                         |
| `js/main.js`    | Compiled embers (the file the page loads).                        |
| `tsconfig.json` | TypeScript config.                                                |
| `game.html`     | Redirect to `game/index.html` (the real game).                    |
| `game/`         | The game (maintained by the other collaborator; lives on `main`). |

The **Empezar** button links to `game/index.html`, so the landing page and the
game sit side by side in the published site once the branches are merged.

## Development

Open `index.html` in a browser -- no server or build step needed.
If you edit the ember TypeScript, recompile:

    npx tsc        # uses tsconfig.json -> generates js/main.js

## Publishing (GitHub Pages)

All paths are relative: serve from the repo root
(Settings -> Pages -> branch and folder `/`).
