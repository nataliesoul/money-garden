// Cashfall intro card: the only head-relative surface. Shows the title and the two placement
// choices, then the aiming hint while the reticle is live, and later doubles as the "machine is
// behind you" rescue card. Follows the viewer gently; everything else is world-locked.

import {FlexLayout} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout'
import {FlexItem} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem'
import {FlexAlign, FlexDirection, FlexJustify} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes'
import {StateName} from 'SpectaclesUIKit.lspkg/Scripts/Components/Element'
import {RoundedRectangleVisual, RoundedRectangleVisualState} from 'SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangleVisual'
import {RoundedRectangle, RoundedRectBlendMode, GradientParameters} from 'SpectaclesUIKit.lspkg/Scripts/Visuals/RoundedRectangle/RoundedRectangle'
import {Button} from 'SpectaclesUIKit.lspkg/Scripts/Components/Button/Button'
import {IMAGE_MATERIAL_ASSET} from 'SpectaclesUIKit.lspkg/Scripts/Utility/Assets'
import WorldCameraFinderProvider from 'SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider'
import Event from 'SpectaclesInteractionKit.lspkg/Utils/Event'
import {lerpVec, smoothing} from './CashfallTween'

const FONT = requireAsset('../Fonts/Outfit.ttf') as Font
const ICON_TOUCH = requireAsset('../Icons/touch_app.png') as Texture
const ICON_CENTER = requireAsset('../Icons/center_focus_strong.png') as Texture
const ICON_PLAY = requireAsset('../Icons/play_arrow.png') as Texture
const ICON_CLOSE = requireAsset('../Icons/close_wght500.png') as Texture

export type IntroMode = 'welcome' | 'placing' | 'rescue' | 'hidden'

@component
export class CashfallIntroUI extends BaseScriptComponent {
  @ui.label('Cashfall / Intro card')
  @ui.separator
  @ui.group_start('Settings')
  @input @hint('Card width in centimeters') @widget(new SliderWidget(24, 44, 1)) width: number = 38
  @input @hint('Distance in front of the viewer, in centimeters') @widget(new SliderWidget(60, 140, 5)) distance: number = 95
  @input @hint('Drop below eye line, in centimeters') @widget(new SliderWidget(-10, 30, 1)) drop: number = 6
  @input @hint('Title copy') title: string = 'CASHFALL'
  @input @hint('Tagline copy') tagline: string = 'See where every dollar goes.'
  @ui.group_end
  @ui.group_start('Theme')
  @input @hint('Card surface') @widget(new ColorWidget()) surface: vec4 = new vec4(0.08, 0.1, 0.26, 1)
  @input @hint('Primary text') @widget(new ColorWidget()) ink: vec4 = new vec4(0.97, 0.98, 1, 1)
  @input @hint('Cyan edge') @widget(new ColorWidget()) cyan: vec4 = new vec4(0.36, 0.86, 1, 1)
  @input @hint('Gold accent') @widget(new ColorWidget()) gold: vec4 = new vec4(1, 0.78, 0.3, 1)
  @ui.group_end

  public onPlaceOnSurface = new Event<void>()
  public onPlaceInFront = new Event<void>()
  public onCancelPlacing = new Event<void>()
  public onRecenter = new Event<void>()

  private ready = false
  private mode: IntroMode = 'hidden'
  private heading!: Text
  private sub!: Text
  private hint!: Text
  private plate!: RoundedRectangle
  private buttons: {[id: string]: {object: SceneObject; label: Text; icon: Image}} = {}
  private rows: {[id: string]: SceneObject} = {}
  private targetPos: vec3 | null = null
  private targetRot: quat | null = null
  private snap = true

  onAwake(): void {
    this.createEvent('OnStartEvent').bind(() => this.build())
    this.createEvent('UpdateEvent').bind(() => this.update())
  }

  setMode(mode: IntroMode): void {
    this.mode = mode
    if (!this.ready) return
    const show = mode !== 'hidden'
    if (show && !this.sceneObject.enabled) this.snap = true
    this.sceneObject.enabled = show
    if (!show) return
    const welcome = mode === 'welcome'
    const placing = mode === 'placing'
    const rescue = mode === 'rescue'
    this.heading.text = welcome ? this.title : placing ? 'Aim at a table' : 'Machine out of view'
    this.sub.text = welcome ? this.tagline : placing ? 'Point at a flat surface and pinch to place the machine.' : 'Bring it back in front of you, or turn around to find it.'
    this.hint.text = welcome ? 'Taxes  ·  Budget  ·  Logic  ·  One machine' : placing ? 'Looking for a surface…' : ''
    this.rows.welcome.enabled = welcome
    this.rows.placing.enabled = placing
    this.rows.rescue.enabled = rescue
  }

