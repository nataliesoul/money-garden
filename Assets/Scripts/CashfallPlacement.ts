// Cashfall placement: aims a WorldQuery hit test along the active SIK interactor ray (hand on
// device, mouse in Preview), draws a reticle on the surface, and commits a pose on pinch release.
// Falls back to a camera-relative pose when the module is unavailable or the user asks for it.
// Owns: the reticle geometry and the hit-test session. Emits onPlaced(position, yaw).

import {SIK} from 'SpectaclesInteractionKit.lspkg/SIK'
import {Interactor, InteractorTriggerType} from 'SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor'
import WorldCameraFinderProvider from 'SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider'
import Event from 'SpectaclesInteractionKit.lspkg/Utils/Event'
import {MeshKit, RGB} from './CashfallShapes'
import {lerpVec, smoothing} from './CashfallTween'

export interface PlacementPose {
  position: vec3
  yaw: number
}

const CYAN: RGB = [0.36, 0.86, 1.0]
const GOLD: RGB = [1.0, 0.78, 0.3]

@component
export class CashfallPlacement extends BaseScriptComponent {
  @ui.label('Cashfall / Placement')
  @ui.separator
  @input @hint('Unlit vertex-color material shared by all generated geometry') material!: Material
  @ui.group_start('Settings')
  @input @hint('Reticle radius in centimeters') @widget(new SliderWidget(6, 20, 1)) reticleRadius: number = 11
  @input @hint('Longest hit-test ray in centimeters') @widget(new SliderWidget(150, 600, 10)) maxRay: number = 400
  @input @hint('Fallback distance in front of the viewer, in centimeters') @widget(new SliderWidget(70, 160, 5)) fallbackDistance: number = 105
  @input @hint('Fallback drop below eye height, in centimeters') @widget(new SliderWidget(0, 80, 5)) fallbackDrop: number = 42
  @input @hint('Reject surfaces steeper than this many degrees from horizontal') @widget(new SliderWidget(10, 60, 5)) maxTiltDegrees: number = 35
  @ui.group_end

  public onPlaced = new Event<PlacementPose>()
  public onSurfaceStatus = new Event<string>()

  private session: HitTestSession | null = null
  private reticle!: SceneObject
  private reticleSpin!: SceneObject
  private active = false
  private pending: {position: vec3; normal: vec3} | null = null
  private raw: {position: vec3; normal: vec3} | null = null
  private smoothPos: vec3 | null = null
  private missFrames = 0
  private castSerial = 0
  private acceptedSerial = 0
  private time = 0
  private lastStatus = ''

  onAwake(): void {
    this.createEvent('OnStartEvent').bind(() => this.build())
    this.createEvent('UpdateEvent').bind(() => this.update())
  }

  private build(): void {
    const kit = new MeshKit(this.material)
    this.reticle = global.scene.createSceneObject('Reticle')
    this.reticle.setParent(this.sceneObject)
    const r = this.reticleRadius
    kit.ring(this.reticle, 'Outer', r * 0.86, r, 0.25, CYAN)
    kit.ring(this.reticle, 'Inner', r * 0.14, r * 0.26, 0.25, GOLD)
    this.reticleSpin = global.scene.createSceneObject('Ticks')
    this.reticleSpin.setParent(this.reticle)
    for (let i = 0; i < 4; i++) {
      const tick = kit.box(this.reticleSpin, 'Tick' + i, new vec3(r * 0.22, 0.3, 1.0), GOLD)
      const a = (i / 4) * Math.PI * 2
      tick.getTransform().setLocalPosition(new vec3(Math.cos(a) * r * 1.18, 0.15, Math.sin(a) * r * 1.18))
      tick.getTransform().setLocalRotation(quat.angleAxis(-a, vec3.up()))
    }
    this.reticle.enabled = false
    try {
      const wq = require('LensStudio:WorldQueryModule') as WorldQueryModule
      const opts = HitTestSessionOptions.create()
      opts.filter = true
      this.session = wq.createHitTestSessionWithOptions(opts)
      this.session.start()
    } catch (e) {
      this.session = null
      print('Cashfall placement: WorldQuery unavailable, surface mode will fall back. ' + String(e))
    }
  }

  get surfaceAvailable(): boolean {
    return this.session !== null
  }

  /** Starts aiming at surfaces. The next pinch release on a valid hit commits the pose. */
  beginSurface(): void {
    this.active = true
    this.raw = null
    this.pending = null
    this.smoothPos = null
    this.missFrames = 0
    this.status('searching')
  }

  cancel(): void {
    this.active = false
    if (this.reticle) this.reticle.enabled = false
  }

