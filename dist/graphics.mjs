// Cap rendered pixels as well as Retina scale so a large window cannot
// accidentally turn a modest quality setting into a full-resolution 4K render.
const modes = {
  balanced: { scale: 1.5, pixels: 2400000 },
  sharper: { scale: 2, pixels: 5000000 },
  cooler: { scale: 1, pixels: 850000 },
};
const SAVE = 'nobodys-home-graphics-v1';
const modeOrDefault = value => Object.hasOwn(modes, value) ? value : 'balanced';

export function readGraphicsMode(storage) {
  try { return modeOrDefault(storage.getItem(SAVE)); } catch { return 'balanced'; }
}

export function saveGraphicsMode(storage, value) {
  const mode = modeOrDefault(value);
  try { storage.setItem(SAVE, mode); } catch { /* Playing still works without storage. */ }
  return mode;
}

export function renderPixelRatio(width, height, deviceRatio, mode) {
  const quality = modes[modeOrDefault(mode)];
  const positive = value => Number.isFinite(value) && value > 0 ? value : 1;
  return Math.min(positive(deviceRatio), quality.scale,
    Math.sqrt(quality.pixels / (positive(width) * positive(height))));
}