  setHint(text: string): void {
    if (this.ready) this.hint.text = text
  }

  private build(): void {
    this.sceneObject.createComponent('Component.Canvas')
    const W = this.width
    const H = 18.5
    const plateHost = this.obj(this.sceneObject, 'Plate')
    this.plate = this.rect(plateHost, W, H, this.surface, this.cyan, 1.8, 0.18)
    this.plate.gradient = true
    this.plate.setBackgroundGradient(this.gradient(this.tint(this.surface, 1.7), this.tint(this.surface, 0.8)))

    const content = this.obj(this.sceneObject, 'Content', new vec3(0, 0, 0.6))
    const col = this.flexColumn(content, W - 2, H - 1.2, {gap: 0.4, align: FlexAlign.Stretch, justify: FlexJustify.Center})
    this.heading = this.textRow(col, 84, 700, 4.0, W - 2, 'Heading')
    this.sub = this.textRow(col, 40, 500, 3.4, W - 3, 'Sub')
    this.sub.textFill.color = this.tint(this.ink, 0.92)
    this.hint = this.textRow(col, 30, 600, 1.8, W - 3, 'Hint')
    this.hint.textFill.color = this.gold

    const rowH = 4.6
    // One flex slot holds the three alternative button rows stacked at the same spot; only one is
    // enabled at a time, so hidden rows never take layout space.
    this.flexChild(col, {w: W - 2, h: rowH}, (slot) => {
      this.rows.welcome = this.obj(slot, 'WelcomeRow')
      const welcome = this.flexRow(this.rows.welcome, W - 2, rowH, {gap: 0.8, justify: FlexJustify.Center, align: FlexAlign.Center})
      const bw = (W - 2 - 0.8) / 2
      this.button(welcome, 'surface', 'Place on a table', ICON_TOUCH, bw, rowH, true, () => this.onPlaceOnSurface.invoke())
      this.button(welcome, 'front', 'Place in front of me', ICON_PLAY, bw, rowH, false, () => this.onPlaceInFront.invoke())
      this.rows.placing = this.obj(slot, 'PlacingRow')
      const placing = this.flexRow(this.rows.placing, W - 2, rowH, {gap: 0.8, justify: FlexJustify.Center, align: FlexAlign.Center})
      this.button(placing, 'frontAlt', 'Place in front of me', ICON_PLAY, bw, rowH, true, () => this.onPlaceInFront.invoke())
      this.button(placing, 'cancel', 'Back', ICON_CLOSE, bw * 0.7, rowH, false, () => this.onCancelPlacing.invoke())
      this.rows.rescue = this.obj(slot, 'RescueRow')
      const rescue = this.flexRow(this.rows.rescue, W - 2, rowH, {gap: 0.8, justify: FlexJustify.Center, align: FlexAlign.Center})
      this.button(rescue, 'recenter', 'Bring it here', ICON_CENTER, (W - 2) * 0.6, rowH, true, () => this.onRecenter.invoke())
    })
    this.ready = true
    this.setMode(this.mode)
  }

  private update(): void {
    if (!this.sceneObject.enabled) return
    const cam = WorldCameraFinderProvider.getInstance().getComponent().getTransform()
    const camPos = cam.getWorldPosition()
    const fwd = cam.getWorldRotation().multiplyVec3(new vec3(0, 0, -1))
    const flat = new vec3(fwd.x, 0, fwd.z)
    const dir = flat.length > 0.001 ? flat.normalize() : new vec3(0, 0, -1)
    const want = camPos.add(dir.uniformScale(this.distance)).add(new vec3(0, -this.drop, 0))
    const wantRot = quat.angleAxis(Math.atan2(dir.x, dir.z) + Math.PI, vec3.up())
    const t = this.sceneObject.getTransform()
    if (this.snap || !this.targetPos) {
      this.snap = false
      this.targetPos = want
      this.targetRot = wantRot
      t.setWorldPosition(want)
      t.setWorldRotation(wantRot)
      return
    }
    // Only chase when the card has drifted well out of the comfortable zone.
    if (want.distance(this.targetPos) > 22) {
      this.targetPos = want
      this.targetRot = wantRot
    }
    const dt = getDeltaTime()
    const k = smoothing(dt, 3.5)
    t.setWorldPosition(lerpVec(t.getWorldPosition(), this.targetPos, k))
    t.setWorldRotation(quat.slerp(t.getWorldRotation(), this.targetRot as quat, k))
  }

