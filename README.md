# Nobody’s Home — browser game

A browser-native 3D kitten game set in an older North Kolkata neighbourhood. The main page now opens a free-roam para of narrow lanes: no hunger, enemies or story gates. The previous story prototype remains available at `story.html`, with its own existing save. The Unity project remains a separate backup.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000 --directory dist
```

Open http://localhost:8000 in a browser. The game uses the vendored Three.js files and the kitten asset in `dist/`; no build or npm install is required to run it. Press Play to start rendering. The renderer is capped at 24 FPS and pauses when the tab loses focus. Edge smoothing is enabled. Pause → Graphics offers Balanced (default: up to 1.5× display scale / 2.4 million pixels), Sharper (up to 2× / 5 million pixels; more GPU power) and Cooler (up to 1× / 850,000 pixels). Render scale never exceeds the device pixel ratio. This preference is shared between free roam and story, separately from both gameplay saves. Static shadows update only after moving into another part of the neighbourhood. These limits reduce laptop load. Avoid prolonged playtests on a hot laptop.

## Controls

Free roam starts in the gali outside home. The kitten walks at 0.55 units a second and runs at 1.45, easing in and out of motion; `dist/kitten-gait.mjs` lengthens the authored stride and plays the legs at the rate that matches the ground actually covered, so the paws do not slide. The story prototype (`story.html`) uses the same gait and pace; its dog and infected are slowed in proportion and their warning and give-up times stretched to match (`PACE` in `dist/threats.mjs`), so the kitten can still walk away from the infected and must run from the dog. `story.html?inspect` exposes `window.__story.state` for checking it. WASD moves, Shift runs, Space jumps, moving the mouse looks around, and scrolling or +/− zooms. Click Explore/Continue to capture the mouse; Escape releases it and pauses. Browsers that deny mouse capture fall back to ordinary mouse movement without holding a button. Tab opens the map. E climbs through the bedroom window when reachable (otherwise rests), M meows, and R returns to the last clear spot. Pause also offers a return to the home lane and afternoon/evening lighting.

Exploration uses `nobodys-home-kolkata-explore-v2`, separate from the story save. The original story still starts in the bedroom, with food, radio and a window exit. It uses the same improved mouse-look and camera boom.

## Neighbourhood

Free roam is a North Kolkata para of narrow lanes, laid out in `dist/explore-layout.mjs`. One unit is 1.33 m; everything authored is scaled 0.75 to match the kitten.

- **Lanes.** Kali Mitra Lane (3.4 units wide, a parked taxi leaves a squeeze), the home gali, the back lane, a service lane behind the houses, five connecting galis 1.1–1.5 units wide, a drain alley, and slits between houses that only a cat fits through. A chowk holds the banyan shrine and tea stall; a walled plot holds the pond and tube well; a courtyard sits behind a gateway. The east edge opens onto the big road: tram line, buses, blue-and-white railings.
- **Houses.** Claude’s six authored houses appear once each, in their original order, on the north side of the main lane; the furnished home fronts the home gali. Fifty-one more houses come from `dist/procedural-buildings.mjs`: old townhouses with rowaks, arched openings, louvred shutters and iron balconies; 1970s flats with grille boxes and jali stair shafts; bare-brick new builds; tin sheds; shop-houses with Bengali signboards. Each lot has a fixed seed, so no house repeats and nothing changes between visits. Party walls are bare brick or cement; walls facing a lane get windows, pipes and meters.
- **Wear.** Plaster, brick and cement share world-space weathering shaders (`dist/procedural-view.mjs`): rising damp, streaks, plaster peeled back to brick. `dist/decals.mjs` draws one atlas of signs, posters, wall writing, paan stains, moss, drain grime and potholes.
- **Clutter.** `dist/street-clutter.mjs` places open drains with slabs, garbage heaps with crows, cycles, drums, crates, washing lines, bunting, poles and the overhead wire tangle, chalk hopscotch, alpona, a cricket wicket on a wall. Anything worth bumping into has a collision box.
- **Trees.** `dist/trees.mjs` grows banyan, peepal, krishnachura, radhachura, neem, mango, jackfruit, kadam, coconut, betel-nut, banana and bamboo from seeds, plus peepal saplings rooted in walls. About forty stand in yards, at lane corners, on the footpath in blue-and-white guards, and as palms behind the roofs.
- **Blue and white.** Railings run along the footpath, round the pond (open at the ghat) and in front of the red block; lamp posts, trident lamps, bollards, tram poles and the painted kerb use the same city colours.
- **Props.** `dist/assets/kolkata-props.glb` holds the Ambassador taxi, hand-pulled rickshaw, cycle van, auto, minibus, bus, tram, tube well, phuchka stall, fruit cart, bins, bus shelter and lamps, plus the shrine tree and the long red British-era block that faces the para across the tram road, exported flat-coloured by `tools/export_kolkata_props.py`. The four authored shops still come from `kolkata-street.glb`.

Everything generated is instanced and grouped into large chunks; a typical view is 150–350 draw calls. Do not randomize seeds on load or distort the authored assets. Add `?inspect` to the URL for a frame readout and `window.__explore.look(x, z, yaw, pitch, distance)` to frame a still.

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
node tests/graphics.test.mjs
node tests/gait.test.mjs
```

## Project map

- `dist/index.html`, `dist/explore.css`, `dist/explore.js`: free-roam game and interface.
- `dist/explore-layout.mjs`, `dist/explore-movement.mjs`: lanes, building rows, prop placement, indexed collision and player movement.
- `dist/neighbourhood.mjs`: assembles paving, generated houses, clutter, wires, the pond, the big road and the authored models.
- `dist/procedural-buildings.mjs`, `dist/procedural-view.mjs`: deterministic house generation; instanced rendering kit with weathered materials.
- `dist/street-clutter.mjs`, `dist/trees.mjs`, `dist/decals.mjs`: lane dressing, seeded trees, and the sign/stain atlas.
- `dist/assets/kolkata-props.glb`, `dist/props-data.mjs`: exported vehicles and street furniture with their bounds (`tools/export_kolkata_props.py`).
- `dist/graphics.mjs`: shared render scale limits and saved graphics preference.
- `dist/mouse-look.mjs`, `dist/follow-camera.mjs`: shared mouse capture and collision-aware camera.
- `dist/kitten-gait.mjs`: stride lengthening and leg-speed matching for free roam.
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
