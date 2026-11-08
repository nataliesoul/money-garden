const fs = require('fs');
const path = require('path');
const ENGINE = 'C:/Users/natas/.claude/plugins/cache/ls-extensions/ls-clad/1.0.0/skills/build-sfx/tools';
const audio = require(ENGINE);
const PROJECT_ASSETS_SFX = 'E:/Dev/SPECS/Learn_AR_with_Specs/Assets/GeneratedSFX';
fs.mkdirSync(PROJECT_ASSETS_SFX, { recursive: true });
const p = audio.sfx_presets;
const SR = audio.SAMPLE_RATE;

function write(name, buf) {
  audio.mix_bus.masterChain(buf, { normalize: 'peak' });
  audio.WavBuilder.write(buf, path.join(PROJECT_ASSETS_SFX, name + '.wav'));
  console.log('wrote', name);
}
function mono(b) { return b.left ? audio.mix([b.left, b.right], [0.5, 0.5]) : b; }
function layer(parts, len) {
  const out = new Float32Array(Math.floor(len * SR));
  for (const [buf, at, gain] of parts) audio.addInto(out, mono(buf), Math.floor(at * SR), gain);
  return out;
}

// UI click: soft physical click
write('Click', p.uiClick({ character: 'soft' }));
// Hover: airy focus cue
write('Hover', p.uiHover({}));
// Coin: bright coin clink, non-retro, plus a tiny metal tick
{
  const c = p.coin({ retro: false });
  const tick = audio.transient_designer.designImpact({
    attack: { kind: 'click', durationMs: 4, lpHz: 9000, hpHz: 2000, gain: 0.5 },
    body: { kind: 'tonal', freq: 2100, partials: 4, decay: 0.22, hpHz: 900, lpHz: 9000, gain: 0.45 },
  });
  write('Coin', audio.mix_bus.applyFx(layer([[c, 0, 0.8], [tick, 0, 0.6]], 0.6), { hpf: 300, reverb: 'smallRoom', gain: 0.9 }));
}
// Flow: cascading coins / waterfall whoosh falling downward
{
  const w = p.whoosh({ duration: 1.4, size: 1.1, direction: 'down' });
  const rain = audio.granular.grainCloud({ source: 'white', duration: 1.3, grainSizeMs: 7, density: 160, pitchSpread: 8, filter: { type: 'bp', freq: 3200, Q: 1.2 }, panSpread: 0.5 });
  const out = layer([[w, 0, 0.8], [rain, 0.1, 0.35]], 1.6);
  audio.fadeOut(out, 0.2);
  write('Flow', audio.mix_bus.applyFx(out, { hpf: 180, reverb: 'mediumRoom', gain: 0.8 }));
}
// Correct: ascending success arpeggio
write('Correct', p.uiSuccess({}));
// Wrong: firm but soft error
write('Wrong', audio.mix_bus.applyFx(p.uiError({ pitch: -2 }), { lpf: 2600, gain: 0.7 }));
// GateOpen: metal latch + rising power-up
{
  const latch = p.impact({ material: 'metal', size: 0.8 });
  const up = p.powerUp({ retro: false });
  write('GateOpen', audio.mix_bus.applyFx(layer([[latch, 0, 0.8], [up, 0.08, 0.5]], 1.2), { hpf: 120, reverb: 'mediumRoom', gain: 0.85 }));
}
// GateClosed: heavy wooden thunk + short descending buzz
{
  const thunk = p.impact({ material: 'wood', size: 1.4 });
  const down = p.powerDown({ pitch: -5 });
  write('GateClosed', audio.mix_bus.applyFx(layer([[thunk, 0, 0.9], [down, 0.05, 0.35]], 1.0), { hpf: 80, lpf: 5000, gain: 0.85 }));
}
// Place: stone thud + sparkle confirmation
{
  const thud = p.impact({ material: 'stone', size: 1.2 });
  const sp = p.sparkle({ duration: 0.9 });
  write('Place', audio.mix_bus.applyFx(layer([[thud, 0, 0.9], [sp, 0.12, 0.45]], 1.3), { hpf: 70, reverb: 'mediumRoom', gain: 0.85 }));
}
// Surprise: notify bell + low dramatic thump
{
  const bell = p.uiNotify({});
  const thump = audio.transient_designer.designImpact({
    attack: { kind: 'click', durationMs: 8, lpHz: 3000, hpHz: 300, gain: 0.5 },
    body: { kind: 'thump', freq: 70, decay: 0.35, lpHz: 500, gain: 0.9, dist: 1.1 },
  });
  write('Surprise', audio.mix_bus.applyFx(layer([[thump, 0, 0.9], [bell, 0.1, 0.7]], 1.4), { hpf: 50, reverb: 'mediumRoom', gain: 0.85 }));
}
// Grow: magic chime for compound growth reveal
write('Grow', p.magicChime({}));
// Pop: bubble pop for chips / coin landing
write('Pop', p.uiPop({ pitch: 2 }));
