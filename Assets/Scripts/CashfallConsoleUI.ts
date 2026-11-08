// Cashfall console: the lesson card that sits in front of the machine. Owns one UIKit surface:
// chapter tabs + utility dock, kicker, title, body, a toned note, and 1-2 rows of action buttons.
// Passive view: CashfallMain pushes copy and actions in; this emits onAction(id) only.
// Render order comes from hierarchy (Canvas Hierarchy sort); no renderOrder writes anywhere.

import {FlexLayout} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout'
import {FlexItem} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem'
import {FlexAlign, FlexDirection, FlexJustify} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes'
import {StateName} from 'SpectaclesUIKit.lspkg/Scripts/Components/Element'
import {RoundedRectangleVisual, RoundedRectangleVisualState} from 'SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangleVisual'
import {RoundedRectangle, RoundedRectBlendMode, GradientParameters} from 'SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle'
import {Button} from 'SpectaclesUIKit.lspkg/Scripts/Components/Button/Button'
import {IMAGE_MATERIAL_ASSET} from 'SpectaclesUIKit.lspkg/Scripts/Utility/Assets'
import Event from 'SpectaclesInteractionKit.lspkg/Utils/Event'

const FONT = requireAsset('../Fonts/Outfit.ttf') as Font

export type ConsoleIcon =
  | 'play'
  | 'next'
  | 'back'
  | 'replay'
  | 'restart'
  | 'sound'
  | 'muted'
  | 'center'
  | 'info'
  | 'check'
  | 'close'
  | 'add'
  | 'remove'
  | 'bolt'
  | 'savings'
  | 'cart'
  | 'bulb'
  | 'payments'
  | 'bank'
  | 'help'
  | 'done'
  | 'growth'
  | 'touch'

const ICONS: {[k in ConsoleIcon]: Texture} = {
  play: requireAsset('../Icons/play_arrow.png') as Texture,
  next: requireAsset('../Icons/arrow_forward.png') as Texture,
  back: requireAsset('../Icons/arrow_back_wght500.png') as Texture,
  replay: requireAsset('../Icons/replay.png') as Texture,
  restart: requireAsset('../Icons/restart_alt.png') as Texture,
  sound: requireAsset('../Icons/volume_up.png') as Texture,
  muted: requireAsset('../Icons/volume_off_wght500.png') as Texture,
  center: requireAsset('../Icons/center_focus_strong.png') as Texture,
  info: requireAsset('../Icons/info.png') as Texture,
  check: requireAsset('../Icons/check.png') as Texture,
  close: requireAsset('../Icons/close_wght500.png') as Texture,
  add: requireAsset('../Icons/add_wght500.png') as Texture,
  remove: requireAsset('../Icons/remove.png') as Texture,
  bolt: requireAsset('../Icons/bolt.png') as Texture,
  savings: requireAsset('../Icons/savings.png') as Texture,
  cart: requireAsset('../Icons/shopping_cart.png') as Texture,
  bulb: requireAsset('../Icons/lightbulb.png') as Texture,
  payments: requireAsset('../Icons/payments.png') as Texture,
  bank: requireAsset('../Icons/account_balance.png') as Texture,
  help: requireAsset('../Icons/help.png') as Texture,
  done: requireAsset('../Icons/task_alt.png') as Texture,
  growth: requireAsset('../Icons/trending_up.png') as Texture,
  touch: requireAsset('../Icons/touch_app.png') as Texture,
}

export type ConsoleRole = 'title' | 'body' | 'note' | 'button' | 'kicker' | 'tab' | 'dock'
const TYPE_SCALE: {[r in ConsoleRole]: {size: number; weight: number}} = {
  title: {size: 58, weight: 700},
  body: {size: 40, weight: 500},
  note: {size: 34, weight: 500},
  button: {size: 36, weight: 600},
  kicker: {size: 29, weight: 600},
  tab: {size: 27, weight: 600},
  dock: {size: 20, weight: 500},
}

export type NoteTone = 'neutral' | 'success' | 'alert' | 'none'

export interface ConsoleAction {
  id: string
  label: string
  icon?: ConsoleIcon
  primary?: boolean
  toggled?: boolean
  disabled?: boolean
}

