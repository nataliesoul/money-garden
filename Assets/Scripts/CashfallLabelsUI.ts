// Cashfall labels: value chips that float beside machine parts (gross, tax, take-home, jar totals,
// lamp states, the purchase, the growth number) plus a truth-table card. Passive view; CashfallMain
// positions and fills each chip through setChip. Chips face the machine's +Z like the console.

import {RoundedRectangle, RoundedRectBlendMode, GradientParameters} from 'SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle'

const FONT = requireAsset('../Fonts/Outfit.ttf') as Font

export type ChipTone = 'cyan' | 'gold' | 'mint' | 'coral' | 'lavender' | 'ivory'

export interface ChipOptions {
  title?: string
  value?: string
  tone?: ChipTone
  visible?: boolean
  position?: vec3
  /** Width in cm; default 11. */
  width?: number
  /** Height in cm; default 4.2 (title + value). */
  height?: number
  /** Scale pop when the value changes. */
  pop?: boolean
}

interface Chip {
  root: SceneObject
  face: RoundedRectangle
  title: Text
  value: Text
  width: number
  height: number
  lastValue: string
  popT: number
}

@component
export class CashfallLabelsUI extends BaseScriptComponent {
  @ui.label('Cashfall / Labels')
  @ui.separator
  @ui.group_start('Theme')
  @input @hint('Chip surface') @widget(new ColorWidget()) surface: vec4 = new vec4(0.08, 0.1, 0.26, 1)
  @input @hint('Primary text') @widget(new ColorWidget()) ink: vec4 = new vec4(0.97, 0.98, 1, 1)
  @input @hint('Caption text') @widget(new ColorWidget()) caption: vec4 = new vec4(0.8, 0.86, 0.95, 1)
  @input @hint('Title size') @widget(new SliderWidget(18, 40, 1)) titleSize: number = 24
  @input @hint('Value size') @widget(new SliderWidget(28, 60, 1)) valueSize: number = 40
  @ui.group_end

  private ready = false
  private chips: {[id: string]: Chip} = {}
  private pending: {[id: string]: ChipOptions} = {}
  private tones: {[k in ChipTone]: vec4} = {
    cyan: new vec4(0.36, 0.86, 1, 1),
    gold: new vec4(1, 0.78, 0.3, 1),
    mint: new vec4(0.45, 0.95, 0.65, 1),
    coral: new vec4(1, 0.45, 0.5, 1),
    lavender: new vec4(0.72, 0.62, 1, 1),
    ivory: new vec4(0.93, 0.92, 0.86, 1),
  }

  onAwake(): void {
    this.createEvent('OnStartEvent').bind(() => {
      this.sceneObject.createComponent('Component.Canvas')
      this.ready = true
      const ids = Object.keys(this.pending)
      for (let i = 0; i < ids.length; i++) this.setChip(ids[i], this.pending[ids[i]])
      this.pending = {}
    })
    this.createEvent('UpdateEvent').bind(() => this.update())
  }

  /** Creates the chip on first use, then applies the options given. Omitted fields keep their value. */
  setChip(id: string, opts: ChipOptions): void {
    if (!this.ready) {
      this.pending[id] = {...(this.pending[id] || {}), ...opts}
      return
    }
    let c = this.chips[id]
    if (!c) c = this.create(id, opts.width ?? 11, opts.height ?? 4.2)
    if (opts.position) c.root.getTransform().setLocalPosition(opts.position)
    if (opts.title !== undefined) c.title.text = opts.title
    if (opts.value !== undefined) {
      if (opts.value !== c.lastValue && opts.pop !== false && c.root.enabled) c.popT = 1
      c.lastValue = opts.value
      c.value.text = opts.value
    }
    if (opts.tone) {
      const tone = this.tones[opts.tone]
      c.face.borderColor = tone
      c.title.textFill.color = tone
    }
    if (opts.visible !== undefined) c.root.enabled = opts.visible
    const singleLine = c.title.text.length === 0
    c.value.layoutRect = singleLine ? Rect.create(-c.width / 2 + 0.4, c.width / 2 - 0.4, -c.height / 2, c.height / 2) : Rect.create(-c.width / 2 + 0.4, c.width / 2 - 0.4, -c.height / 2 + 0.1, c.height / 2 - 1.3)
    c.title.layoutRect = Rect.create(-c.width / 2 + 0.4, c.width / 2 - 0.4, c.height / 2 - 1.45, c.height / 2 - 0.15)
  }

  hideAll(): void {
    const ids = Object.keys(this.chips)
    for (let i = 0; i < ids.length; i++) this.chips[ids[i]].root.enabled = false
  }

  hide(id: string): void {
    const c = this.chips[id]
    if (c) c.root.enabled = false
  }

  private create(id: string, width: number, height: number): Chip {
    const root = global.scene.createSceneObject('Chip_' + id)
    root.setParent(this.sceneObject)
    const faceHost = global.scene.createSceneObject('Face')
    faceHost.setParent(root)
    const face = faceHost.createComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
    face.size = new vec2(width, height)
    face.cornerRadius = Math.min(1.0, height * 0.3)
    face.gradient = true
    face.backgroundColor = this.surface
    face.opacity = 1
    face.blendMode = RoundedRectBlendMode.Disabled
    face.border = true
    face.borderType = 'Color'
    face.borderSize = 0.12
    face.borderColor = this.tones.cyan
    face.initialize()
    face.setBackgroundGradient(this.gradient(this.tint(this.surface, 1.5), this.tint(this.surface, 0.9)))
    const titleHost = global.scene.createSceneObject('Title')
    titleHost.setParent(root)
    titleHost.getTransform().setLocalPosition(new vec3(0, 0, 0.3))
    const title = this.makeText(titleHost, this.titleSize, 600)
    title.textFill.color = this.caption
    const valueHost = global.scene.createSceneObject('Value')
    valueHost.setParent(root)
    valueHost.getTransform().setLocalPosition(new vec3(0, 0, 0.3))
    const value = this.makeText(valueHost, this.valueSize, 700)
    const chip: Chip = {root, face, title, value, width, height, lastValue: '', popT: 0}
    this.chips[id] = chip
    return chip
  }

  private update(): void {
    const dt = getDeltaTime()
    const ids = Object.keys(this.chips)
    for (let i = 0; i < ids.length; i++) {
      const c = this.chips[ids[i]]
      if (c.popT > 0) {
        c.popT = Math.max(0, c.popT - dt * 3)
        const s = 1 + 0.12 * Math.sin(c.popT * Math.PI)
        c.root.getTransform().setLocalScale(new vec3(s, s, 1))
      }
    }
  }

  private makeText(parent: SceneObject, size: number, weight: number): Text {
    const t = parent.createComponent('Component.Text') as Text
    t.font = FONT
    t.depthTest = true
    t.textFill.color = this.ink
    t.size = size
    t.weight = weight
    t.horizontalAlignment = HorizontalAlignment.Center
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Wrap
    t.verticalOverflow = VerticalOverflow.Overflow
    t.layoutRect = Rect.create(-5, 5, -1.5, 1.5)
    return t
  }

  private tint(c: vec4, f: number): vec4 {
    return new vec4(Math.min(1, c.x * f), Math.min(1, c.y * f), Math.min(1, c.z * f), 1)
  }

  private gradient(top: vec4, bottom: vec4): GradientParameters {
    return {
      enabled: true,
      type: 'Linear',
      start: new vec2(-1, 1),
      end: new vec2(1, -1),
      stop0: {enabled: true, percent: 0, color: top},
      stop1: {enabled: true, percent: 1, color: bottom},
    }
  }
}