  /** Pose on the floor-ish plane in front of the viewer, facing them. */
  fallbackPose(): PlacementPose {
    const cam = WorldCameraFinderProvider.getInstance().getComponent().getTransform()
    const camPos = cam.getWorldPosition()
    const fwd = cam.getWorldRotation().multiplyVec3(new vec3(0, 0, -1))
    const flat = new vec3(fwd.x, 0, fwd.z)
    const dir = flat.length > 0.001 ? flat.normalize() : new vec3(0, 0, -1)
    const position = camPos.add(dir.uniformScale(this.fallbackDistance)).add(new vec3(0, -this.fallbackDrop, 0))
    return {position, yaw: CashfallPlacement.yawToward(position, camPos)}
  }

  /** Commits the fallback pose immediately. */
  placeInFront(): void {
    this.cancel()
    this.onPlaced.invoke(this.fallbackPose())
  }

  /** Pose that keeps the current height but re-centres in front of the viewer. */
  recenterPose(currentY: number): PlacementPose {
    const p = this.fallbackPose()
    return {position: new vec3(p.position.x, currentY, p.position.z), yaw: p.yaw}
  }

  static yawToward(from: vec3, to: vec3): number {
    return Math.atan2(to.x - from.x, to.z - from.z)
  }

  private status(s: string): void {
    if (s === this.lastStatus) return
    this.lastStatus = s
    this.onSurfaceStatus.invoke(s)
  }

  private activeInteractor(): Interactor | null {
    try {
      const list = SIK.InteractionManager.getTargetingInteractors()
      if (!list || list.length === 0) return null
      for (let i = 0; i < list.length; i++) if (list[i].currentTrigger !== InteractorTriggerType.None) return list[i]
      for (let i = 0; i < list.length; i++) if (list[i].previousTrigger !== InteractorTriggerType.None) return list[i]
      for (let i = 0; i < list.length; i++) if (list[i].startPoint && list[i].endPoint) return list[i]
      return list[0]
    } catch (e) {
      return null
    }
  }

  private update(): void {
    const dt = getDeltaTime()
    this.time += dt
    if (!this.active) return
    if (!this.session) {
      this.status('unavailable')
      return
    }
    const interactor = this.activeInteractor()
    const pressed = interactor !== null && interactor.currentTrigger !== InteractorTriggerType.None
    const wasPressed = interactor !== null && interactor.previousTrigger !== InteractorTriggerType.None

    if (this.pending) {
      this.raw = this.pending
      this.pending = null
      this.missFrames = 0
    } else {
      this.missFrames++
    }
    if (this.missFrames > 10) this.raw = null

    const camPos = WorldCameraFinderProvider.getInstance().getComponent().getTransform().getWorldPosition()
    let valid = false
    if (this.raw) {
      const n = this.raw.normal
      const tilt = Math.acos(Math.max(-1, Math.min(1, n.dot(vec3.up())))) * (180 / Math.PI)
      valid = tilt <= this.maxTiltDegrees
      const k = smoothing(dt, 14)
      this.smoothPos = this.smoothPos ? lerpVec(this.smoothPos, this.raw.position, k) : this.raw.position
      this.reticle.enabled = true
      const t = this.reticle.getTransform()
      t.setWorldPosition(this.smoothPos.add(new vec3(0, 0.4, 0)))
      t.setWorldRotation(quat.angleAxis(CashfallPlacement.yawToward(this.smoothPos, camPos), vec3.up()))
      const pulse = 1 + 0.05 * Math.sin(this.time * 4)
      t.setWorldScale(new vec3(pulse, 1, pulse))
      this.reticleSpin.getTransform().setLocalRotation(quat.angleAxis(this.time * 0.8, vec3.up()))
      this.status(valid ? 'ready' : 'tooSteep')
    } else {
      this.smoothPos = null
      this.reticle.enabled = false
      this.status('searching')
    }

    if (!pressed && wasPressed && this.raw && valid) {
      const pos = this.raw.position
      this.cancel()
      this.onPlaced.invoke({position: pos, yaw: CashfallPlacement.yawToward(pos, camPos)})
      return
    }
    this.cast(interactor)
  }

  private cast(interactor: Interactor | null): void {
    if (!this.session || !interactor) return
    const from = interactor.startPoint
    const toward = interactor.endPoint
    if (!from || !toward) return
    const dir = toward.sub(from)
    if (dir.length < 0.001) return
    const to = from.add(dir.normalize().uniformScale(this.maxRay))
    const serial = ++this.castSerial
    try {
      this.session.hitTest(from, to, (result: WorldQueryHitTestResult | null) => {
        if (!this.active || !result || serial < this.acceptedSerial) return
        this.acceptedSerial = serial
        this.pending = {position: result.position, normal: result.normal.normalize()}
      })
    } catch (e) {
      this.session = null
    }
  }
}