interface ActionView {
  object: SceneObject
  button: Button
  item: FlexItem
  layout: FlexLayout | null
  text: Text
  iconObject: SceneObject
  icon: Image
  iconKey?: ConsoleIcon
  visual: RoundedRectangleVisual
  kind: string
}

@component
export class CashfallConsoleUI extends BaseScriptComponent {
  @ui.label('Cashfall / Console')
  @ui.separator
  @ui.group_start('Size')
  @input @hint('Card width in centimeters') @widget(new SliderWidget(30, 52, 1)) width: number = 40
  @input @hint('Button row height in centimeters') @widget(new SliderWidget(3, 5.5, 0.1)) buttonHeight: number = 4.1
  @input @hint('Typography scale around the readable base sizes') @widget(new SliderWidget(0.8, 1.3, 0.05)) typeScale: number = 1
  @ui.group_end
  @ui.group_start('Theme')
  @input @hint('Card surface') @widget(new ColorWidget()) surface: vec4 = new vec4(0.08, 0.1, 0.26, 1)
  @input @hint('Primary text') @widget(new ColorWidget()) ink: vec4 = new vec4(0.97, 0.98, 1, 1)
  @input @hint('Electric cyan edges and secondary controls') @widget(new ColorWidget()) cyan: vec4 = new vec4(0.36, 0.86, 1, 1)
  @input @hint('Gold kicker and primary actions') @widget(new ColorWidget()) gold: vec4 = new vec4(1, 0.78, 0.3, 1)
  @input @hint('Mint success tone') @widget(new ColorWidget()) mint: vec4 = new vec4(0.45, 0.95, 0.65, 1)
  @input @hint('Coral alert tone') @widget(new ColorWidget()) coral: vec4 = new vec4(1, 0.45, 0.5, 1)
  @input @hint('Card corner radius in centimeters') @widget(new SliderWidget(0.5, 2.5, 0.1)) cornerRadius: number = 1.6
  @ui.group_end

  public onAction = new Event<string>()

  private ready = false
  private plate: RoundedRectangle | null = null
  private textBlock!: SceneObject
  private actionHost!: SceneObject
  private actionPane: SceneObject | null = null
  private parking!: SceneObject
  private actionViews: {[id: string]: ActionView} = {}
  private rebuildEvent!: DelayedCallbackEvent
  private rebuildQueued = false
  private renderedActions = ''
  private pendingActions: ConsoleAction[][] = []
  private kicker!: Text
  private title!: Text
  private body!: Text
  private note!: Text
  private noteFace: RoundedRectangle | null = null
  private tabFaces: RoundedRectangle[] = []
  private tabTexts: Text[] = []
  private chapter = -1
  private chapterDone: boolean[] = [false, false, false]
  private pendingCopy = {kicker: '', title: 'Cashfall', body: '', note: ''}
  private pendingTone: NoteTone = 'none'
  private muted = false
  private dockViews: {[id: string]: ActionView} = {}
  private textHeight = 0
  private pad = 0.75

  onAwake(): void {
    this.rebuildEvent = this.createEvent('DelayedCallbackEvent')
    this.rebuildEvent.bind(() => {
      this.rebuildQueued = false
      this.rebuildActions()
    })
    this.createEvent('OnDestroyEvent').bind(() => this.rebuildEvent.cancel())
    this.createEvent('OnStartEvent').bind(() => this.build())
  }

  // ---------------------------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------------------------

  setCopy(kicker: string, title: string, body: string, note: string = '', tone: NoteTone = 'neutral'): void {
    this.pendingCopy = {kicker, title, body, note}
    this.pendingTone = note.length === 0 ? 'none' : tone
    if (!this.ready) return
    this.kicker.text = kicker
    this.title.text = title
    this.body.text = body
    this.note.text = note
    this.applyNoteTone()
  }

  setNote(note: string, tone: NoteTone = 'neutral'): void {
    this.pendingCopy.note = note
    this.pendingTone = note.length === 0 ? 'none' : tone
    if (!this.ready) return
    this.note.text = note
    this.applyNoteTone()
  }

  setActions(rows: ConsoleAction[][]): void {
    this.pendingActions = rows.map((row) => row.map((a) => ({...a})))
    if (!this.ready || this.rebuildQueued) return
    if (JSON.stringify(this.pendingActions) === this.renderedActions) return
    this.rebuildQueued = true
    this.rebuildEvent.reset(0.001)
  }

