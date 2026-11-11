# Nobody’s Home — browser game

A browser-native 3D kitten game set in an older North Kolkata neighbourhood. The main page now opens a free-roam neighbourhood: no hunger, enemies or story gates. The previous story prototype remains available at `story.html`, with its own existing save. The Unity project remains a separate backup.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000 in a browser. The game uses the vendored Three.js files and the kitten asset in `dist/`; no build or npm install is required to run it. Press Play to start rendering. The renderer is capped at 24 FPS, at most 850,000 pixels in free roam, and pauses when the tab loses focus. Static shadows update only after moving into another part of the neighbourhood. These limits reduce laptop load. Avoid prolonged playtests on a hot laptop.

## Controls

Free roam starts in the lane outside home. WASD moves, Shift runs, Space jumps, moving the mouse looks around, and scrolling or +/− zooms. Click Explore/Continue to capture the mouse; Escape releases it and pauses. Browsers that deny mouse capture fall back to ordinary mouse movement without holding a button. Tab opens the map. E climbs through the bedroom window when reachable (otherwise rests), M meows, and R returns to the last clear spot. Pause also offers a return to the home lane and afternoon/evening lighting.

Exploration uses `nobodys-home-kolkata-explore-v1`, separate from the story save. The original story still starts in the bedroom, with food, radio and a window exit. It uses the same improved mouse-look and camera boom.

## Neighbourhood

Claude’s original six houses, furnished home, Ambassador taxi and four shops are imported with a uniform 0.75 metre conversion, including their original materials and details. The market contains the tea stall, paan kiosk, grocery and sweet shop. Main and back lanes, side passages and courtyards form connected routes.

Seven additional houses, including three shopfronts, are generated from a stable seed. Rules vary floor count, bays, paint, weathering, shutters, balconies and rooftop tanks while preserving door/window scale. Instancing keeps repeated details inexpensive. Trees, paving, drainage, wires, planters and small street details are also assembled procedurally. Do not randomize the seed on load or distort the original authored assets.

The camera keeps user yaw independent of obstacle avoidance, checks a camera-sized volume, lifts in cramped areas and eases back out. Where no physical camera view fits, only the actual blocking render object briefly fades. Circular horizontal player collision, short movement substeps and headroom checks avoid snagging corners or stepping into ceilings.

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
node tests/explore.test.mjs
node tests/follow-camera.test.mjs
node tests/mouse-look.test.mjs
node tests/procedural.test.mjs
```

## Project map

- `dist/index.html`, `dist/explore.css`, `dist/explore.js`: free-roam game and interface.
- `dist/explore-layout.mjs`, `dist/explore-movement.mjs`: world layout, indexed collision and player movement.
- `dist/neighbourhood.mjs`: authored asset placement, surfaces and street details.
- `dist/procedural-buildings.mjs`, `dist/procedural-view.mjs`: deterministic architectural generation and instanced rendering.
- `dist/mouse-look.mjs`, `dist/follow-camera.mjs`: shared mouse capture and collision-aware camera.
- `dist/story.html`, `dist/style.css`: preserved story shell and interface.
- `dist/game.js`: 3D world, player, camera, interactions and threats.
- `dist/threats.mjs`: dog and infected detection and reactions.
- `dist/camera.mjs`: camera obstacle checks.
- `dist/physics.mjs`: vertical movement.
- `dist/home.mjs`, `dist/home-data.mjs`: collision pieces from the actual furnished home, window traversal and save migration.
- `dist/story.mjs`: persistent survival state and story progression.
- `dist/assets/kitten.glb`: the approved kitten model, texture, rig and animations.
- `dist/assets/kolkata-houses.glb`: six lane houses from Claude's `kolkata-buildings.blend`, with original proportions and spacing. Procedural weathering and plaster relief are baked into six 1024px colour atlases and six 512px normal atlases. The row uses one uniform 0.75 scale and static building shadows. `tools/export_kolkata_buildings.py` reproduces the export on one CPU thread without modifying the source file.
- `dist/assets/hero-home.glb`: Claude’s complete furnished home, including the original interior objects, upper floor and back yard. The existing front door leaves are posed closed, the bedroom shutters posed open; rooms and furniture are preserved. `tools/export_hero_home.py` bakes procedural materials on one CPU thread and derives collision pieces from the source geometry.
- `dist/assets/kolkata-street.glb`, `dist/street-data.mjs`, `dist/house-collisions.mjs`: original taxi/shops and source-derived collision parts. `tools/export_street_assets.py` and `tools/export_house_collisions.py` reproduce them without saving the source `.blend`. Export with one CPU thread.
- `tests/`: lightweight checks, including route connectivity, real geometry camera angles, headroom, mouse look and generated building validity.

This is a prototype, not a completed game or a photoreal city scan. The authored home can be entered; other houses remain exterior façades. Free roam has no moving traffic or pedestrians. Dog and infected visuals are placeholders. The authored home has been checked for bedroom/hall movement, breakfast and a window roundtrip. The overall story still needs an extended end-to-end playtest. Time-of-day changes without day-number countdown screens; television and other optional story interactions must not gate exploration. Keep the user's low-power and no-Unreal/Unity-launch preferences in mind.

The public playable game is published automatically by GitHub Pages whenever changes in `dist/` are pushed to `main`: https://antara-paul04.github.io/nobodys-home-browser/. After completing a requested change, run the lightweight checks, commit only the intended changes, and push `main` to `github` so the game updates. Allow a few minutes for deployment. The older private Site remains a separate backup; do not change its visibility or settings.
