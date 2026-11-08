// Cashfall geometry kit: code-authored MeshBuilder primitives with baked vertex shading.
// Every part shares one unlit vertex-color material, so depth comes from the shade baked
// here (key light upper-left-front) rather than from scene lighting. Units: cm.

export type RGB = [number, number, number]

const KEY_LIGHT = [-0.45, 0.78, 0.44]

export function dim(c: RGB, f: number): RGB {
  return [Math.min(1, c[0] * f), Math.min(1, c[1] * f), Math.min(1, c[2] * f)]
}

export function mixRGB(a: RGB, b: RGB, k: number): RGB {
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]
}

export function toVec4(c: RGB, a: number = 1): vec4 {
  return new vec4(c[0], c[1], c[2], a)
}

/** Brightness factor for a normal: up-facing and key-lit faces brighten, undersides darken. */
function shade(nx: number, ny: number, nz: number, flat: number): number {
  const lit = Math.max(0, nx * KEY_LIGHT[0] + ny * KEY_LIGHT[1] + nz * KEY_LIGHT[2])
  return flat + 0.2 * (ny * 0.5 + 0.5) + 0.34 * lit
}

class MeshAccumulator {
  verts: number[] = []
  idx: number[] = []
  count = 0

  vertex(x: number, y: number, z: number, nx: number, ny: number, nz: number, c: RGB, flat: number): number {
    const f = shade(nx, ny, nz, flat)
    this.verts.push(x, y, z, nx, ny, nz, Math.min(1, c[0] * f), Math.min(1, c[1] * f), Math.min(1, c[2] * f), 1)
    return this.count++
  }

  tri(a: number, b: number, c: number): void {
    this.idx.push(a, b, c)
  }

  quad(a: number, b: number, c: number, d: number): void {
    this.idx.push(a, b, c, a, c, d)
  }

  build(): RenderMesh {
    const b = new MeshBuilder([
      {name: 'position', components: 3},
      {name: 'normal', components: 3, normalized: true},
      {name: 'color', components: 4},
    ])
    b.topology = MeshTopology.Triangles
    b.indexType = MeshIndexType.UInt16
    b.appendVerticesInterleaved(this.verts)
    b.appendIndices(this.idx)
    b.updateMesh()
    return b.getMesh()
  }
}

export interface LatheOptions {
  segments?: number
  /** Non-uniform radial scale so a disc can become an ellipse. */
  sx?: number
  sz?: number
  /** Base brightness; lower reads darker/matte. */
  flat?: number
}

/**
 * Builds parts under a parent. Each helper returns the new SceneObject (RenderMeshVisual attached).
 * Profiles are [radius, height] pairs revolved around Y.
 */
export class MeshKit {
  constructor(private material: Material) {}

  private attach(parent: SceneObject, name: string, acc: MeshAccumulator, position?: vec3): SceneObject {
    const o = global.scene.createSceneObject(name)
    o.setParent(parent)
    if (position) o.getTransform().setLocalPosition(position)
    const rm = o.createComponent('Component.RenderMeshVisual') as RenderMeshVisual
    rm.mesh = acc.build()
    rm.mainMaterial = this.material
    return o
  }