  setChapter(chapter: number, done: boolean[]): void {
    this.chapter = chapter
    this.chapterDone = done.slice()
    if (!this.ready) return
    for (let i = 0; i < this.tabFaces.length; i++) {
      const active = i === chapter
      const complete = this.chapterDone[i]
      this.tabFaces[i].backgroundColor = active ? this.tint(this.gold, 0.35) : complete ? this.tint(this.mint, 0.18) : this.tint(this.surface, 1.3)
      this.tabFaces[i].borderColor = active ? this.gold : complete ? this.mint : this.tint(this.cyan, 0.45)
      this.tabTexts[i].textFill.color = active ? this.ink : complete ? this.mint : this.tint(this.ink, 0.6)
    }
  }

  setMuted(m: boolean): void {
    this.muted = m
    const v = this.dockViews['mute']
    if (v) {
      v.icon.mainPass.baseTex = ICONS[m ? 'muted' : 'sound']
      v.icon.mainPass.baseColor = m ? this.coral : this.cyan
    }
  }

  setVisible(show: boolean): void {
    this.sceneObject.enabled = show
  }

  // ---------------------------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------------------------

  private build(): void {
    this.sceneObject.createComponent('Component.Canvas')
    const W = this.width
    const plateHost = this.obj(this.sceneObject, 'Plate')
    this.plate = this.surfaceRect(plateHost, 'CardSurface', W, 20, this.surface, this.tint(this.cyan, 0.9), new vec3(0, 0, 0), this.cornerRadius, 0.16)
    this.plate.gradient = true
    this.plate.setBackgroundGradient(this.gradient(this.tint(this.surface, 1.55), this.tint(this.surface, 0.85)))

    // Text block (top-anchored column).
    this.textBlock = this.obj(this.sceneObject, 'TextBlock', new vec3(0, 0, 0.6))
    const inner = W - this.pad * 2
    const rows = {header: 1.9, kicker: 1.0, title: 2.5, body: 3.9, note: 2.0}
    const gap = 0.25
    this.textHeight = rows.header + rows.kicker + rows.title + rows.body + rows.note + gap * 4
    const col = this.flexColumn(this.textBlock, inner, this.textHeight, {gap, align: FlexAlign.Stretch})
    this.order(this.flexChild(col, {w: inner, h: rows.header}, (h) => this.buildHeader(h, inner, rows.header)), 0)
    this.kicker = this.textRow(col, 'kicker', rows.kicker, inner, 'Kicker')
    this.kicker.textFill.color = this.gold
    this.order(this.kicker.getSceneObject(), 1)
    this.title = this.textRow(col, 'title', rows.title, inner, 'Title')
    this.order(this.title.getSceneObject(), 2)
    this.body = this.textRow(col, 'body', rows.body, inner, 'Body')
    this.order(this.body.getSceneObject(), 3)
    this.order(
      this.flexChild(col, {w: inner, h: rows.note}, (holder) => {
        this.noteFace = this.surfaceRect(holder, 'NoteFace', inner, rows.note, this.tint(this.surface, 0.7), this.gold, new vec3(0, 0, -0.08), 0.7, 0.12)
        const t = this.obj(holder, 'NoteText', new vec3(0, 0, 0.1))
        this.note = this.makeText(t, 'note', inner - 1.2, rows.note - 0.2)
      }),
      4
    )

    // Actions host (bottom). Parked buttons live disabled so SIK keeps stable targets.
    this.actionHost = this.obj(this.sceneObject, 'ActionHost', new vec3(0, 0, 0.6))
    this.parking = this.obj(this.sceneObject, 'InactiveActions')
    this.parking.enabled = false

    this.ready = true
    this.setCopy(this.pendingCopy.kicker, this.pendingCopy.title, this.pendingCopy.body, this.pendingCopy.note, this.pendingTone)
    this.setChapter(this.chapter, this.chapterDone)
    this.setMuted(this.muted)
    this.layoutHeights(1)
    this.setActions(this.pendingActions)
  }

