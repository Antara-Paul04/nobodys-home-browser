# Nobody’s Home — browser game

A work-in-progress browser-native 3D cat survival game set in an older North Kolkata neighbourhood. The Unity project is a separate reference and backup; this repository is the browser version.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000 in a browser. The game uses the vendored Three.js files and the kitten asset in `dist/`; no build or npm install is required to run it. Press Play to start rendering. The renderer is capped at 24 FPS and the game pauses when the tab loses focus, to reduce laptop load. Avoid prolonged playtests on a hot laptop.

## Controls

WASD move; Shift run; Space jump; E interact; M meow; H hide near the bed; drag to orbit; scroll or the +/− controls to zoom; Escape pauses. Progress is stored in browser local storage.

## Checks

```sh
node tests/physics.test.mjs
node tests/world.test.cjs
node tests/story.test.mjs
```

## Project map

- `dist/index.html`, `dist/style.css`: game shell and interface.
- `dist/game.js`: 3D world, player, camera, interactions and threats.
- `dist/physics.mjs`: furniture collisions, support surfaces and jump physics.
- `dist/story.mjs`: persistent survival state and story progression.
- `dist/assets/kitten.glb`: the approved kitten model, texture, rig and animations.
- `tests/`: lightweight checks.

This is a prototype, not a completed game. Dog and infected visuals are placeholders. Furniture jumping, camera collision, night encounters and the dark-house route still require end-to-end playtesting. Time-of-day changes without day-number countdown screens; television and other optional story interactions must not gate exploration. Keep the user's low-power and no-Unreal/Unity-launch preferences in mind.

The public playable game is published automatically by GitHub Pages whenever changes in `dist/` are pushed to `main`: https://antara-paul04.github.io/nobodys-home-browser/. After completing a requested change, run the lightweight checks, commit only the intended changes, and push `main` to `github` so the game updates. Allow a few minutes for deployment. The older private Site remains a separate backup; do not change its visibility or settings.
