// Cashfall audio: one looping ambient bed plus a small pool of spatial one-shot emitters.
// Owned by CashfallMain. Emitters are moved to the part that makes the sound so clinks and
// thunks come from the machine, not from the viewer's head.

const AMBIENT = requireAsset('../GeneratedSFX/Ambient.wav') as AudioTrackAsset
const TRACKS: {[k: string]: AudioTrackAsset} = {
  click: requireAsset('../GeneratedSFX/Click.wav') as AudioTrackAsset,
  hover: requireAsset('../GeneratedSFX/Hover.wav') as AudioTrackAsset,
  coin: requireAsset('../GeneratedSFX/Coin.wav') as AudioTrackAsset,
  flow: requireAsset('../GeneratedSFX/Flow.wav') as AudioTrackAsset,
  correct: requireAsset('../GeneratedSFX/Correct.wav') as AudioTrackAsset,
  wrong: requireAsset('../GeneratedSFX/Wrong.wav') as AudioTrackAsset,
  gateOpen: requireAsset('../GeneratedSFX/GateOpen.wav') as AudioTrackAsset,
  gateClosed: requireAsset('../GeneratedSFX/GateClosed.wav') as AudioTrackAsset,
  place: requireAsset('../GeneratedSFX/Place.wav') as AudioTrackAsset,
  surprise: requireAsset('../GeneratedSFX/Surprise.wav') as AudioTrackAsset,
  grow: requireAsset('../GeneratedSFX/Grow.wav') as AudioTrackAsset,
  pop: requireAsset('../GeneratedSFX/Pop.wav') as AudioTrackAsset,
}

export type Sfx = 'click' | 'hover' | 'coin' | 'flow' | 'correct' | 'wrong' | 'gateOpen' | 'gateClosed' | 'place' | 'surprise' | 'grow' | 'pop'

const GAIN: {[k: string]: number} = {
  click: 0.5,
  hover: 0.18,
  coin: 0.55,
  flow: 0.5,
  correct: 0.6,
  wrong: 0.5,
  gateOpen: 0.6,
  gateClosed: 0.6,
  place: 0.6,
  surprise: 0.6,
  grow: 0.55,
  pop: 0.4,
}

export class CashfallAudio {
  muted = false
  private bed: AudioComponent
  private emitters: {object: SceneObject; audio: AudioComponent}[] = []
  private next = 0
  private warned = false
  private lastPlay: {[k: string]: number} = {}
  private clock = 0

  constructor(root: SceneObject, private musicVolume: number, poolSize: number = 4) {
    this.bed = root.createComponent('Component.AudioComponent') as AudioComponent
    this.bed.audioTrack = AMBIENT
    this.bed.volume = musicVolume
    this.bed.playbackMode = Audio.PlaybackMode.LowPower
    for (let i = 0; i < poolSize; i++) {
      const o = global.scene.createSceneObject('SfxEmitter' + i)
      o.setParent(root)
      const a = o.createComponent('Component.AudioComponent') as AudioComponent
      a.playbackMode = Audio.PlaybackMode.LowLatency
      a.audioTrack = TRACKS.click
      try {
        a.spatialAudio.enabled = true
      } catch (e) {
        this.report(e)
      }
      this.emitters.push({object: o, audio: a})
    }
    try {
      this.bed.play(-1)
    } catch (e) {
      this.report(e)
    }
  }

  /** Call once per frame so rapid repeats of the same cue are rate-limited. */
  tick(dt: number): void {
    this.clock += dt
  }

  /** Plays a cue; when `at` is given the emitter moves to that object's world position first. */
  play(kind: Sfx, at?: SceneObject | null, minGap: number = 0.05): void {
    if (this.muted) return
    const last = this.lastPlay[kind]
    if (last !== undefined && this.clock - last < minGap) return
    this.lastPlay[kind] = this.clock
    const e = this.emitters[this.next]
    this.next = (this.next + 1) % this.emitters.length
    try {
      if (at && !isNull(at)) e.object.getTransform().setWorldPosition(at.getTransform().getWorldPosition())
      if (e.audio.isPlaying()) e.audio.stop(false)
      e.audio.audioTrack = TRACKS[kind]
      e.audio.volume = GAIN[kind]
      e.audio.play(1)
    } catch (err) {
      this.report(err)
    }
  }

  setMuted(m: boolean): void {
    this.muted = m
    try {
      this.bed.volume = m ? 0 : this.musicVolume
      if (m) for (let i = 0; i < this.emitters.length; i++) if (this.emitters[i].audio.isPlaying()) this.emitters[i].audio.stop(false)
    } catch (e) {
      this.report(e)
    }
  }

  toggle(): boolean {
    this.setMuted(!this.muted)
    return this.muted
  }

  private report(error: unknown): void {
    if (this.warned) return
    this.warned = true
    print('Cashfall audio unavailable: ' + String(error))
  }
}
