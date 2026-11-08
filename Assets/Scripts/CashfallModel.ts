// Cashfall lesson model: scenarios, practice tax math, budget rules, gate logic, growth.
// Pure data + functions. No scene objects, no UIKit, no SIK. Deterministic so tests can assert.

export interface Bracket {
  /** Upper bound of this slice in dollars; Infinity for the top slice. */
  upTo: number
  rate: number
}

/** Practice rates, not a real tax schedule. Monthly amounts. */
export const BRACKETS: Bracket[] = [
  {upTo: 1000, rate: 0},
  {upTo: 3000, rate: 0.1},
  {upTo: Infinity, rate: 0.2},
]

export const GROSS_MIN = 1000
export const GROSS_MAX = 8000
export const GROSS_STEP = 500

export interface Slice {
  lower: number
  upper: number
  amount: number
  rate: number
  tax: number
}

export interface TaxResult {
  gross: number
  slices: Slice[]
  tax: number
  takeHome: number
  effectiveRate: number
  topRate: number
}

export function taxBreakdown(gross: number): TaxResult {
  const slices: Slice[] = []
  let lower = 0
  let tax = 0
  let topRate = 0
  for (let i = 0; i < BRACKETS.length; i++) {
    const b = BRACKETS[i]
    const upper = b.upTo
    const amount = Math.max(0, Math.min(gross, upper) - lower)
    const t = amount * b.rate
    if (amount > 0) topRate = b.rate
    slices.push({lower, upper, amount, rate: b.rate, tax: t})
    tax += t
    lower = upper
  }
  tax = Math.round(tax)
  return {gross, slices, tax, takeHome: gross - tax, effectiveRate: gross > 0 ? tax / gross : 0, topRate}
}

export type Jar = 0 | 1 | 2
export const JAR_NAMES = ['NEEDS', 'WANTS', 'SAVE']
export const JAR_GUIDE = [0.5, 0.3, 0.2]

export interface Scenario {
  id: string
  title: string
  gross: number
  /** Coins the take-home is split into during the budget chapter. */
  coinCount: number
  /** Coins required in NEEDS for rent, food and bills. */
  needsCoins: number
  /** Coins the scenario recommends keeping as a cushion. */
  cushionCoins: number
  surpriseLabel: string
  surpriseAmount: number
  purchaseLabel: string
  purchasePrice: number
  growthYears: number
  growthRate: number
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'first-paycheck',
    title: 'First paycheck',
    gross: 4000,
    coinCount: 10,
    needsCoins: 5,
    cushionCoins: 2,
    surpriseLabel: 'Car repair',
    surpriseAmount: 650,
    purchaseLabel: 'Weekend trip',
    purchasePrice: 400,
    growthYears: 10,
    growthRate: 0.05,
  },
  {
    id: 'the-raise',
    title: 'The raise',
    gross: 5000,
    coinCount: 10,
    needsCoins: 5,
    cushionCoins: 2,
    surpriseLabel: 'Dental bill',
    surpriseAmount: 900,
    purchaseLabel: 'New laptop',
    purchasePrice: 1100,
    growthYears: 10,
    growthRate: 0.05,
  },
  {
    id: 'side-hustle',
    title: 'Side hustle',
    gross: 2500,
    coinCount: 10,
    needsCoins: 5,
    cushionCoins: 2,
    surpriseLabel: 'Cracked phone',
    surpriseAmount: 300,
    purchaseLabel: 'Concert tickets',
    purchasePrice: 200,
    growthYears: 10,
    growthRate: 0.05,
  },
]

export function coinValue(s: Scenario, takeHome: number): number {
  return Math.round(takeHome / s.coinCount)
}

export interface MonthResult {
  needsPaid: number
  needsShort: number
  surprise: number
  fromSave: number
  fromWants: number
  uncovered: number
  saveAfter: number
  wantsAfter: number
  needsCovered: boolean
  cushionHeld: boolean
  success: boolean
}

/** Runs the month on an allocation of coin counts [needs, wants, save]. */
export function runMonth(s: Scenario, coinVal: number, alloc: number[]): MonthResult {
  const needs = alloc[0] * coinVal
  const wants = alloc[1] * coinVal
  const save = alloc[2] * coinVal
  const needsFloor = s.needsCoins * coinVal
  const needsPaid = Math.min(needs, needsFloor)
  const needsShort = Math.max(0, needsFloor - needs)
  let remaining = s.surpriseAmount
  const fromSave = Math.min(save, remaining)
  remaining -= fromSave
  const fromWants = Math.min(wants, remaining)
  remaining -= fromWants
  const uncovered = remaining
  const needsCovered = needsShort === 0
  const cushionHeld = fromWants === 0 && uncovered === 0
  return {
    needsPaid,
    needsShort,
    surprise: s.surpriseAmount,
    fromSave,
    fromWants,
    uncovered,
    saveAfter: save - fromSave,
    wantsAfter: wants - fromWants,
    needsCovered,
    cushionHeld,
    success: needsCovered && cushionHeld,
  }
}