  private buildHeader(holder: SceneObject, w: number, h: number): void {
    const row = this.flexRow(holder, w, h, {gap: 0.5, align: FlexAlign.Center, justify: FlexJustify.SpaceBetween})
    const tabW = 7.4
    const labels = ['01  FALLS', '02  SPLIT', '03  GATE']
    this.flexChild(row, {w: tabW * 3 + 1.0, h}, (tabs) => {
      const tabRow = this.flexRow(tabs, tabW * 3 + 1.0, h, {gap: 0.5, align: FlexAlign.Center})
      for (let i = 0; i < 3; i++) {
        this.flexChild(tabRow, {w: tabW, h: h - 0.3}, (tab) => {
          this.tabFaces.push(this.surfaceRect(tab, 'Tab' + i, tabW, h - 0.3, this.tint(this.surface, 1.3), this.tint(this.cyan, 0.45), new vec3(0, 0, -0.05), 0.55, 0.1))
          const t = this.makeText(this.obj(tab, 'TabLabel', new vec3(0, 0, 0.1)), 'tab', tabW - 0.4, h - 0.5)
          t.text = labels[i]
          this.tabTexts.push(t)
        })
      }
    })
    const dock: ConsoleAction[] = [
      {id: 'mute', label: '', icon: 'sound'},
      {id: 'recenter', label: '', icon: 'center'},
      {id: 'restart', label: '', icon: 'restart'},
      {id: 'help', label: '', icon: 'help'},
    ]
    const dockW = dock.length * (h - 0.2) + (dock.length - 1) * 0.4
    this.flexChild(row, {w: dockW, h}, (dockHost) => {
      const dockRow = this.flexRow(dockHost, dockW, h, {gap: 0.4, align: FlexAlign.Center, justify: FlexJustify.End})
      for (let i = 0; i < dock.length; i++) {
        const a = dock[i]
        this.flexChild(dockRow, {w: h - 0.2, h: h - 0.2}, (bh) => {
          const v = this.makeActionView(bh, a, h - 0.2, h - 0.2, 'dock')
          this.dockViews[a.id] = v
          v.object.setParent(bh)
          v.object.enabled = true
          v.item.overrideWidth = h - 0.2
          v.item.overrideHeight = h - 0.2
          const layout = bh.getComponent(FlexLayout.getTypeName()) as FlexLayout | null
          if (layout) layout.onInitialized.add(() => layout.addItems([v.item]))
        })
      }
    })
  }

  private layoutHeights(actionRows: number): void {
    const rowH = this.buttonHeight
    const gap = 0.6
    const actionsH = actionRows * rowH + Math.max(0, actionRows - 1) * gap
    const H = this.pad + this.textHeight + 0.55 + actionsH + this.pad
    if (this.plate) this.plate.size = new vec2(this.width, H)
    this.textBlock.getTransform().setLocalPosition(new vec3(0, H / 2 - this.pad - this.textHeight / 2, 0.6))
    this.actionHost.getTransform().setLocalPosition(new vec3(0, -H / 2 + this.pad + actionsH / 2, 0.6))
  }

  private applyNoteTone(): void {
    if (!this.noteFace) return
    const tone = this.pendingTone
    const show = tone !== 'none'
    const accent = tone === 'success' ? this.mint : tone === 'alert' ? this.coral : this.gold
    this.noteFace.borderColor = show ? this.tint(accent, 0.95) : new vec4(0, 0, 0, 0)
    this.noteFace.backgroundColor = show ? (tone === 'success' ? new vec4(0.05, 0.28, 0.22, 1) : tone === 'alert' ? new vec4(0.34, 0.1, 0.14, 1) : this.tint(this.surface, 0.7)) : this.tint(this.surface, 1.0)
    this.noteFace.opacity = show ? 1 : 0
    this.note.textFill.color = tone === 'success' ? this.tint(this.mint, 1.05) : tone === 'alert' ? new vec4(1, 0.82, 0.84, 1) : this.ink
  }

  private buttonWidth(count: number): number {
    const inner = this.width - this.pad * 2
    return Math.min(19, (inner - (count - 1) * 0.7) / Math.max(1, count))
  }

