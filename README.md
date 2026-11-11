# Nobody’s Home — browser game

A work-in-progress browser-native 3D cat survival game set in an older North Kolkata neighbourhood. The Unity project is a separate reference and backup; this repository is the browser version.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000 in a browser. The game uses the vendored Three.js files and the kitten asset in `dist/`; no build or npm install is required to run it. Press Play to start rendering. The renderer is capped at 24 FPS and the game pauses when the tab loses focus, to reduce laptop load. Avoid prolonged playtests on a hot laptop.

## Controls

The kitten starts in the authored bedroom. Food and water are in the inner hall; the old radio replaces the placeholder television. Jump onto the bed beside the open bedroom window and press E to climb through; E also brings the kitten back in.

WASD move; Shift run; Space jump; E interact; M meow; H hide near the bed; drag to orbit; scroll or the +/− controls to zoom; Escape pauses. Progress is stored in browser local storage.

## Checks

```sh
node tests/threats.test.mjs
node tests/camera.test.mjs
node tests/physics.test.mjs
node tests/world.test.cjs
node tests/story.test.mjs
node tests/window.test.mjs
node tests/integration.test.mjs
node tests/buildings.test.mjs
node tests/home.test.mjs
node tests/kitten-scale.test.mjs
```

## Project map

- `dist/index.html`, `dist/style.css`: game shell and interface.
- `dist/game.js`: 3D world, player, camera, interactions and threats.
- `dist/threats.mjs`: dog and infected detection and reactions.
- `dist/camera.mjs`: camera obstacle checks.
- `dist/physics.mjs`: vertical movement.
- `dist/home.mjs`, `dist/home-data.mjs`: collision pieces from the actual furnished home, window traversal and save migration.
- `dist/story.mjs`: persistent survival state and story progression.
- `dist/assets/kitten.glb`: the approved kitten model, texture, rig and animations.
- `dist/assets/kolkata-houses.glb`: six lane houses from Claude's `kolkata-buildings.blend`, with original proportions and spacing. Procedural weathering and plaster relief are baked into six 1024px colour atlases and six 512px normal atlases. The row uses one uniform 0.75 scale and static building shadows. `tools/export_kolkata_buildings.py` reproduces the export on one CPU thread without modifying the source file.
- `dist/assets/hero-home.glb`: Claude’s complete furnished home, including the original interior objects, upper floor and back yard. The existing front door leaves are posed closed, the bedroom shutters posed open; rooms and furniture are preserved. `tools/export_hero_home.py` bakes procedural materials on one CPU thread and derives collision pieces from the source geometry.
- `tests/`: lightweight checks.

This is a prototype, not a completed game. Dog and infected visuals are placeholders. The authored home has been checked for bedroom/hall movement, breakfast and a window roundtrip. The overall story still needs an extended end-to-end playtest. Time-of-day changes without day-number countdown screens; television and other optional story interactions must not gate exploration. Keep the user's low-power and no-Unreal/Unity-launch preferences in mind.

The public playable game is published automatically by GitHub Pages whenever changes in `dist/` are pushed to `main`: https://antara-paul04.github.io/nobodys-home-browser/. After completing a requested change, run the lightweight checks, commit only the intended changes, and push `main` to `github` so the game updates. Allow a few minutes for deployment. The older private Site remains a separate backup; do not change its visibility or settings.