  /** Surface of revolution. Winding is CCW seen from outside when the profile goes bottom to top. */
  lathe(parent: SceneObject, name: string, profile: number[][], color: RGB, opts?: LatheOptions, position?: vec3): SceneObject {
    const n = opts?.segments ?? 32
    const sx = opts?.sx ?? 1
    const sz = opts?.sz ?? 1
    const flat = opts?.flat ?? 0.58
    const acc = new MeshAccumulator()
    const P = profile.length
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2
      const c = Math.cos(a)
      const s = Math.sin(a)
      for (let j = 0; j < P; j++) {
        const p = profile[j]
        const prev = profile[Math.max(0, j - 1)]
        const next = profile[Math.min(P - 1, j + 1)]
        const dx = next[0] - prev[0]
        const dy = next[1] - prev[1]
        const len = Math.sqrt(dx * dx + dy * dy) || 1
        const nx = (dy / len) * c
        const ny = -dx / len
        const nz = (dy / len) * s
        acc.vertex(p[0] * c * sx, p[1], p[0] * s * sz, nx, ny, nz, color, flat)
      }
    }
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < P - 1; j++) {
        const a = i * P + j
        const b = (i + 1) * P + j
        acc.quad(a, a + 1, b + 1, b)
      }
    }
    return this.attach(parent, name, acc, position)
  }

  /** Axis-aligned box centred on the local origin. Optional bevel darkens edges slightly via a small chamfer. */
  box(parent: SceneObject, name: string, size: vec3, color: RGB, position?: vec3, flat: number = 0.58, topColor?: RGB): SceneObject {
    const acc = new MeshAccumulator()
    const hx = size.x / 2
    const hy = size.y / 2
    const hz = size.z / 2
    const faces: number[][] = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ]
    for (let f = 0; f < 6; f++) {
      const n = faces[f]
      const ax = n[0] !== 0 ? [0, 1, 0] : [1, 0, 0]
      const bx = [n[1] * ax[2] - n[2] * ax[1], n[2] * ax[0] - n[0] * ax[2], n[0] * ax[1] - n[1] * ax[0]]
      const corners: number[] = []
      const col = n[1] > 0 && topColor ? topColor : color
      for (let i = 0; i < 4; i++) {
        const su = i === 0 || i === 3 ? -1 : 1
        const sv = i < 2 ? -1 : 1
        const px = n[0] * hx + (ax[0] * su + bx[0] * sv) * hx * (n[0] !== 0 ? 0 : 1)
        const py = n[1] * hy + (ax[1] * su + bx[1] * sv) * hy * (n[1] !== 0 ? 0 : 1)
        const pz = n[2] * hz + (ax[2] * su + bx[2] * sv) * hz * (n[2] !== 0 ? 0 : 1)
        corners.push(acc.vertex(px, py, pz, n[0], n[1], n[2], col, flat))
      }
      // Wind so the face normal points outward (right-handed, CCW seen from outside).
      const u = [ax[0] * hx, ax[1] * hy, ax[2] * hz]
      const v = [bx[0] * hx, bx[1] * hy, bx[2] * hz]
      const cx = u[1] * v[2] - u[2] * v[1]
      const cy = u[2] * v[0] - u[0] * v[2]
      const cz = u[0] * v[1] - u[1] * v[0]
      const outward = cx * n[0] + cy * n[1] + cz * n[2] > 0
      if (outward) acc.quad(corners[0], corners[1], corners[2], corners[3])
      else acc.quad(corners[0], corners[3], corners[2], corners[1])
    }
    return this.attach(parent, name, acc, position)
  }

  /** Rounded slab: a box with chamfered vertical edges, built as a lathe-like extrusion of a rounded rectangle. */
  slab(parent: SceneObject, name: string, w: number, h: number, d: number, radius: number, color: RGB, position?: vec3, flat: number = 0.58, topColor?: RGB): SceneObject {
    const acc = new MeshAccumulator()
    const r = Math.min(radius, w / 2, d / 2)
    const corners = [
      [w / 2 - r, d / 2 - r, 0],
      [-w / 2 + r, d / 2 - r, Math.PI / 2],
      [-w / 2 + r, -d / 2 + r, Math.PI],
      [w / 2 - r, -d / 2 + r, (3 * Math.PI) / 2],
    ]
    const ring: number[][] = []
    const seg = 6
    for (let c = 0; c < 4; c++) {
      for (let s = 0; s <= seg; s++) {
        const a = corners[c][2] + (s / seg) * (Math.PI / 2)
        ring.push([corners[c][0] + Math.cos(a) * r, corners[c][1] + Math.sin(a) * r, Math.cos(a), Math.sin(a)])
      }
    }
    const top = topColor ?? color
    const N = ring.length
    const topCenter = acc.vertex(0, h / 2, 0, 0, 1, 0, top, flat)
    const botCenter = acc.vertex(0, -h / 2, 0, 0, -1, 0, color, flat)
    const topRing: number[] = []
    const botRing: number[] = []
    const sideTop: number[] = []
    const sideBot: number[] = []
    for (let i = 0; i < N; i++) {
      const p = ring[i]
      topRing.push(acc.vertex(p[0], h / 2, p[1], 0, 1, 0, top, flat))
      botRing.push(acc.vertex(p[0], -h / 2, p[1], 0, -1, 0, color, flat))
      sideTop.push(acc.vertex(p[0], h / 2, p[1], p[2], 0, p[3], color, flat))
      sideBot.push(acc.vertex(p[0], -h / 2, p[1], p[2], 0, p[3], color, flat))
    }
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N
      acc.tri(topCenter, topRing[j], topRing[i])
      acc.tri(botCenter, botRing[i], botRing[j])
      acc.quad(sideTop[i], sideBot[i], sideBot[j], sideTop[j])
    }
    return this.attach(parent, name, acc, position)
  }

  /** Vertical cylinder from y0 to y1, capped. */
  cylinder(parent: SceneObject, name: string, r: number, y0: number, y1: number, color: RGB, opts?: LatheOptions, position?: vec3): SceneObject {
    return this.lathe(parent, name, [[0, y0], [r, y0], [r, y1], [0, y1]], color, opts, position)
  }

  /** Thin ring lying flat (y = 0), used for guide marks. */
  ring(parent: SceneObject, name: string, rInner: number, rOuter: number, thickness: number, color: RGB, position?: vec3): SceneObject {
    return this.lathe(
      parent,
      name,
      [
        [rInner, 0],
        [rOuter, 0],
        [rOuter, thickness],
        [rInner, thickness],
        [rInner, 0],
      ],
      color,
      {segments: 40, flat: 0.75},
      position
    )
  }

  /** Flat darkened disc on a surface; grounds objects cheaply. */
  shadow(parent: SceneObject, name: string, r: number, color: RGB, position?: vec3, sx: number = 1, sz: number = 1): SceneObject {
    return this.lathe(parent, name, [[r, 0], [0, 0]], color, {segments: 28, sx, sz, flat: 0.5}, position)
  }

  /** Coin: a short gold cylinder with a slightly raised rim. */
  coin(parent: SceneObject, name: string, r: number, h: number, color: RGB, rimColor: RGB, position?: vec3): SceneObject {
    const o = global.scene.createSceneObject(name)
    o.setParent(parent)
    if (position) o.getTransform().setLocalPosition(position)
    this.lathe(o, 'Face', [[0, 0], [r * 0.82, 0], [r * 0.82, h], [0, h]], color, {segments: 24, flat: 0.66})
    this.lathe(o, 'Rim', [[r * 0.8, -0.02], [r, 0.08], [r, h - 0.08], [r * 0.8, h + 0.02]], rimColor, {segments: 24, flat: 0.6})
    return o
  }

  /** Tube between two local points, radius r. Built as a Y cylinder then rotated. */
  pipe(parent: SceneObject, name: string, from: vec3, to: vec3, r: number, color: RGB): SceneObject {
    const dir = to.sub(from)
    const len = dir.length
    const o = this.lathe(parent, name, [[r, 0], [r, len]], color, {segments: 18, flat: 0.55}, from)
    if (len > 0.001) o.getTransform().setLocalRotation(quat.rotationFromTo(vec3.up(), dir.normalize()))
    return o
  }

  /** Wedge-shaped chute (open trough) along +X of width w and length len, tilted by the caller. */
  trough(parent: SceneObject, name: string, len: number, w: number, wall: number, color: RGB, position?: vec3): SceneObject {
    const o = global.scene.createSceneObject(name)
    o.setParent(parent)
    if (position) o.getTransform().setLocalPosition(position)
    this.box(o, 'Floor', new vec3(len, 0.6, w), color, new vec3(0, 0, 0))
    this.box(o, 'WallL', new vec3(len, wall, 0.6), dim(color, 0.9), new vec3(0, wall / 2, -w / 2))
    this.box(o, 'WallR', new vec3(len, wall, 0.6), dim(color, 0.9), new vec3(0, wall / 2, w / 2))
    return o
  }
}
