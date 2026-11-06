const ALLOCATE=requireAsset('../GeneratedSFX/Allocate.wav') as AudioTrackAsset;
const CORRECT=requireAsset('../GeneratedSFX/Correct.wav') as AudioTrackAsset;
const RETRY=requireAsset('../GeneratedSFX/Retry.wav') as AudioTrackAsset;
const MUSIC=requireAsset('../GeneratedSFX/BackgroundMusic.wav') as AudioTrackAsset;
export class MoneyGardenAudio {
 private bed:AudioComponent;private cue:AudioComponent;private warned=false;muted=false;
 constructor(root:SceneObject,private volume:number){
  this.bed=root.createComponent('Component.AudioComponent');this.bed.audioTrack=MUSIC;this.bed.volume=volume;this.bed.playbackMode=Audio.PlaybackMode.LowPower;
  this.cue=root.createComponent('Component.AudioComponent');this.cue.audioTrack=RETRY;this.cue.playbackMode=Audio.PlaybackMode.LowLatency;this.cue.volume=.35;
  try{this.bed.play(-1);}catch(e){this.report(e);}
 }
 play(kind:'allocate'|'correct'|'retry'):void {
  if(this.muted)return;
  try{if(this.cue.isPlaying())this.cue.stop(false);this.cue.audioTrack=kind==='allocate'?ALLOCATE:kind==='correct'?CORRECT:RETRY;this.cue.play(1);}catch(e){this.report(e);}
 }
 toggle():void {
  this.muted=!this.muted;
  try{this.bed.volume=this.muted?0:this.volume;if(this.muted&&this.cue.isPlaying())this.cue.stop(false);}catch(e){this.report(e);}
 }
 private report(error:unknown):void {if(!this.warned){this.warned=true;print('Money Garden supplemental audio unavailable: '+String(error));}}
}