  // ---------------------------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------------------------

  private button(row: SceneObject, id: string, label: string, icon: Texture, w: number, h: number, primary: boolean, fn: () => void): void {
    this.flexChild(row, {w, h}, (holder) => {
      const child = this.obj(holder, 'IB_' + id)
      const b = child.createComponent(Button.getTypeName()) as Button
      b.size = new vec3(w, h, 1)
      b.visual = this.buttonVisual(child, primary)
      b.initialize()
      const iconObject = this.obj(child, 'Icon', new vec3(-w / 2 + 1.6, 0, 0.12))
      const img = iconObject.createComponent('Component.Image') as Image
      img.mainMaterial = IMAGE_MATERIAL_ASSET.clone()
      img.mainPass.baseTex = icon
      img.mainPass.baseColor = primary ? this.gold : this.ink
      img.stretchMode = StretchMode.Stretch
      iconObject.getTransform().setLocalScale(new vec3(1.9, 1.9, 1))
      const labelObj = this.obj(child, 'Label', new vec3(0, 0, 0.12))
      const t = this.makeText(labelObj, 34, 600, w - 3.4, h - 0.8)
      t.layoutRect = Rect.create(-w / 2 + 3.0, w / 2 - 0.5, -h / 2 + 0.3, h / 2 - 0.3)
      t.text = label
      b.onTriggerUp.add(() => fn())
      this.buttons[id] = {object: child, label: t, icon: img}
    })
  }

  private buttonVisual(parent: SceneObject, primary: boolean): RoundedRectangleVisual {
    const fill = primary ? new vec4(0.05, 0.3, 0.3, 1) : this.tint(this.surface, 1.6)
    const edge = primary ? this.gold : this.tint(this.cyan, 0.8)
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
      toggledDefault: state(fill, this.gold, 0.2),
      toggledHovered: state(this.tint(fill, 1.6), this.cyan, 0.22),
      toggledTriggered: state(this.tint(fill, 2.2), this.gold, 0.3),
    }
    const visual = new RoundedRectangleVisual({sceneObject: parent, style, transparent: false})
    visual.cornerRadius = 1.1
    return visual
  }

  private rect(host: SceneObject, w: number, h: number, fill: vec4, border: vec4, radius: number, borderSize: number): RoundedRectangle {
    const shape = host.createComponent(RoundedRectangle.getTypeName()) as RoundedRectangle
    shape.size = new vec2(w, h)
    shape.cornerRadius = radius
    shape.gradient = false
    shape.backgroundColor = fill
    shape.opacity = 1
    shape.blendMode = RoundedRectBlendMode.Disabled
    shape.border = borderSize > 0
    shape.borderType = 'Color'
    shape.borderSize = Math.max(0.01, borderSize)
    shape.borderColor = border
    shape.initialize()
    return shape
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

  private makeText(parent: SceneObject, size: number, weight: number, w: number, h: number): Text {
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
    t.layoutRect = Rect.create(-w / 2, w / 2, -h / 2, h / 2)
    return t
  }

  private textRow(parent: SceneObject, size: number, weight: number, h: number, w: number, name: string): Text {
    let result!: Text
    this.flexChild(parent, {w, h}, (child) => {
      child.name = name
      result = this.makeText(child, size, weight, w, h)
    })
    return result
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

  private flexColumn(parent: SceneObject, w: number, h: number, opts?: {gap?: number; justify?: FlexJustify; align?: FlexAlign}): SceneObject {
    return this.makeFlex(parent, FlexDirection.Column, w, h, opts)
  }

  private flexRow(parent: SceneObject, w: number, h: number, opts?: {gap?: number; justify?: FlexJustify; align?: FlexAlign}): SceneObject {
    return this.makeFlex(parent, FlexDirection.Row, w, h, opts)
  }

  private makeFlex(parent: SceneObject, direction: FlexDirection, width: number, height: number, opts?: {gap?: number; justify?: FlexJustify; align?: FlexAlign}): SceneObject {
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
      f.justifyContent = opts?.justify ?? FlexJustify.Start
      f.alignItems = opts?.align ?? FlexAlign.Stretch
    })
    return container
  }

  private flexChild(parent: SceneObject, size: {w?: number; h?: number}, builder: (o: SceneObject) => void): SceneObject {
    const child = this.obj(parent, 'Item')
    this.liftInZ(child, 0.02)
    const item = child.createComponent(FlexItem.getTypeName()) as FlexItem
    if (size.w && size.w > 0) item.overrideWidth = size.w
    if (size.h && size.h > 0) item.overrideHeight = size.h
    item.flexGrow = 0
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
