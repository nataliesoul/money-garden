// Cashfall tween + easing + formatting utilities. Pure helpers, no scene state.
// Stepped from one UpdateEvent by its owner so nothing here binds its own event.

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v
}

export function lerp(a: number, b: number, k: number): number {
  return a + (b - a) * k
}

export function lerpVec(a: vec3, b: vec3, k: number): vec3 {
  return new vec3(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, a.z + (b.z - a.z) * k)
}

/** Frame-rate independent exponential smoothing factor. */
export function smoothing(dt: number, responsiveness: number): number {
  return clamp(dt * responsiveness, 0, 1)
}

export const Ease = {
  linear: (k: number): number => k,
  outQuad: (k: number): number => 1 - (1 - k) * (1 - k),
  inQuad: (k: number): number => k * k,
  outCubic: (k: number): number => {
    const f = 1 - k
    return 1 - f * f * f
  },
  inOutCubic: (k: number): number => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  outBack: (k: number): number => {
    const c1 = 1.70158
    const c3 = c1 + 1
    const f = k - 1
    return 1 + c3 * f * f * f + c1 * f * f
  },
  outElastic: (k: number): number => {
    if (k <= 0) return 0
    if (k >= 1) return 1
    const c4 = (2 * Math.PI) / 3
    return Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * c4) + 1
  },
  /** Rises to 1 at the midpoint then returns to 0; for pulses. */
  pulse: (k: number): number => Math.sin(k * Math.PI),
}

interface Tween {
  elapsed: number
  duration: number
  apply: (k: number) => void
  ease: (k: number) => number
  done?: () => void
  dead: boolean
  tag: string
}

/** Minimal time-based tween pump. */
export class Tweener {
  private tweens: Tween[] = []

  to(
    duration: number,
    apply: (k: number) => void,
    ease: (k: number) => number = Ease.outCubic,
    done?: () => void,
    tag: string = ''
  ): void {
    this.tweens.push({elapsed: 0, duration, apply, ease, done, dead: false, tag})
  }

  /** Runs fn after `seconds`; the pump keeps it alive. */
  delay(seconds: number, fn: () => void, tag: string = ''): void {
    this.tweens.push({
      elapsed: 0,
      duration: Math.max(0.0001, seconds),
      apply: () => {},
      ease: Ease.linear,
      done: fn,
      dead: false,
      tag,
    })
  }

  /** Drops every in-flight tween, or only those with `tag` when given. Done callbacks are not fired. */
  clear(tag?: string): void {
    if (tag === undefined) {
      this.tweens = []
      return
    }
    this.tweens = this.tweens.filter((t) => t.tag !== tag)
  }

  get active(): number {
    return this.tweens.length
  }

  update(dt: number): void {
    if (this.tweens.length === 0) return
    const snapshot = this.tweens.slice()
    let needsCompact = false
    for (let i = 0; i < snapshot.length; i++) {
      const t = snapshot[i]
      if (t.dead) continue
      t.elapsed += dt
      const raw = t.duration <= 0 ? 1 : clamp(t.elapsed / t.duration, 0, 1)
      t.apply(t.ease(raw))
      if (raw >= 1) {
        t.dead = true
        needsCompact = true
        if (t.done) t.done()
      }
    }
    if (needsCompact) this.tweens = this.tweens.filter((t) => !t.dead)
  }
}

/** "$4,000" style formatting; negatives render as "-$400". */
export function money(n: number): string {
  const v = Math.round(Math.abs(n))
  const s = v.toString()
  let out = ''
  for (let i = 0; i < s.length; i++) {
    const fromEnd = s.length - i
    out += s[i]
    if (fromEnd > 1 && (fromEnd - 1) % 3 === 0) out += ','
  }
  return (n < 0 ? '-$' : '$') + out
}

export function percent(fraction: number, decimals: number = 0): string {
  const f = Math.pow(10, decimals)
  return (Math.round(fraction * 100 * f) / f).toString() + '%'
}
