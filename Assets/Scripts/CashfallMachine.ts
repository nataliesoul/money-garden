// Cashfall machine: the world-locked money machine. Builds every part from MeshBuilder geometry
// (CashfallShapes), owns the coin pool and all part animations, and exposes a small command API
// that CashfallMain drives. It holds no lesson state and makes no lesson decisions.
//
// Local frame: origin at the centre of the base, +Y up, +Z toward the viewer. Units cm.

import {Interactable} from 'SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable'
import {InteractableManipulation} from 'SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation'
import Event from 'SpectaclesInteractionKit.lspkg/Utils/Event'
import {MeshKit, RGB, dim, mixRGB} from './CashfallShapes'
import {Ease, Tweener, clamp, lerp, lerpVec} from './CashfallTween'
import {TaxResult, Op} from './CashfallModel'

export type MachineStage = 'hidden' | 'tax' | 'budget' | 'logic' | 'summary'

export const MACHINE_COLORS = {
  slate: [0.27, 0.31, 0.53] as RGB,
  slateTop: [0.37, 0.43, 0.68] as RGB,
  brass: [0.9, 0.7, 0.32] as RGB,
  mint: [0.45, 0.95, 0.65] as RGB,
  gold: [1.0, 0.78, 0.3] as RGB,
  coral: [1.0, 0.45, 0.5] as RGB,
  cyan: [0.36, 0.86, 1.0] as RGB,
  lavender: [0.72, 0.62, 1.0] as RGB,
  ivory: [0.93, 0.92, 0.86] as RGB,
  coin: [1.0, 0.8, 0.3] as RGB,
  coinRim: [0.72, 0.46, 0.12] as RGB,
  glass: [0.55, 0.75, 0.95] as RGB,
  off: [0.55, 0.28, 0.34] as RGB,
}

const RATE_COLORS: RGB[] = [MACHINE_COLORS.mint, MACHINE_COLORS.gold, MACHINE_COLORS.coral]
const JAR_COLORS: RGB[] = [MACHINE_COLORS.cyan, MACHINE_COLORS.lavender, MACHINE_COLORS.mint]
/** Slice capacities used to scale the terrace pools: 0-1000, 1000-3000, 3000-8000. */
const SLICE_CAP = [1000, 2000, 5000]

const HOPPER_POS = new vec3(0, 36, -12)
const TERRACE_POS = [new vec3(0, 31, -7), new vec3(0, 24, -2), new vec3(0, 17, 3)]
const TERRACE_TOP = [32.2, 25.2, 18.2]
const TUBE_POS = new vec3(17.5, 2, -6)
const TUBE_HEIGHT = 26
const BASIN_TAX = new vec3(0, 9, 6)
const BASIN_BUDGET = new vec3(0, 24, -6)
const JAR_X = [-14.5, 0, 14.5]
const JAR_Y = 9
const JAR_POS = JAR_X.map((x) => new vec3(x, JAR_Y, 8))
const COIN_R = 1.7
const COIN_H = 0.55
const JAR_COIN_R = 3.2
const JAR_COIN_H = 0.8
const GROWTH_POS = new vec3(21.5, 2, -2)
const TRACK_Z = 10
const TRACK_Y = 14
const CART_Y = TRACK_Y + 2.3
const CART_START = -16
const GATE_X = 3
const CART_END = 17
const LAMP_A = new vec3(-12, 22, -6)
const LAMP_B = new vec3(-1, 22, -6)

interface Flight {
  object: SceneObject
  points: vec3[]
  durations: number[]
  lift: number
  seg: number
  t: number
  delay: number
  done?: () => void
  spin: number
}

@component
export class CashfallMachine extends BaseScriptComponent {
  @ui.label('Cashfall / Machine')
  @ui.separator
  @input @hint('Unlit vertex-color material shared by all generated geometry') material!: Material
  @ui.group_start('Settings')
  @input @hint('Coins in flight at once') @widget(new SliderWidget(8, 32, 1)) coinPool: number = 20
  @input @hint('Seconds a coin takes per terrace hop') @widget(new SliderWidget(0.2, 0.8, 0.05)) hopSeconds: number = 0.42
  @input @hint('Draw the grab collider for the basin coin') debugColliders: boolean = false
  @ui.group_end

  /** Jar index (0-2) the grabbed coin was released over, or -1. */
  public onCoinDropped = new Event<number>()
  /** Jar index the user pinched directly. */
  public onJarTapped = new Event<number>()
  public onJarHover = new Event<number>()
  public onGrabStart = new Event<void>()

  public stage: MachineStage = 'hidden'
  public ready = false

  private kit!: MeshKit
  private tw = new Tweener()
  private time = 0
  private anchors: {[k: string]: SceneObject} = {}
  private assembleParts: SceneObject[] = []
  private roots: {[k: string]: SceneObject} = {}

  private taxRoot!: SceneObject
  private budgetRoot!: SceneObject
  private logicRoot!: SceneObject
  private basin!: SceneObject
  private basinPool!: SceneObject
  private basinStack!: SceneObject
  private basinTarget: vec3 = BASIN_TAX
  private pools: SceneObject[] = []
  private poolTax: SceneObject[] = []
  private tubeFill!: SceneObject
  private terraces: SceneObject[] = []
  private terraceHighlight = -1

  private jars: SceneObject[] = []
  private jarStacks: SceneObject[] = []
  private jarGuides: SceneObject[] = []
  private jarHover: number[] = [0, 0, 0]
  private grabCoin!: SceneObject
  private grabCollider!: ColliderComponent
  private grabInteract!: Interactable
  private grabDrag!: InteractableManipulation
  private grabbing = false
  private grabEnabled = false
  private grabHome = new vec3(0, 33, -6)
  private bill!: SceneObject
  private growth!: SceneObject
  private growthScale = 0

  private lampsOn: SceneObject[] = []
  private lampsOff: SceneObject[] = []
  private gateBar!: SceneObject
  private gateOpen = false
  private cart!: SceneObject
  private cartWheels: SceneObject[] = []
  private opBadge: SceneObject[] = []

  private coins: SceneObject[] = []
  private flights: Flight[] = []
  private streamTimer = 0
  private streamRate = 0
  private streamTax: TaxResult | null = null
  private streamCounter = 0