  private rebuildActions(): void {
    if (!this.ready || !this.actionHost || isNull(this.actionHost)) return
    const rows = this.pendingActions
    const key = JSON.stringify(rows)
    if (key === this.renderedActions) return
    Object.keys(this.actionViews).forEach((id) => {
      const v = this.actionViews[id]
      v.object.enabled = false
      if (v.layout && !isNull(v.layout)) v.layout.removeItems([v.item])
      v.layout = null
      v.object.setParent(this.parking)
    })
    if (this.actionPane && !isNull(this.actionPane)) this.actionPane.destroy()
    this.actionPane = this.obj(this.actionHost, 'Actions')
    const rowCount = Math.max(1, rows.length)
    this.layoutHeights(rowCount)
    const rowH = this.buttonHeight
    const gap = 0.6
    const inner = this.width - this.pad * 2
    const actionsH = rowCount * rowH + Math.max(0, rowCount - 1) * gap
    const col = this.flexColumn(this.actionPane, inner, actionsH, {gap, justify: FlexJustify.Center, align: FlexAlign.Center})
    rows.forEach((actions) =>
      this.flexChild(col, {w: inner, h: rowH}, (holder) => {
        const row = this.flexRow(holder, inner, rowH, {gap: 0.7, justify: FlexJustify.Center, align: FlexAlign.Center})
        const w = this.buttonWidth(actions.length)
        actions.forEach((a) => this.placeAction(row, a, w, rowH))
      })
    )
    this.renderedActions = key
  }

  private makeActionView(parent: SceneObject, a: ConsoleAction, w: number, h: number, kind: string): ActionView {
    const child = this.obj(parent, 'CF_' + a.id)
    const item = child.createComponent(FlexItem.getTypeName()) as FlexItem
    item.flexShrink = 0
    const b = child.createComponent(Button.getTypeName()) as Button
    b.size = new vec3(w, h, 1)
    const visual = this.buttonVisual(child, a, kind)
    b.visual = visual
    b.initialize()
    const iconObject = this.obj(child, 'Icon', new vec3(0, 0, 0.12))
    const icon = this.image(iconObject, ICONS.play, 1, this.ink)
    const label = this.obj(child, 'Label', new vec3(0, 0, 0.12))
    const text = this.makeText(label, kind === 'dock' ? 'dock' : 'button', w - 0.8, h - 0.8)
    const v: ActionView = {object: child, button: b, item, layout: null, text, iconObject, icon, visual, kind}
    b.onTriggerUp.add(() => {
      if (!this.rebuildQueued && child.enabled) this.onAction.invoke(a.id)
    })
    this.applyActionStyle(v, a, w, h)
    return v
  }

  private applyActionStyle(v: ActionView, a: ConsoleAction, w: number, h: number): void {
    const dock = v.kind === 'dock'
    const texture = a.icon ? ICONS[a.icon] : null
    v.iconObject.enabled = !!texture
    if (texture && a.icon !== v.iconKey) {
      v.icon.mainPass.baseTex = texture
      v.iconKey = a.icon
    }
    const primary = !!a.primary
    v.icon.mainPass.baseColor = a.disabled ? this.tint(this.ink, 0.4) : dock ? this.cyan : primary ? this.gold : a.toggled ? this.mint : this.ink
    v.text.text = a.label
    v.text.textFill.color = a.disabled ? this.tint(this.ink, 0.45) : a.toggled ? this.mint : this.ink
    if (dock) {
      const size = Math.min(1.5, h * 0.6)
      v.iconObject.getTransform().setLocalScale(new vec3(size, size, 1))
      v.iconObject.getTransform().setLocalPosition(new vec3(0, 0, 0.12))
      v.text.layoutRect = Rect.create(-w / 2, w / 2, -h / 2, h / 2)
      return
    }
    const size = texture ? Math.min(1.9, h * 0.42, w * 0.2) : 0
    v.iconObject.getTransform().setLocalScale(new vec3(size, size, 1))
    v.iconObject.getTransform().setLocalPosition(new vec3(-w / 2 + 0.7 + size / 2, 0, 0.12))
    v.text.layoutRect = Rect.create(texture ? -w / 2 + 1.0 + size : -(w - 0.8) / 2, (w - 0.8) / 2, -(h / 2 - 0.3), h / 2 - 0.3)
    v.button.enabled = !a.disabled
  }

