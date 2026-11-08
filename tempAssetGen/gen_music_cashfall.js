const path = require('path');
const fs = require('fs');
const ENGINE = 'C:/Users/natas/.claude/plugins/cache/ls-extensions/ls-clad/1.0.0/skills/build-music/tools';
const m = require(ENGINE);
const OUT = 'E:/Dev/SPECS/Learn_AR_with_Specs/Assets/GeneratedSFX';
fs.mkdirSync(OUT, { recursive: true });

// Calm, optimistic fintech bed: dreamy electric piano + soft pad + kalimba sparkle, light lofi pulse.
const genre = 'dreamy';
const { chords, meta } = m.composeChords({ genre, voice: 'electricPiano' });
const bpm = m.suggestTempo('lofi');
console.log('harmony', JSON.stringify(meta), 'bpm', bpm);
const BARS = 16;
const a = m.arrangement.arrangement16();

const epEv = m.chordEvents(chords, { voice: 'electricPiano', bars: BARS, velocity: 62, stagger: 0.12 });
const padEv = m.chordEvents(chords, { voice: 'pad', bars: BARS, velocity: 46 });
const keyMatch = meta.key.match(/^([A-Ga-g][#b]?)(-?\d+)$/);
const scaleRoot = keyMatch[1] + (parseInt(keyMatch[2]) + 1);
const arpEv = m.composeArpeggio({ chords, bars: BARS, style: 'up', notesPerBar: 8 });
const melodyEv = m.composeMelody({ chords, bars: BARS, notesPerBar: 4, octaveShift: 1, contour: 'arch', scale: meta.scale, scaleRoot, restProbability: 0.3 });
const bass = m.composeBass({ chords, genre: 'lofi', bars: BARS });
const drums = m.composeDrums({ genre: 'lofi', bars: BARS, energy: 0.35 });
console.log('drums', JSON.stringify(drums.meta));

const tracks = [
  m.track('ep', 'electricPiano', m.mask(epEv, a.full, BARS, 4), { fx: { hpf: 220, lpf: 3800, reverb: 'mediumRoom', gain: 0.42 }, humanize: { groove: 'swing', swingAmount: 0.12 } }),
  m.track('pad', 'pad', m.mask(padEv, a.full, BARS, 4), { fx: { hpf: 200, lpf: 2600, chorus: { voices: 3, mix: 0.3 }, reverb: 'largeHall', gain: 0.16 } }),
  m.track('arp', 'kalimba', m.mask(arpEv, a.a, BARS, 4), { fx: { hpf: 500, lpf: 6000, reverb: 'largeHall', gain: 0.22, pan: 0.25 } }),
  m.track('lead', 'musicBox', m.mask(melodyEv, a.b, BARS, 4), { fx: { hpf: 600, lpf: 7000, reverb: 'largeHall', gain: 0.2, pan: -0.2 } }),
  m.track('bass', 'subBass', m.mask(bass, a.a, BARS, 4), { fx: { lpf: 220, gain: 0.5 } }),
  ...drums.map(t => ({ ...t, fx: { ...(t.fx || {}), gain: ((t.fx && t.fx.gain) || 0.6) * 0.55 } })),
];
const out = m.render(tracks, { bpm, master: { normalize: 'peak', glue: true, width: 1.12 } });
m.WavBuilder.write(out, path.join(OUT, 'Ambient.wav'));
console.log('wrote Ambient');