/** Future value of a fixed monthly contribution with monthly compounding. */
export function compoundMonthly(contribution: number, annualRate: number, years: number): number {
  const r = annualRate / 12
  const n = Math.round(years * 12)
  if (r <= 0) return contribution * n
  return contribution * ((Math.pow(1 + r, n) - 1) / r)
}

export type Op = 'AND' | 'OR'

export function gateOpen(a: boolean, b: boolean, op: Op): boolean {
  return op === 'AND' ? a && b : a || b
}

export function rowKey(a: boolean, b: boolean, op: Op): string {
  return op + ':' + (a ? 1 : 0) + (b ? 1 : 0)
}

export const ALL_ROWS: string[] = (() => {
  const rows: string[] = []
  const ops: Op[] = ['AND', 'OR']
  for (let o = 0; o < ops.length; o++)
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) rows.push(rowKey(a === 1, b === 1, ops[o]))
  return rows
})()

/** Check A: needs covered. Check B: cushion stays intact after the purchase. */
export function purchaseChecks(
  s: Scenario,
  coinVal: number,
  alloc: number[]
): {a: boolean; b: boolean; cushion: number; saveAfterBuy: number} {
  const cushion = s.cushionCoins * coinVal
  const save = alloc[2] * coinVal
  const saveAfterBuy = save - s.purchasePrice
  return {a: alloc[0] >= s.needsCoins, b: saveAfterBuy >= cushion, cushion, saveAfterBuy}
}

export class CashfallState {
  scenarioIndex = 0
  gross = 4000
  alloc = [0, 0, 0]
  history: number[] = []
  overrideA: boolean | null = null
  overrideB: boolean | null = null
  op: Op = 'AND'
  discovered: {[k: string]: boolean} = {}
  taxQuizAnswer: boolean | null = null
  monthResult: MonthResult | null = null
  policyAnswer: Op | null = null
  attempts = 0

  get scenario(): Scenario {
    return SCENARIOS[this.scenarioIndex]
  }

  get tax(): TaxResult {
    return taxBreakdown(this.gross)
  }

  /** Coin value is fixed per scenario from its base gross, so budget math stays stable while the learner explores taxes. */
  get coinVal(): number {
    return coinValue(this.scenario, taxBreakdown(this.scenario.gross).takeHome)
  }

  get placed(): number {
    return this.alloc[0] + this.alloc[1] + this.alloc[2]
  }

  get remaining(): number {
    return this.scenario.coinCount - this.placed
  }

  get discoveredCount(): number {
    let n = 0
    for (let i = 0; i < ALL_ROWS.length; i++) if (this.discovered[ALL_ROWS[i]]) n++
    return n
  }

  resetScenario(index: number): void {
    this.scenarioIndex = Math.max(0, Math.min(SCENARIOS.length - 1, index))
    this.gross = this.scenario.gross
    this.resetBudget()
    this.overrideA = null
    this.overrideB = null
    this.op = 'AND'
    this.discovered = {}
    this.taxQuizAnswer = null
    this.policyAnswer = null
    this.attempts = 0
  }

  resetBudget(): void {
    this.alloc = [0, 0, 0]
    this.history = []
    this.monthResult = null
  }

  allocate(jar: number): boolean {
    if (this.remaining <= 0 || jar < 0 || jar > 2) return false
    this.alloc[jar]++
    this.history.push(jar)
    return true
  }

  unallocate(jar: number): boolean {
    if (jar < 0 || jar > 2 || this.alloc[jar] <= 0) return false
    this.alloc[jar]--
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i] === jar) {
        this.history.splice(i, 1)
        break
      }
    }
    return true
  }

  undo(): number {
    if (this.history.length === 0) return -1
    const jar = this.history.pop() as number
    this.alloc[jar]--
    return jar
  }

  autoSplit(): void {
    this.resetBudget()
    const n = this.scenario.coinCount
    const needs = Math.round(n * JAR_GUIDE[0])
    const wants = Math.round(n * JAR_GUIDE[1])
    const save = n - needs - wants
    const plan = [needs, wants, save]
    for (let j = 0; j < 3; j++) for (let i = 0; i < plan[j]; i++) this.allocate(j)
  }

  /** Effective lamp values: the learner's budget unless an override is set. */
  lamps(): {a: boolean; b: boolean} {
    const c = purchaseChecks(this.scenario, this.coinVal, this.alloc)
    return {a: this.overrideA === null ? c.a : this.overrideA, b: this.overrideB === null ? c.b : this.overrideB}
  }

  snapshot(): string {
    const l = this.lamps()
    return JSON.stringify({
      scenario: this.scenario.id,
      gross: this.gross,
      tax: this.tax.tax,
      takeHome: this.tax.takeHome,
      alloc: this.alloc,
      coinVal: this.coinVal,
      a: l.a,
      b: l.b,
      op: this.op,
      discovered: this.discoveredCount,
      month: this.monthResult,
    })
  }
}