  onAwake(): void {
    this.createEvent('OnStartEvent').bind(() => this.build())
    this.createEvent('UpdateEvent').bind(() => this.update())
  }

  // ---------------------------------------------------------------------------------------------
  // Build
  // ---------------------------------------------------------------------------------------------

  private obj(parent: SceneObject, name: string, p?: vec3): SceneObject {
    const o = global.scene.createSceneObject(name)
    o.setParent(parent)
    if (p) o.getTransform().setLocalPosition(p)
    return o
  }

  private anchor(name: string, parent: SceneObject, p: vec3): SceneObject {
    const o = this.obj(parent, 'Anchor_' + name, p)
    this.anchors[name] = o
    return o
  }

  getAnchor(name: string): SceneObject {
    return this.anchors[name] || this.sceneObject
  }

  /**
   * Machine-local position of an anchor, summed from local positions up the chain. Ignores scale on
   * purpose: parts are often mid pop-in (scale 0.001) when labels are placed, which would collapse
   * every world position onto the root.
   */
  anchorPosition(name: string): vec3 {
    const a = this.anchors[name]
    if (!a) return vec3.zero()
    let p = vec3.zero()
    let o: SceneObject | null = a
    let guard = 0
    while (o && !isNull(o) && o !== this.sceneObject && guard++ < 12) {
      p = p.add(o === this.basin ? this.basinTarget : o.getTransform().getLocalPosition())
      o = o.hasParent() ? o.getParent() : null
    }
    return p
  }

  private build(): void {
    if (!this.material) {
      print('CashfallMachine: material input missing')
      return
    }
    const C = MACHINE_COLORS
    this.kit = new MeshKit(this.material)
    const root = this.sceneObject

    // Base and gantry frame.
    const frame = this.obj(root, 'Frame')
    this.roots.frame = frame
    this.kit.slab(frame, 'Base', 46, 2, 32, 3, C.slate, new vec3(0, 1, 0), 0.58, C.slateTop)
    this.kit.slab(frame, 'BaseInlay', 40, 0.3, 26, 2.4, dim(C.slateTop, 0.85), new vec3(0, 2.1, 0), 0.62)
    this.kit.box(frame, 'PillarL', new vec3(3, 44, 3), C.slate, new vec3(-21.5, 24, -14.5))
    this.kit.box(frame, 'PillarR', new vec3(3, 44, 3), C.slate, new vec3(21.5, 24, -14.5))
    this.kit.box(frame, 'Crossbar', new vec3(46, 2.4, 3), C.slateTop, new vec3(0, 46, -14.5))
    this.kit.box(frame, 'Hanger', new vec3(2, 4, 2), C.brass, new vec3(0, 44, -12))
    this.assembleParts.push(frame)

    // ---- Tax stage -------------------------------------------------------------------------
    this.taxRoot = this.obj(root, 'TaxStage')
    const hopper = this.obj(this.taxRoot, 'Hopper', HOPPER_POS)
    this.kit.lathe(
      hopper,
      'Funnel',
      [
        [2.6, -0.4],
        [2.6, 0],
        [7.8, 7.4],
        [8.3, 7.4],
        [8.3, 8.2],
        [7.5, 8.2],
        [7.5, 7.6],
        [2.2, 0.8],
        [2.2, -0.4],
      ],
      C.brass,
      {segments: 36, flat: 0.6}
    )
    this.kit.lathe(hopper, 'Lip', [[8.4, 7.2], [8.9, 7.8], [8.4, 8.4]], C.gold, {segments: 36, flat: 0.7})
    this.anchor('hopper', hopper, new vec3(0, 12, 0))
    this.assembleParts.push(hopper)

    for (let i = 0; i < 3; i++) {
      const t = this.obj(this.taxRoot, 'Terrace' + i, TERRACE_POS[i])
      const col = RATE_COLORS[i]
      this.kit.slab(t, 'Step', 14, 2.4, 9, 1.2, dim(C.slate, 1.1), new vec3(0, 0, 0), 0.58, mixRGB(C.slateTop, col, 0.35))
      this.kit.box(t, 'Lip', new vec3(14, 0.7, 0.7), col, new vec3(0, 1.2, 4.6))
      this.kit.box(t, 'Riser', new vec3(14, 5, 0.8), dim(C.slate, 0.9), new vec3(0, -3.6, -4.1))
      // Pool: the slice of pay that lands on this step. Retained part in the step colour, taxed part coral.
      const pool = this.kit.lathe(t, 'Pool', [[0, 0], [5.4, 0], [5.4, 1], [0, 1]], col, {segments: 28, sx: 1.15, sz: 0.7, flat: 0.7}, new vec3(0, 1.2, 0))
      pool.getTransform().setLocalScale(new vec3(1, 0.001, 1))
      const taxPart = this.kit.lathe(t, 'PoolTax', [[0, 0], [5.4, 0], [5.4, 1], [0, 1]], C.coral, {segments: 28, sx: 1.15, sz: 0.7, flat: 0.72}, new vec3(0, 1.2, 0))
      taxPart.getTransform().setLocalScale(new vec3(1, 0.001, 1))
      this.pools.push(pool)
      this.poolTax.push(taxPart)
      this.terraces.push(t)
      this.anchor('terrace' + i, t, new vec3(-11.5, 2.5, 0))
      this.assembleParts.push(t)
    }

    // Tax tube: an open cage of ribs with a coral fill rising inside.
    const tube = this.obj(this.taxRoot, 'TaxTube', TUBE_POS)
    this.kit.ring(tube, 'Foot', 3.6, 4.8, 0.8, C.slateTop, new vec3(0, 0, 0))
    this.kit.ring(tube, 'Collar', 3.6, 4.6, 0.6, C.coral, new vec3(0, TUBE_HEIGHT, 0))
    this.kit.ring(tube, 'Mid', 3.9, 4.3, 0.3, dim(C.glass, 0.8), new vec3(0, TUBE_HEIGHT * 0.5, 0))
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      const rib = this.kit.box(tube, 'Rib' + i, new vec3(0.5, TUBE_HEIGHT, 0.5), C.glass, new vec3(Math.cos(a) * 4.1, TUBE_HEIGHT / 2, Math.sin(a) * 4.1), 0.62)
      rib.getTransform().setLocalRotation(quat.angleAxis(-a, vec3.up()))
    }
    this.tubeFill = this.kit.cylinder(tube, 'Fill', 3.4, 0, 1, C.coral, {segments: 28, flat: 0.72}, new vec3(0, 0.8, 0))
    this.tubeFill.getTransform().setLocalScale(new vec3(1, 0.001, 1))
    this.anchor('tube', tube, new vec3(0, TUBE_HEIGHT + 5, 0))
    this.assembleParts.push(tube)