  private placeAction(row: SceneObject, a: ConsoleAction, w: number, h: number): void {
    let v = this.actionViews[a.id]
    if (!v) {
      v = this.makeActionView(this.parking, a, w, h, 'deck')
      this.actionViews[a.id] = v
    } else {
      // Restyle in place: the visual's states were built for the earlier role; rebuild only when role changed.
      const styleKey = (a.primary ? 'p' : 's') + (a.toggled ? 't' : 'u') + (a.disabled ? 'd' : 'e')
      if (v.object.name !== 'CF_' + a.id + '|' + styleKey) {
        v.visual = this.buttonVisual(v.object, a, 'deck')
        v.button.visual = v.visual
      }
    }
    v.object.name = 'CF_' + a.id + '|' + (a.primary ? 'p' : 's') + (a.toggled ? 't' : 'u') + (a.disabled ? 'd' : 'e')
    v.object.setParent(row)
    v.object.getTransform().setLocalPosition(new vec3(0, 0, 0.02))
    v.object.enabled = true
    v.item.overrideWidth = w
    v.item.overrideHeight = h
    v.button.size = new vec3(w, h, 1)
    this.applyActionStyle(v, a, w, h)
    const layout = row.getComponent(FlexLayout.getTypeName()) as FlexLayout
    v.layout = layout
    const current = v
    layout.onInitialized.add(() => {
      if (!isNull(current.item) && current.layout === layout) layout.addItems([current.item])
    })
  }

  // ---------------------------------------------------------------------------------------------
  // Visual helpers
  // ---------------------------------------------------------------------------------------------

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

  private surfaceRect(parent: SceneObject, name: string, w: number, h: number, color: vec4, border: vec4, p: vec3, r: number, borderSize: number): RoundedRectangle {
    const o = this.obj(parent, name, p)
    const shape = o.createComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
    shape.size = new vec2(w, h)
    shape.cornerRadius = r
    shape.gradient = false
    shape.backgroundColor = color
    shape.opacity = 1
    shape.blendMode = RoundedRectBlendMode.Disabled
    shape.border = true
    shape.borderType = 'Color'
    shape.borderSize = borderSize
    shape.borderColor = border
    shape.initialize()
    return shape
  }

  private image(parent: SceneObject, texture: Texture, size: number, tintColor: vec4): Image {
    const img = parent.createComponent('Component.Image') as Image
    img.mainMaterial = IMAGE_MATERIAL_ASSET.clone()
    img.mainPass.baseTex = texture
    img.mainPass.baseColor = tintColor
    img.stretchMode = StretchMode.Stretch
    parent.getTransform().setLocalScale(new vec3(size, size, 1))
    return img
  }

  private buttonVisual(parent: SceneObject, a: ConsoleAction, kind: string): RoundedRectangleVisual {
    const dock = kind === 'dock'
    const primary = !!a.primary && !dock
    const toggled = !!a.toggled
    const fill = primary ? new vec4(0.05, 0.3, 0.3, 1) : toggled ? new vec4(0.05, 0.3, 0.3, 1) : dock ? this.tint(this.surface, 1.1) : this.tint(this.surface, 1.6)
    const edge = primary ? this.gold : toggled ? this.mint : dock ? this.tint(this.cyan, 0.55) : this.tint(this.cyan, 0.8)
    const state = (color: vec4, border: vec4, size: number): RoundedRectangleVisualState => ({
      baseType: 'Gradient',
      baseGradient: this.gradient(this.tint(color, 1.25), color),
      hasBorder: true,
      borderType: 'Color',
      borderColor: border,
      borderSize: size,
      shouldScale: false,
    })
    const style: Partial<Record<StateName, RoundedRectangleVisualState>> = {
      default: state(fill, edge, primary ? 0.2 : 0.13),
      hovered: state(this.tint(fill, 1.6), this.tint(this.cyan, 1.1), 0.22),
      triggered: state(this.tint(fill, 2.2), this.gold, 0.3),
      inactive: state(this.tint(this.surface, 0.8), this.tint(this.cyan, 0.2), 0.05),
      toggledDefault: state(fill, this.mint, 0.2),
      toggledHovered: state(this.tint(fill, 1.6), this.mint, 0.22),
      toggledTriggered: state(this.tint(fill, 2.2), this.gold, 0.3),
    }
    const visual = new RoundedRectangleVisual({sceneObject: parent, style, transparent: false})
    visual.cornerRadius = dock ? 0.8 : 1.0
    return visual
  }

