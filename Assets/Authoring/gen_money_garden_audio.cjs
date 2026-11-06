const fs=require('fs'), path=require('path');
const root='C:/Users/natas/.codex/plugins/cache/ls-extensions/ls-clad/local/skills';
const a=require(root+'/build-sfx/tools');
const PROJECT_ASSETS_SFX='E:/Dev/SPECS/Learn_AR_with_Specs/Assets/GeneratedSFX';
fs.mkdirSync(PROJECT_ASSETS_SFX,{recursive:true});
for(const [name,buf] of [['Allocate',a.sfx_presets.waterDrop()],['Correct',a.sfx_presets.uiSuccess()],['Retry',a.sfx_presets.uiClick({character:'soft'})]]) {
  const out=a.mix_bus.applyFx(buf,{hpf:100,lpf:6500,gain:0.8});
  a.mix_bus.masterChain(out,{normalize:'peak'});
  a.WavBuilder.write(out,path.join(PROJECT_ASSETS_SFX,name+'.wav'));
}
const m=require(root+'/build-music/tools');
const {chords,meta}=m.composeChords({genre:'dreamy',voice:'vibraphone',key:'F3',scale:'major'});
const bpm=m.suggestTempo('ambient');
console.log('harmony',JSON.stringify(meta),'bpm',bpm);
const arrangement=m.arrangement.arrangement8();
const comp=m.chordEvents(chords,{voice:'vibraphone',bars:8,velocity:52,stagger:0.16});
const lead=m.composeMelody({chords,bars:8,notesPerBar:4,octaveShift:1,contour:'descend-ascend',scale:meta.scale,scaleRoot:'F4',restProbability:0.45});
const out=m.render([
  m.track('garden','vibraphone',comp,{fx:{hpf:220,lpf:3200,reverb:'mediumRoom',gain:0.32}}),
  m.track('buds','kalimba',m.mask(lead,arrangement.b,8,4),{fx:{hpf:600,lpf:4500,reverb:'smallRoom',gain:0.18}})
],{bpm,master:{normalize:'peak',glue:true,width:1.08}});
m.WavBuilder.write(out,path.join(PROJECT_ASSETS_SFX,'BackgroundMusic.wav'));