    // Pedestal that lifts the basin into view above the console during the tax stage.
    this.kit.cylinder(this.taxRoot, 'BasinPedestal', 6.8, 2, BASIN_TAX.y, dim(C.slate, 1.05), {segments: 32}, new vec3(0, 0, BASIN_TAX.z))
    this.kit.ring(this.taxRoot, 'PedestalRing', 6.6, 7.6, 0.5, C.cyan, new vec3(0, BASIN_TAX.y - 0.5, BASIN_TAX.z))

    // ---- Basin (shared between tax and budget) --------------------------------------------
    this.basin = this.obj(root, 'Basin', BASIN_TAX)
    this.kit.lathe(
      this.basin,
      'Bowl',
      [
        [0, 0],
        [8.2, 0],
        [9.3, 1.2],
        [9.8, 5.2],
        [9.2, 5.9],
        [8.5, 5.9],
        [8.3, 5.3],
        [8.0, 1.3],
        [0, 1.3],
      ],
      C.cyan,
      {segments: 40, flat: 0.56}
    )
    this.kit.ring(this.basin, 'BasinRim', 8.6, 9.9, 0.35, mixRGB(C.cyan, C.ivory, 0.5), new vec3(0, 5.9, 0))
    this.basinPool = this.kit.cylinder(this.basin, 'TakeHomePool', 7.9, 0, 1, C.coin, {segments: 36, flat: 0.7}, new vec3(0, 1.35, 0))
    this.basinPool.getTransform().setLocalScale(new vec3(1, 0.001, 1))
    this.basinStack = this.obj(this.basin, 'BasinCoins', new vec3(0, 1.4, 0))
    this.anchor('basin', this.basin, new vec3(0, 9.5, 0))
    this.assembleParts.push(this.basin)

    // ---- Budget stage ----------------------------------------------------------------------
    this.budgetRoot = this.obj(root, 'BudgetStage')
    this.kit.slab(this.budgetRoot, 'Shelf', 42, JAR_Y - 2, 15, 2, C.slate, new vec3(0, (JAR_Y + 2) / 2, 8), 0.58, C.slateTop)
    this.kit.box(this.budgetRoot, 'ShelfTrim', new vec3(42, 0.5, 0.6), C.cyan, new vec3(0, JAR_Y - 0.25, 15.4))
    for (let j = 0; j < 3; j++) {
      const jar = this.obj(this.budgetRoot, 'Jar' + j, JAR_POS[j])
      const col = JAR_COLORS[j]
      this.kit.lathe(
        jar,
        'Cup',
        [
          [0, 0],
          [5.0, 0],
          [5.8, 0.7],
          [6.0, 4.0],
          [5.3, 4.5],
          [4.7, 4.5],
          [4.7, 0.9],
          [0, 0.9],
        ],
        col,
        {segments: 36, flat: 0.56}
      )
      this.kit.ring(jar, 'JarRim', 4.8, 6.2, 0.35, mixRGB(col, C.ivory, 0.45), new vec3(0, 4.5, 0))
      this.kit.shadow(jar, 'JarShadow', 6.6, dim(C.slate, 0.6), new vec3(0.4, 0.12, -0.3))
      const stack = this.obj(jar, 'Coins', new vec3(0, 3.1, 0))
      this.jarStacks.push(stack)
      const guide = this.kit.ring(jar, 'Guide', 4.0, 4.5, 0.25, C.ivory, new vec3(0, 3, 0))
      this.jarGuides.push(guide)
      this.kit.pipe(this.budgetRoot, 'Channel' + j, new vec3(0, BASIN_BUDGET.y + 1, BASIN_BUDGET.z), new vec3(JAR_X[j], JAR_Y + 10.5, 7.5), 1.1, dim(C.slate, 1.15))
      const col3 = jar.createComponent('Physics.ColliderComponent') as ColliderComponent
      const shape = Shape.createBoxShape()
      shape.size = new vec3(12.5, 12, 12.5)
      col3.shape = shape
      col3.debugDrawEnabled = this.debugColliders
      jar.getTransform().setLocalPosition(JAR_POS[j].add(new vec3(0, 0, 0)))
      const inter = jar.createComponent(Interactable.getTypeName()) as Interactable
      inter.targetingMode = 3
      const idx = j
      inter.onTriggerEnd.add(() => {
        if (!this.grabbing && this.stage === 'budget') this.onJarTapped.invoke(idx)
      })
      inter.onHoverEnter.add(() => {
        this.jarHover[idx] = 1
        if (this.stage === 'budget') this.onJarHover.invoke(idx)
      })
      inter.onHoverExit.add(() => {
        this.jarHover[idx] = 0
      })
      this.jars.push(jar)
      this.anchor('jar' + j, jar, new vec3(0, 15, 0))
      this.assembleParts.push(jar)
    }

    // Grabbable coin hovering over the basin.
    this.grabCoin = this.obj(this.budgetRoot, 'GrabCoin', this.grabHome)
    const gc = this.kit.coin(this.grabCoin, 'Visual', 3.4, 0.9, C.coin, C.coinRim)
    gc.getTransform().setLocalRotation(quat.fromEulerAngles(Math.PI / 2, 0, 0))
    this.grabCollider = this.grabCoin.createComponent('Physics.ColliderComponent') as ColliderComponent
    const gshape = Shape.createBoxShape()
    gshape.size = new vec3(8, 8, 5)
    this.grabCollider.shape = gshape
    this.grabCollider.debugDrawEnabled = this.debugColliders
    this.grabInteract = this.grabCoin.createComponent(Interactable.getTypeName()) as Interactable
    this.grabInteract.targetingMode = 3
    this.grabDrag = this.grabCoin.createComponent(InteractableManipulation.getTypeName()) as InteractableManipulation
    this.grabDrag.setCanRotate(false)
    this.grabDrag.setCanScale(false)
    this.grabDrag.onManipulationStart.add(() => {
      this.grabbing = true
      this.onGrabStart.invoke()
    })
    this.grabDrag.onManipulationEnd.add(() => {
      this.grabbing = false
      const p = this.grabCoin.getTransform().getLocalPosition()
      let closest = -1
      let best = 1e9
      for (let j = 0; j < 3; j++) {
        const q = JAR_POS[j]
        const d = Math.sqrt((p.x - q.x) * (p.x - q.x) + (p.z - q.z) * (p.z - q.z)) + Math.max(0, p.y - (JAR_Y + 20)) * 0.5
        if (d < best) {
          best = d
          closest = j
        }
      }
      if (best > 11) closest = -1
      this.resetGrabCoin()
      this.onCoinDropped.invoke(closest)
    })
    this.anchor('grab', this.grabCoin, new vec3(0, 6, 0))
    this.setGrabbable(false)