  private makeText(parent: SceneObject, role: ConsoleRole, w: number, h: number): Text {
    const t = parent.createComponent('Component.Text') as Text
    t.font = FONT
    t.depthTest = true
    t.textFill.color = this.ink
    t.size = TYPE_SCALE[role].size * this.typeScale
    t.italic = false
    if (TYPE_SCALE[role].weight >= 600) t.weight = TYPE_SCALE[role].weight
    t.horizontalAlignment = HorizontalAlignment.Center
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Wrap
    t.verticalOverflow = VerticalOverflow.Overflow
    t.layoutRect = Rect.create(-w / 2, w / 2, -h / 2, h / 2)
    return t
  }

  private textRow(parent: SceneObject, role: ConsoleRole, h: number, w: number, name: string): Text {
    let result!: Text
    this.flexChild(parent, {w, h}, (child) => {
      child.name = name
      result = this.makeText(child, role, w, h)
    })
    return result
  }

  private order(item: SceneObject, order: number): void {
    ;(item.getComponent(FlexItem.getTypeName()) as FlexItem).order = order
  }

  private obj(parent: SceneObject, name: string, position?: vec3): SceneObject {
    const o = global.scene.createSceneObject(name)
    o.setParent(parent)
    if (position) o.getTransform().setLocalPosition(position)
    return o
  }

  private liftInZ(o: SceneObject, z: number): void {
    const t = o.getTransform()
    const p = t.getLocalPosition()
    t.setLocalPosition(new vec3(p.x, p.y, p.z + z))
  }

  private flexColumn(parent: SceneObject, w: number, h: number, opts?: {gap?: number; padY?: number; padX?: number; justify?: FlexJustify; align?: FlexAlign}): SceneObject {
    return this.makeFlex(parent, FlexDirection.Column, w, h, opts)
  }

  private flexRow(parent: SceneObject, w: number, h: number, opts?: {gap?: number; padY?: number; padX?: number; justify?: FlexJustify; align?: FlexAlign}): SceneObject {
    return this.makeFlex(parent, FlexDirection.Row, w, h, opts)
  }

  private makeFlex(parent: SceneObject, direction: FlexDirection, width: number, height: number, opts?: {gap?: number; padY?: number; padX?: number; justify?: FlexJustify; align?: FlexAlign}): SceneObject {
    const container = this.obj(parent, 'Flex')
    this.liftInZ(container, 0.02)
    const f = container.createComponent(FlexLayout.getTypeName()) as FlexLayout
    const fi = container.createComponent(FlexItem.getTypeName()) as FlexItem
    if (width > 0) fi.overrideWidth = width
    if (height > 0) fi.overrideHeight = height
    f.onInitialized.add(() => {
      f.width = width
      f.height = height
      f.direction = direction
      if (direction === FlexDirection.Row) f.columnGap = opts?.gap ?? 0
      else f.rowGap = opts?.gap ?? 0
      f.paddingTop = opts?.padY ?? 0
      f.paddingBottom = opts?.padY ?? 0
      f.paddingLeft = opts?.padX ?? 0
      f.paddingRight = opts?.padX ?? 0
      f.justifyContent = opts?.justify ?? FlexJustify.Start
      f.alignItems = opts?.align ?? FlexAlign.Stretch
    })
    return container
  }

  private flexChild(parent: SceneObject, size: {w?: number; h?: number; grow?: number}, builder: (o: SceneObject) => void): SceneObject {
    const child = this.obj(parent, 'Item')
    this.liftInZ(child, 0.02)
    const item = child.createComponent(FlexItem.getTypeName()) as FlexItem
    if (size.w && size.w > 0) item.overrideWidth = size.w
    if (size.h && size.h > 0) item.overrideHeight = size.h
    item.flexGrow = size.grow ?? 0
    item.flexShrink = 0
    builder(child)
    const f = parent.getComponent(FlexLayout.getTypeName()) as FlexLayout | null
    if (f)
      f.onInitialized.add(() => {
        if (!isNull(item)) f.addItems([item])
      })
    return child
  }
}