    // Surprise bill: a coral card that drops onto the SAVE jar.
    this.bill = this.obj(this.budgetRoot, 'Bill', new vec3(JAR_X[2], 42, 8))
    this.kit.slab(this.bill, 'Card', 9, 0.8, 6, 0.8, C.coral, new vec3(0, 0, 0), 0.66, mixRGB(C.coral, C.ivory, 0.3))
    this.kit.box(this.bill, 'Stripe', new vec3(6, 0.3, 0.8), C.ivory, new vec3(0, 0.5, -1.2))
    this.kit.box(this.bill, 'Stripe2', new vec3(4, 0.3, 0.8), C.ivory, new vec3(-1, 0.5, 0.6))
    this.bill.enabled = false
    this.anchor('bill', this.bill, new vec3(0, 4, 0))

    // Growth column: a stack of coins that rises during the compound-growth reveal.
    this.growth = this.obj(this.budgetRoot, 'Growth', GROWTH_POS)
    const ridge: number[][] = [[0, 0], [3.2, 0]]
    for (let i = 0; i < 36; i++) {
      const y = i * 0.8
      ridge.push([3.2, y + 0.62], [2.9, y + 0.7], [3.2, y + 0.8])
    }
    ridge.push([3.2, 36 * 0.8], [0, 36 * 0.8])
    this.kit.lathe(this.growth, 'Column', ridge, C.coin, {segments: 28, flat: 0.64})
    this.kit.ring(this.growth, 'GrowthFoot', 3.3, 4.6, 0.5, C.mint, new vec3(0, 0, 0))
    this.growth.getTransform().setLocalScale(new vec3(1, 0.001, 1))
    this.growth.enabled = false
    this.anchor('growth', this.growth, new vec3(0, 0, 0))

    // ---- Logic stage -----------------------------------------------------------------------
    this.logicRoot = this.obj(root, 'LogicStage')
    for (const sx of [-15, 1, 16]) this.kit.box(this.logicRoot, 'TrackSupport', new vec3(2.4, TRACK_Y - 2, 2.4), dim(C.slate, 1.05), new vec3(sx, (TRACK_Y + 2) / 2, TRACK_Z))
    const track = this.obj(this.logicRoot, 'Track', new vec3(0, TRACK_Y, TRACK_Z))
    this.kit.slab(track, 'Rail', 40, 1, 7, 0.8, dim(C.slate, 1.25), new vec3(0, 0.5, 0), 0.6, mixRGB(C.slateTop, C.ivory, 0.25))
    this.kit.box(track, 'EdgeL', new vec3(40, 0.5, 0.5), C.cyan, new vec3(0, 1.1, -3.3))
    this.kit.box(track, 'EdgeR', new vec3(40, 0.5, 0.5), C.cyan, new vec3(0, 1.1, 3.3))
    this.kit.slab(track, 'StartPad', 8, 0.4, 7.6, 1, dim(C.lavender, 0.9), new vec3(CART_START, 1.1, 0), 0.7)
    this.kit.slab(track, 'EndPad', 8, 0.4, 7.6, 1, C.mint, new vec3(CART_END, 1.1, 0), 0.7)
    this.assembleParts.push(track)

    const gate = this.obj(this.logicRoot, 'Gate', new vec3(GATE_X, TRACK_Y, TRACK_Z))
    this.kit.box(gate, 'PostL', new vec3(1.6, 12, 1.6), C.ivory, new vec3(0, 6, -4.6))
    this.kit.box(gate, 'PostR', new vec3(1.6, 12, 1.6), C.ivory, new vec3(0, 6, 4.6))
    this.kit.box(gate, 'Header', new vec3(2.4, 2.2, 11.4), C.slateTop, new vec3(0, 12.6, 0))
    this.gateBar = this.obj(gate, 'Bar', new vec3(0, 4.0, 0))
    this.kit.box(this.gateBar, 'BarMesh', new vec3(1.2, 1.4, 9), C.coral, new vec3(0, 0, 0), 0.7)
    this.kit.box(this.gateBar, 'BarStripe', new vec3(1.3, 0.5, 9), C.ivory, new vec3(0, 0, 0), 0.8)
    this.anchor('gate', gate, new vec3(0, 17.5, 0))
    this.assembleParts.push(gate)

    const lampPositions = [LAMP_A, LAMP_B]
    for (let i = 0; i < 2; i++) {
      const lamp = this.obj(this.logicRoot, 'Lamp' + (i === 0 ? 'A' : 'B'), lampPositions[i])
      this.kit.cylinder(lamp, 'Post', 0.7, -(lampPositions[i].y - 2), 0, C.slateTop, {segments: 12})
      this.kit.ring(lamp, 'LampFoot', 0.9, 2.6, 0.5, C.slateTop, new vec3(0, -(lampPositions[i].y - 2), 0))
      const sphere: number[][] = []
      for (let s = 0; s <= 10; s++) {
        const a = -Math.PI / 2 + (s / 10) * Math.PI
        sphere.push([Math.cos(a) * 2.6, Math.sin(a) * 2.6 + 2.6])
      }
      const on = this.kit.lathe(lamp, 'On', sphere, C.mint, {segments: 24, flat: 0.8})
      const off = this.kit.lathe(lamp, 'Off', sphere, C.off, {segments: 24, flat: 0.5})
      on.enabled = false
      this.lampsOn.push(on)
      this.lampsOff.push(off)
      this.kit.pipe(this.logicRoot, 'Wire' + i, new vec3(lampPositions[i].x, 2.6, lampPositions[i].z), new vec3(GATE_X, TRACK_Y + 0.6, TRACK_Z - 4.6), 0.35, C.cyan)
      this.anchor('lamp' + (i === 0 ? 'A' : 'B'), lamp, new vec3(0, 7.5, 0))
      this.assembleParts.push(lamp)
    }

    this.cart = this.obj(this.logicRoot, 'Cart', new vec3(CART_START, CART_Y, TRACK_Z))
    this.kit.box(this.cart, 'Body', new vec3(6, 2.4, 4.6), C.gold, new vec3(0, 0.2, 0), 0.62, mixRGB(C.gold, C.ivory, 0.3))
    this.kit.box(this.cart, 'Cargo', new vec3(3.6, 2.2, 3), C.lavender, new vec3(0, 2.5, 0), 0.66)
    this.kit.box(this.cart, 'Bumper', new vec3(0.6, 1.4, 4.8), C.ivory, new vec3(3.2, 0, 0))
    for (let w = 0; w < 4; w++) {
      const wheel = this.kit.cylinder(this.cart, 'Wheel' + w, 0.9, -0.25, 0.25, C.slateTop, {segments: 12}, new vec3(w < 2 ? -1.9 : 1.9, -1.3, w % 2 === 0 ? -2.5 : 2.5))
      wheel.getTransform().setLocalRotation(quat.fromEulerAngles(Math.PI / 2, 0, 0))
      this.cartWheels.push(wheel)
    }
    this.anchor('cart', this.cart, new vec3(0, 6.5, 0))
    this.assembleParts.push(this.cart)

    // Coin pool for flights.
    const coinRoot = this.obj(root, 'CoinPool')
    for (let i = 0; i < this.coinPool; i++) {
      const c = this.kit.coin(coinRoot, 'Coin' + i, COIN_R, COIN_H, C.coin, C.coinRim)
      c.enabled = false
      this.coins.push(c)
    }

    this.taxRoot.enabled = false
    this.budgetRoot.enabled = false
    this.logicRoot.enabled = false
    this.basin.enabled = false
    frame.enabled = false
    this.ready = true
  }

  // ---------------------------------------------------------------------------------------------
  // Stage control
  // ---------------------------------------------------------------------------------------------

  /** Pops every part in with a stagger. Call once after placement. */
  assemble(done?: () => void): void {
    if (!this.ready) return
    this.roots.frame.enabled = true
    this.popIn(this.roots.frame, 0)
    if (done) this.tw.delay(0.6, done)
  }

  private popIn(o: SceneObject, delay: number, scale: number = 1): void {
    o.enabled = true
    const t = o.getTransform()
    t.setLocalScale(new vec3(0.001, 0.001, 0.001))
    this.tw.delay(delay, () => {
      this.tw.to(0.5, (k) => t.setLocalScale(new vec3(scale * k, scale * k, scale * k)), Ease.outBack, undefined, 'pop')
    })
  }

  private popOut(o: SceneObject, done?: () => void): void {
    if (!o.enabled) {
      if (done) done()
      return
    }
    const t = o.getTransform()
    const s = t.getLocalScale().x
    this.tw.to(
      0.28,
      (k) => t.setLocalScale(new vec3(s * (1 - k) + 0.001, s * (1 - k) + 0.001, s * (1 - k) + 0.001)),
      Ease.inQuad,
      () => {
        o.enabled = false
        t.setLocalScale(vec3.one())
        if (done) done()
      },
      'pop'
    )
  }

  setStage(stage: MachineStage, instant: boolean = false): void {
    if (!this.ready || stage === this.stage) return
    const prev = this.stage
    this.stage = stage
    this.clearFlights()
    this.streamRate = 0
    this.setGrabbable(false)
    const wantTax = stage === 'tax'
    const wantBudget = stage === 'budget' || stage === 'summary'
    const wantLogic = stage === 'logic'
    const wantBasin = stage === 'tax' || stage === 'budget'
    const swap = (o: SceneObject, want: boolean, delay: number) => {
      if (want && !o.enabled) {
        if (instant) {
          o.enabled = true
          o.getTransform().setLocalScale(vec3.one())
        } else this.popIn(o, delay)
      } else if (!want && o.enabled) {
        if (instant) o.enabled = false
        else this.popOut(o)
      }
    }
    swap(this.taxRoot, wantTax, 0.1)
    swap(this.budgetRoot, wantBudget, 0.1)
    swap(this.logicRoot, wantLogic, 0.1)
    if (stage !== 'summary') {
      this.growth.enabled = false
      this.growth.getTransform().setLocalScale(new vec3(1, 0.001, 1))
    }
    this.bill.enabled = false
    // Basin: visible in tax and budget, moves between its two homes.
    if (wantBasin) {
      const target = stage === 'tax' ? BASIN_TAX : BASIN_BUDGET
      this.basinTarget = target
      if (!this.basin.enabled) {
        this.basin.getTransform().setLocalPosition(target)
        if (instant) {
          this.basin.enabled = true
          this.basin.getTransform().setLocalScale(vec3.one())
        } else this.popIn(this.basin, 0.05)
      } else {
        const t = this.basin.getTransform()
        const from = t.getLocalPosition()
        if (instant) t.setLocalPosition(target)
        else this.tw.to(0.7, (k) => t.setLocalPosition(lerpVec(from, target, k)), Ease.inOutCubic, undefined, 'basin')
      }
    } else if (this.basin.enabled) {
      if (instant) this.basin.enabled = false
      else this.popOut(this.basin)
    }
    if (prev === 'hidden' && stage !== 'hidden' && !this.roots.frame.enabled) {
      this.roots.frame.enabled = true
      this.roots.frame.getTransform().setLocalScale(vec3.one())
    }
    if (stage === 'hidden') {
      this.roots.frame.enabled = false
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Tax stage commands
  // ---------------------------------------------------------------------------------------------

  /** Updates pools, tube fill and basin level. `flow` adds a coin burst along the stairs. */
  setTax(r: TaxResult, animate: boolean = true, flow: boolean = true): void {
    if (!this.ready) return
    this.streamTax = r
    for (let i = 0; i < 3; i++) {
      const s = r.slices[i]
      const frac = clamp(s.amount / SLICE_CAP[i], 0, 1)
      const height = 0.2 + frac * 3.6
      const taxH = height * s.rate
      const keepH = height - taxH
      this.scaleY(this.pools[i], Math.max(0.001, keepH), animate)
      const taxT = this.poolTax[i].getTransform()
      const taxFrom = taxT.getLocalPosition()
      const taxTo = new vec3(0, 1.2 + keepH, 0)
      this.poolTax[i].enabled = taxH > 0.02
      if (animate) this.tw.to(0.6, (k) => taxT.setLocalPosition(lerpVec(taxFrom, taxTo, k)), Ease.outCubic, undefined, 'pool')
      else taxT.setLocalPosition(taxTo)
      this.scaleY(this.poolTax[i], Math.max(0.001, taxH), animate)
    }
    const tubeFrac = clamp(r.tax / 1500, 0, 1)
    this.scaleY(this.tubeFill, Math.max(0.001, 0.4 + tubeFrac * (TUBE_HEIGHT - 1.6)), animate)
    const basinFrac = clamp(r.takeHome / 6500, 0, 1)
    this.scaleY(this.basinPool, Math.max(0.001, 0.2 + basinFrac * 3.6), animate)
    if (flow && this.stage === 'tax') this.burst(r, 12)
  }

  /** Continuous trickle of coins while the tax stage is up. rate = coins per second (0 stops). */
  setStream(rate: number): void {
    this.streamRate = rate
  }

  /** A one-off cascade of n coins following the slice rates. */
  burst(r: TaxResult, n: number): void {
    for (let i = 0; i < n; i++) this.launchCoin(r, i * 0.09, this.streamCounter++)
  }

  private scaleY(o: SceneObject, h: number, animate: boolean): void {
    const t = o.getTransform()
    const from = t.getLocalScale().y
    if (!animate) {
      t.setLocalScale(new vec3(1, h, 1))
      return
    }
    this.tw.to(0.6, (k) => t.setLocalScale(new vec3(1, lerp(from, h, k), 1)), Ease.outCubic, undefined, 'pool')
  }

  /** Brightens one terrace (scale pulse) and dims the others; -1 clears. */
  highlightTerrace(i: number): void {
    this.terraceHighlight = i
    for (let t = 0; t < 3; t++) {
      const tr = this.terraces[t].getTransform()
      const target = t === i ? 1.06 : 1
      const from = tr.getLocalScale().x
      this.tw.to(0.3, (k) => tr.setLocalScale(new vec3(lerp(from, target, k), lerp(from, target, k), lerp(from, target, k))), Ease.outBack, undefined, 'terrace' + t)
    }
  }

  private launchCoin(r: TaxResult, delay: number, index: number): void {
    const coin = this.freeCoin()
    if (!coin) return
    // Decide which slice this coin belongs to by cycling through the slices proportionally,
    // then whether it is skimmed by that slice's rate.
    const total = Math.max(1, r.gross)
    const u = ((index * 0.6180339887) % 1) * total
    let slice = 0
    let acc = 0
    for (let i = 0; i < 3; i++) {
      acc += r.slices[i].amount
      if (u < acc) {
        slice = i
        break
      }
      slice = i
    }
    const skim = r.slices[slice].rate > 0 && ((index * 7) % 10) / 10 < r.slices[slice].rate
    const points: vec3[] = [HOPPER_POS.add(new vec3(0, -1, 0))]
    const durations: number[] = []
    const jitter = ((index % 5) - 2) * 1.1
    for (let i = 0; i <= slice; i++) {
      points.push(new vec3(jitter, TERRACE_TOP[i] + COIN_H, TERRACE_POS[i].z + (i === slice ? 0 : 3.5)))
      durations.push(this.hopSeconds)
    }
    if (skim) {
      points.push(new vec3(7, TERRACE_TOP[slice] + 1.5, TERRACE_POS[slice].z))
      durations.push(this.hopSeconds * 0.7)
      points.push(new vec3(TUBE_POS.x, TUBE_HEIGHT + 2, TUBE_POS.z))
      durations.push(this.hopSeconds * 1.4)
      points.push(new vec3(TUBE_POS.x, 2, TUBE_POS.z))
      durations.push(this.hopSeconds * 0.9)
    } else {
      for (let i = slice + 1; i < 3; i++) {
        points.push(new vec3(jitter, TERRACE_TOP[i] + COIN_H, TERRACE_POS[i].z + 3.5))
        durations.push(this.hopSeconds)
      }
      points.push(new vec3(jitter * 0.5, BASIN_TAX.y + 2.2, BASIN_TAX.z))
      durations.push(this.hopSeconds * 1.1)
    }
    this.flights.push({object: coin, points, durations, lift: 3, seg: 0, t: 0, delay, spin: 1 + (index % 3)})
  }

  /** Raise demo: a small extra cascade with a visible change in the top pool. */
  runRaise(before: TaxResult, after: TaxResult, done?: () => void): void {
    this.setTax(after, true, false)
    this.burst(after, 8)
    this.highlightTerrace(2)
    this.tw.delay(2.2, () => {
      this.highlightTerrace(-1)
      if (done) done()
    })
  }

  // ---------------------------------------------------------------------------------------------
  // Budget stage commands
  // ---------------------------------------------------------------------------------------------

  private rebuildStack(parent: SceneObject, count: number, r: number, h: number): void {
    while (parent.getChildrenCount() > count) parent.getChild(parent.getChildrenCount() - 1).destroy()
    while (parent.getChildrenCount() < count) {
      const i = parent.getChildrenCount()
      const c = this.kit.coin(parent, 'C' + i, r, h, MACHINE_COLORS.coin, MACHINE_COLORS.coinRim, new vec3(0, i * h, 0))
      c.getTransform().setLocalRotation(quat.angleAxis((i * 0.9) % (Math.PI * 2), vec3.up()))
    }
  }

  /** Sets jar stacks and the basin stack. alloc = coins per jar; remaining = coins still in the basin. */
  setBudget(alloc: number[], remaining: number, animateJar: number = -1): void {
    if (!this.ready) return
    for (let j = 0; j < 3; j++) {
      const stack = this.jarStacks[j]
      const before = stack.getChildrenCount()
      this.rebuildStack(stack, alloc[j], JAR_COIN_R, JAR_COIN_H)
      if (animateJar === j && alloc[j] > before) {
        const coin = stack.getChild(alloc[j] - 1)
        coin.enabled = false
        this.flyTo(this.basinCoinWorld(), this.jarCoinWorld(j, alloc[j] - 1), 0.45, 9, () => {
          if (!isNull(coin)) coin.enabled = true
          this.bounce(this.jars[j])
        })
      }
    }
    this.rebuildStack(this.basinStack, Math.min(remaining, 10), 4.2, 0.75)
  }

  /** Coin flies back from a jar to the basin (undo). */
  returnCoin(jar: number): void {
    this.flyTo(this.jarCoinWorld(jar, this.jarStacks[jar].getChildrenCount()), this.basinCoinWorld(), 0.45, 9)
  }

  private basinCoinWorld(): vec3 {
    return this.basin.getTransform().getWorldTransform().multiplyPoint(new vec3(0, 3, 0))
  }

  private jarCoinWorld(jar: number, index: number): vec3 {
    return this.jars[jar].getTransform().getWorldTransform().multiplyPoint(new vec3(0, 3.1 + index * JAR_COIN_H, 0))
  }

  private flyTo(fromWorld: vec3, toWorld: vec3, seconds: number, lift: number, done?: () => void): void {
    const coin = this.freeCoin()
    if (!coin) {
      if (done) done()
      return
    }
    const inv = this.sceneObject.getTransform().getInvertedWorldTransform()
    const a = inv.multiplyPoint(fromWorld)
    const b = inv.multiplyPoint(toWorld)
    this.flights.push({object: coin, points: [a, b], durations: [seconds], lift, seg: 0, t: 0, delay: 0, done, spin: 2})
  }

  private bounce(o: SceneObject): void {
    const t = o.getTransform()
    this.tw.to(0.35, (k) => {
      const s = 1 + 0.1 * Ease.pulse(k)
      t.setLocalScale(new vec3(s, 1 + 0.06 * Ease.pulse(k), s))
    }, Ease.linear, () => t.setLocalScale(vec3.one()), 'bounce' + o.name)
  }

  /** Guide rings at the 50/30/20 heights (fractions of coinCount). */
  setJarGuides(fractions: number[], coinCount: number, visible: boolean): void {
    for (let j = 0; j < 3; j++) {
      const g = this.jarGuides[j]
      g.enabled = visible
      g.getTransform().setLocalPosition(new vec3(0, 3.1 + fractions[j] * coinCount * JAR_COIN_H + 0.1, 0))
    }
  }

  setGrabbable(enabled: boolean): void {
    if (!this.grabCoin) return
    this.grabEnabled = enabled
    this.grabCoin.enabled = enabled
    this.grabCollider.enabled = enabled
    this.grabInteract.enabled = enabled
    this.grabDrag.enabled = enabled
    if (enabled) this.resetGrabCoin()
  }

  private resetGrabCoin(): void {
    const t = this.grabCoin.getTransform()
    t.setLocalPosition(this.grabHome)
    t.setLocalRotation(quat.quatIdentity())
    t.setLocalScale(vec3.one())
  }

  /**
   * Month animation: needs coins sink away (paid), then the bill drops and pulls coins out of
   * SAVE and, if needed, WANTS. Calls `done` when finished. Returns total seconds.
   */
  runMonth(needsPaidCoins: number, fromSaveCoins: number, fromWantsCoins: number, done?: () => void): number {
    let t = 0.1
    const needsStack = this.jarStacks[0]
    for (let i = 0; i < needsPaidCoins && i < needsStack.getChildrenCount(); i++) {
      const coin = needsStack.getChild(needsStack.getChildrenCount() - 1 - i)
      const ct = coin.getTransform()
      this.tw.delay(t, () => {
        const from = ct.getLocalPosition()
        this.tw.to(0.4, (k) => {
          ct.setLocalPosition(new vec3(from.x, from.y - k * 2, from.z))
          ct.setLocalScale(new vec3(1 - k, 1 - k, 1 - k))
        }, Ease.inQuad, () => coin.enabled = false, 'month')
      }, 'month')
      t += 0.2
    }
    t += 0.8
    // Bill drop.
    this.tw.delay(t, () => {
      this.bill.enabled = true
      const bt = this.bill.getTransform()
      bt.setLocalPosition(new vec3(JAR_X[2], 42, 8))
      this.tw.to(0.9, (k) => bt.setLocalPosition(new vec3(JAR_X[2], lerp(42, JAR_Y + 15, k), 8)), Ease.outBack, undefined, 'month')
    }, 'month')
    t += 1.6
    const pull = (jar: number, n: number) => {
      const stack = this.jarStacks[jar]
      for (let i = 0; i < n; i++) {
        const idx = stack.getChildrenCount() - 1 - i
        if (idx < 0) break
        const coin = stack.getChild(idx)
        this.tw.delay(t, () => {
          coin.enabled = false
          this.flyTo(this.jarCoinWorld(jar, idx), this.bill.getTransform().getWorldPosition(), 0.55, 6)
        }, 'month')
        t += 0.3
      }
    }
    pull(2, fromSaveCoins)
    pull(1, fromWantsCoins)
    t += 1.0
    this.tw.delay(t, () => {
      const bt = this.bill.getTransform()
      const from = bt.getLocalPosition()
      this.tw.to(0.6, (k) => bt.setLocalPosition(new vec3(from.x, from.y + k * 30, from.z)), Ease.inQuad, () => (this.bill.enabled = false), 'month')
    }, 'month')
    t += 0.7
    if (done) this.tw.delay(t, done, 'month')
    return t
  }

  /** Reveals the growth column rising to `fraction` of its full height over `seconds`. */
  showGrowth(fraction: number, seconds: number, onProgress?: (k: number) => void, done?: () => void): void {
    this.growth.enabled = true
    const t = this.growth.getTransform()
    t.setLocalScale(new vec3(1, 0.001, 1))
    this.tw.to(seconds, (k) => {
      t.setLocalScale(new vec3(1, Math.max(0.001, k * fraction), 1))
      if (onProgress) onProgress(k)
    }, Ease.outCubic, done, 'growth')
  }

  hideGrowth(): void {
    this.growth.enabled = false
  }

  // ---------------------------------------------------------------------------------------------
  // Logic stage commands
  // ---------------------------------------------------------------------------------------------

  setLamps(a: boolean, b: boolean): void {
    if (!this.ready) return
    const v = [a, b]
    for (let i = 0; i < 2; i++) {
      this.lampsOn[i].enabled = v[i]
      this.lampsOff[i].enabled = !v[i]
    }
  }

  setGate(open: boolean, animate: boolean = true): void {
    if (!this.ready) return
    this.gateOpen = open
    const t = this.gateBar.getTransform()
    const from = t.getLocalPosition().y
    const to = open ? 10.6 : 4.0
    if (!animate) {
      t.setLocalPosition(new vec3(0, to, 0))
      return
    }
    this.tw.to(0.45, (k) => t.setLocalPosition(new vec3(0, lerp(from, to, k), 0)), open ? Ease.outBack : Ease.outCubic, undefined, 'gate')
  }

  /** Cart rolls to the gate; passes if open, otherwise bounces back. Calls done(open). */
  runCart(open: boolean, done?: (open: boolean) => void): void {
    if (!this.ready) return
    this.tw.clear('cart')
    const t = this.cart.getTransform()
    t.setLocalPosition(new vec3(CART_START, CART_Y, TRACK_Z))
    const roll = (fromX: number, toX: number, seconds: number, ease: (k: number) => number, after?: () => void) => {
      this.tw.to(seconds, (k) => {
        const x = lerp(fromX, toX, k)
        t.setLocalPosition(new vec3(x, CART_Y, TRACK_Z))
        const spin = x * 1.1
        for (let w = 0; w < 4; w++) this.cartWheels[w].getTransform().setLocalRotation(quat.fromEulerAngles(Math.PI / 2, 0, spin))
      }, ease, after, 'cart')
    }
    if (open) {
      this.setGate(true)
      this.tw.delay(0.3, () => roll(CART_START, CART_END, 1.5, Ease.inOutCubic, () => {
        this.bounce(this.cart)
        if (done) done(true)
      }), 'cart')
    } else {
      this.setGate(false)
      roll(CART_START, GATE_X - 5.2, 0.9, Ease.outQuad, () => {
        this.tw.to(0.25, (k) => t.setLocalScale(new vec3(1 - 0.15 * Ease.pulse(k), 1 + 0.1 * Ease.pulse(k), 1)), Ease.linear, () => t.setLocalScale(vec3.one()), 'cart')
        roll(GATE_X - 5.2, CART_START, 0.8, Ease.outCubic, () => {
          if (done) done(false)
        })
      })
    }
  }

  resetCart(): void {
    this.tw.clear('cart')
    this.cart.getTransform().setLocalPosition(new vec3(CART_START, CART_Y, TRACK_Z))
    this.cart.getTransform().setLocalScale(vec3.one())
  }

  // ---------------------------------------------------------------------------------------------
  // Frame update
  // ---------------------------------------------------------------------------------------------

  private freeCoin(): SceneObject | null {
    for (let i = 0; i < this.coins.length; i++) {
      const c = this.coins[i]
      if (!c.enabled) {
        let busy = false
        for (let f = 0; f < this.flights.length; f++) if (this.flights[f].object === c) busy = true
        if (!busy) return c
      }
    }
    return null
  }

  private clearFlights(): void {
    for (let i = 0; i < this.flights.length; i++) this.flights[i].object.enabled = false
    this.flights = []
  }

  private update(): void {
    if (!this.ready) return
    const dt = getDeltaTime()
    this.time += dt
    this.tw.update(dt)

    if (this.streamRate > 0 && this.streamTax && this.stage === 'tax') {
      this.streamTimer += dt
      const interval = 1 / this.streamRate
      while (this.streamTimer >= interval) {
        this.streamTimer -= interval
        this.launchCoin(this.streamTax, 0, this.streamCounter++)
      }
    }

    // Coin flights.
    for (let i = this.flights.length - 1; i >= 0; i--) {
      const f = this.flights[i]
      if (f.delay > 0) {
        f.delay -= dt
        continue
      }
      f.object.enabled = true
      f.t += dt / Math.max(0.01, f.durations[f.seg])
      if (f.t >= 1) {
        f.seg++
        f.t = 0
        if (f.seg >= f.durations.length) {
          f.object.enabled = false
          this.flights.splice(i, 1)
          if (f.done) f.done()
          continue
        }
      }
      const a = f.points[f.seg]
      const b = f.points[f.seg + 1]
      const k = Ease.outQuad(f.t)
      const p = lerpVec(a, b, k)
      p.y += Math.sin(f.t * Math.PI) * f.lift
      const tr = f.object.getTransform()
      tr.setLocalPosition(p)
      tr.setLocalRotation(quat.fromEulerAngles(this.time * 2.5 * f.spin, this.time * 1.7 * f.spin, 0))
    }

    // Grab coin idle bob + hover feedback on jars.
    if (this.grabEnabled && !this.grabbing) {
      const t = this.grabCoin.getTransform()
      t.setLocalPosition(new vec3(this.grabHome.x, this.grabHome.y + Math.sin(this.time * 2.2) * 0.6, this.grabHome.z))
      t.setLocalRotation(quat.angleAxis(this.time * 0.9, vec3.up()))
    }
    for (let j = 0; j < 3; j++) {
      const jar = this.jars[j]
      if (!jar.enabled) continue
      const target = this.jarHover[j] > 0 && this.stage === 'budget' ? 1.05 : 1
      const cur = jar.getTransform().getLocalScale().x
      if (Math.abs(cur - target) > 0.002 && !this.tw.active) {
        const s = lerp(cur, target, Math.min(1, dt * 10))
        jar.getTransform().setLocalScale(new vec3(s, s, s))
      }
    }
    // Lamp glow pulse.
    for (let i = 0; i < 2; i++) {
      if (this.lampsOn[i].enabled) {
        const s = 1 + 0.06 * Math.sin(this.time * 3 + i)
        this.lampsOn[i].getTransform().setLocalScale(new vec3(s, s, s))
      }
    }
  }
}
