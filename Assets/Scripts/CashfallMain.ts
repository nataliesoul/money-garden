// Cashfall orchestrator: owns the lesson flow (place -> Falls -> Split -> Gate -> summary), the
// lesson state (CashfallModel), audio, and the wiring between the console, the labels, the intro
// card, placement and the machine. Views stay passive; every decision happens here.

import WorldCameraFinderProvider from 'SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider'
import {CashfallConsoleUI, ConsoleAction, NoteTone} from './CashfallConsoleUI'
import {CashfallLabelsUI} from './CashfallLabelsUI'
import {CashfallIntroUI} from './CashfallIntroUI'
import {CashfallPlacement, PlacementPose} from './CashfallPlacement'
import {CashfallMachine} from './CashfallMachine'
import {CashfallAudio} from './CashfallAudio'
import {Tweener, Ease, money, percent, lerpVec, clamp} from './CashfallTween'
import {
  CashfallState,
  SCENARIOS,
  GROSS_MIN,
  GROSS_MAX,
  GROSS_STEP,
  taxBreakdown,
  runMonth,
  compoundMonthly,
  gateOpen,
  rowKey,
  ALL_ROWS,
  purchaseChecks,
  JAR_NAMES,
  JAR_GUIDE,
  Op,
} from './CashfallModel'

type Page =
  | 'intro'
  | 'placing'
  | 'tax_intro'
  | 'tax_steps'
  | 'tax_explore'
  | 'tax_quiz'
  | 'tax_result'
  | 'budget_intro'
  | 'budget_allocate'
  | 'budget_month'
  | 'budget_grow'
  | 'logic_intro'
  | 'logic_predict'
  | 'logic_result'
  | 'logic_table'
  | 'logic_policy'
  | 'summary'
  | 'freeplay'

const act = (id: string, label: string, icon?: ConsoleAction['icon'], extra?: Partial<ConsoleAction>): ConsoleAction => ({id, label, icon, ...(extra || {})})

const CHAPTER_OF: {[k: string]: number} = {
  tax_intro: 0,
  tax_steps: 0,
  tax_explore: 0,
  tax_quiz: 0,
  tax_result: 0,
  budget_intro: 1,
  budget_allocate: 1,
  budget_month: 1,
  budget_grow: 1,
  logic_intro: 2,
  logic_predict: 2,
  logic_result: 2,
  logic_table: 2,
  logic_policy: 2,
}

@component
export class CashfallMain extends BaseScriptComponent {
  @ui.label('Cashfall / Main')
  @ui.separator
  @ui.group_start('References')
  @input @hint('Lesson console in front of the machine') console!: CashfallConsoleUI
  @input @hint('Value chips around the machine') labels!: CashfallLabelsUI
  @input @hint('Head-relative intro / rescue card') intro!: CashfallIntroUI
  @input @hint('Surface placement + reticle') placement!: CashfallPlacement
  @input @hint('The money machine') machine!: CashfallMachine
  @input @hint('World-locked root that holds the machine, console and labels') machineRoot!: SceneObject
  @ui.group_end
  @ui.group_start('Settings')
  @input @hint('Ambient music volume') @widget(new SliderWidget(0, 0.5, 0.01)) musicVolume: number = 0.16
  @input @hint('Seconds of coin trickle after each tax change') @widget(new SliderWidget(0, 6, 0.5)) trickleSeconds: number = 3
  @input @hint('Log a read-only state snapshot after every action') debug: boolean = true
  @ui.group_end

  public state = new CashfallState()
  public page: Page = 'intro'
  public placed = false

  private audio!: CashfallAudio
  private tw = new Tweener()
  private chapterDone = [false, false, false]
  private taxStep = 0
  private busy = false
  private lastAction = -1
  private predicted: boolean | null = null
  private tableRuns = 0
  private freeFromSummary = false
  private outOfView = 0
  private rescueShown = false
  private growthValue = 0
  private helpOpen = false
  private helpReturn: Page = 'tax_intro'

  onAwake(): void {
    this.createEvent('OnStartEvent').bind(() => this.start())
    this.createEvent('UpdateEvent').bind(() => this.update())
  }

  private start(): void {
    if (!this.console || !this.labels || !this.intro || !this.placement || !this.machine || !this.machineRoot) {
      print('CashfallMain: missing scene reference')
      return
    }
    this.audio = new CashfallAudio(this.sceneObject, this.musicVolume)
    this.state.resetScenario(0)
    this.console.onAction.add((id) => this.handle(id))
    this.intro.onPlaceOnSurface.add(() => this.beginSurfacePlacement())
    this.intro.onPlaceInFront.add(() => this.placement.placeInFront())
    this.intro.onCancelPlacing.add(() => {
      this.placement.cancel()
      this.intro.setMode('welcome')
    })
    this.intro.onRecenter.add(() => this.recenter())
    this.placement.onPlaced.add((pose) => this.onPlaced(pose))
    this.placement.onSurfaceStatus.add((s) => {
      if (this.page !== 'placing') return
      this.intro.setHint(s === 'ready' ? 'Pinch to place here' : s === 'tooSteep' ? 'Too steep. Try a flatter surface.' : s === 'unavailable' ? 'No surface data here. Use "Place in front of me".' : 'Looking for a surface…')
    })
    this.machine.onCoinDropped.add((jar) => this.onCoinDropped(jar))
    this.machine.onJarTapped.add((jar) => this.onJarTapped(jar))
    this.machine.onJarHover.add(() => this.audio.play('hover'))
    this.machine.onGrabStart.add(() => this.audio.play('pop', this.machine.getAnchor('grab')))
    // Nothing is disabled synchronously here: every sibling must reach its own OnStart first.
    const boot = this.createEvent('DelayedCallbackEvent')
    boot.bind(() => {
      this.console.setVisible(false)
      this.goto('intro')
    })
    boot.reset(0.35)
  }

  // ---------------------------------------------------------------------------------------------
  // Placement
  // ---------------------------------------------------------------------------------------------

  private beginSurfacePlacement(): void {
    this.audio.play('click')
    this.page = 'placing'
    this.intro.setMode('placing')
    if (this.placement.surfaceAvailable) this.placement.beginSurface()
    else this.intro.setHint('No surface data here. Use "Place in front of me".')
  }

  private onPlaced(pose: PlacementPose): void {
    this.applyPose(pose)
    this.placed = true
    this.machineRoot.enabled = true
    this.intro.setMode('hidden')
    this.audio.play('place', this.machineRoot)
    this.machine.assemble(() => {
      this.goto('tax_intro')
    })
  }

  private applyPose(pose: PlacementPose): void {
    const t = this.machineRoot.getTransform()
    t.setWorldPosition(pose.position)
    t.setWorldRotation(quat.angleAxis(pose.yaw, vec3.up()))
  }

  private recenter(): void {
    const y = this.machineRoot.getTransform().getWorldPosition().y
    const pose = this.placement.recenterPose(this.placed ? y : 0)
    const t = this.machineRoot.getTransform()
    const from = t.getWorldPosition()
    const fromRot = t.getWorldRotation()
    const toRot = quat.angleAxis(pose.yaw, vec3.up())
    this.tw.to(0.6, (k) => {
      t.setWorldPosition(lerpVec(from, pose.position, k))
      t.setWorldRotation(quat.slerp(fromRot, toRot, k))
    }, Ease.inOutCubic)
    this.audio.play('click')
    if (this.page !== 'intro' && this.page !== 'placing') this.intro.setMode('hidden')
    this.rescueShown = false
    this.outOfView = 0
  }

  // ---------------------------------------------------------------------------------------------
  // Page router
  // ---------------------------------------------------------------------------------------------

  private goto(page: Page): void {
    this.page = page
    this.busy = false
    const chapter = CHAPTER_OF[page]
    this.console.setChapter(chapter === undefined ? -1 : chapter, this.chapterDone)
    this.console.setVisible(page !== 'intro' && page !== 'placing')
    this.labels.hideAll()
    const s = this.state.scenario
    const tax = this.state.tax
    switch (page) {
      case 'intro':
        this.machineRoot.enabled = this.placed
        this.machine.setStage('hidden', true)
        this.intro.setMode('welcome')
        break
      case 'placing':
        this.intro.setMode('placing')
        break
      case 'tax_intro':
        this.machine.setStage('tax')
        this.state.gross = s.gross
        this.tw.delay(0.55, () => {
          this.machine.setTax(this.state.tax, true, true)
          this.machine.setStream(3)
          this.audio.play('flow', this.machine.getAnchor('hopper'))
        })
        this.showTaxLabels(false)
        this.console.setCopy(
          'CHAPTER 1  ·  THE FALLS',
          'Your paycheck lands at the top',
          money(s.gross) + ' comes in this month. Before you can spend it, it falls down three tax steps. Each step only taxes the dollars that land on it.',
          'Practice rates, not a real tax schedule.',
          'neutral'
        )
        this.console.setActions([[act('next', 'Show me the steps', 'next', {primary: true})]])
        break
      case 'tax_steps':
        this.machine.setStage('tax')
        this.showTaxLabels(true)
        this.renderTaxStep()
        break
      case 'tax_explore':
        this.machine.setStage('tax')
        this.machine.highlightTerrace(-1)
        this.machine.setStream(3)
        this.showTaxLabels(true)
        this.renderExplore()
        break
      case 'tax_quiz':
        this.machine.setStage('tax')
        this.machine.setStream(2)
        this.state.gross = s.gross
        this.machine.setTax(this.state.tax, true, false)
        this.showTaxLabels(true)
        this.console.setCopy(
          'CHAPTER 1  ·  MYTH CHECK',
          'A $500 raise lands on the 20% step',
          'Right now you make ' + money(s.gross) + '. A raise adds $500 on top, and every new dollar lands on the 20% step. Does your take-home pay go DOWN?',
          'Think about which dollars the top step can touch.',
          'neutral'
        )
        this.console.setActions([[act('quiz_yes', 'Yes, I lose money', 'close'), act('quiz_no', 'No, it goes up', 'check', {primary: true})]])
        break
      case 'tax_result': {
        const before = taxBreakdown(s.gross)
        const after = taxBreakdown(s.gross + 500)
        const correct = this.state.taxQuizAnswer === false
        this.state.gross = s.gross + 500
        this.machine.runRaise(before, after)
        this.machine.setStream(4)
        this.audio.play('flow', this.machine.getAnchor('hopper'))
        this.showTaxLabels(true)
        const deltaTake = after.takeHome - before.takeHome
        this.console.setCopy(
          'CHAPTER 1  ·  ' + (correct ? 'NICE CALL' : 'GOOD TO KNOW'),
          correct ? 'Right: take-home goes up' : 'Take-home still goes up',
          'The raise adds $500 of gross pay. Only those $500 are taxed at 20%, so $100 goes to tax and ' + money(deltaTake) + ' reaches you. Nothing you already earned is touched. That is what a marginal rate means.',
          'Effective rate: ' + percent(after.effectiveRate, 1) + ' overall, even though the top step is 20%.',
          correct ? 'success' : 'neutral'
        )
        this.audio.play(correct ? 'correct' : 'wrong', this.machine.getAnchor('tube'))
        this.console.setActions([[act('back', 'Back', 'back'), act('next', 'On to the budget', 'next', {primary: true})]])
        break
      }
      case 'budget_intro':
        this.chapterDone[0] = true
        this.console.setChapter(1, this.chapterDone)
        this.state.gross = s.gross
        this.state.resetBudget()
        this.machine.setStage('budget')
        this.machine.setJarGuides(JAR_GUIDE, s.coinCount, true)
        this.machine.setBudget([0, 0, 0], s.coinCount)
        this.tw.delay(0.6, () => this.audio.play('pop', this.machine.getAnchor('basin')))
        this.showBudgetLabels()
        this.console.setCopy(
          'CHAPTER 2  ·  THE SPLIT',
          'Give every coin a job',
          'Your take-home of ' + money(tax.takeHome) + ' is now ' + s.coinCount + ' coins of ' + money(this.state.coinVal) + '. Three jars: NEEDS (rent, food, bills), WANTS (fun), SAVE (future you). The rings mark a common 50 / 30 / 20 starting split.',
          'This month needs ' + money(s.needsCoins * this.state.coinVal) + ' for essentials. Surprises happen.',
          'neutral'
        )
        this.console.setActions([[act('back', 'Back', 'back'), act('next', 'Start splitting', 'next', {primary: true})]])
        break
      case 'budget_allocate':
        this.machine.setStage('budget')
        this.machine.setJarGuides(JAR_GUIDE, s.coinCount, true)
        this.machine.setBudget(this.state.alloc, this.state.remaining)
        this.machine.setGrabbable(this.state.remaining > 0)
        this.showBudgetLabels()
        this.renderAllocate()
        break
      case 'budget_month':
        this.runMonthPage()
        break
      case 'budget_grow':
        this.renderGrow()
        break
      case 'logic_intro': {
        this.chapterDone[1] = true
        this.console.setChapter(2, this.chapterDone)
        this.machine.setStage('logic')
        this.state.overrideA = null
        this.state.overrideB = null
        this.state.op = 'AND'
        this.machine.resetCart()
        this.machine.setGate(false, false)
        const checks = purchaseChecks(s, this.state.coinVal, this.state.alloc)
        this.tw.delay(0.5, () => this.machine.setLamps(checks.a, checks.b))
        this.showLogicLabels()
        this.console.setCopy(
          'CHAPTER 3  ·  THE GATE',
          'A purchase shows up: ' + s.purchaseLabel,
          'It costs ' + money(s.purchasePrice) + '. Before it can pass, two checks light up from YOUR budget. A: needs are covered. B: after buying, the cushion of ' + money(checks.cushion) + ' stays intact. A gate combines A and B with AND or OR.',
          'A is ' + (checks.a ? 'TRUE' : 'FALSE') + ' and B is ' + (checks.b ? 'TRUE' : 'FALSE') + ' for your split.',
          'neutral'
        )
        this.console.setActions([[act('back', 'Back', 'back'), act('next', 'Try the AND gate', 'next', {primary: true})]])
        break
      }
      case 'logic_predict': {
        this.machine.setStage('logic')
        this.machine.resetCart()
        this.machine.setGate(false, true)
        const l = this.state.lamps()
        this.machine.setLamps(l.a, l.b)
        this.showLogicLabels()
        this.predicted = null
        this.console.setCopy(
          'CHAPTER 3  ·  PREDICT',
          'AND opens only when both are true',
          'A is ' + (l.a ? 'TRUE' : 'FALSE') + '. B is ' + (l.b ? 'TRUE' : 'FALSE') + '. The gate is set to AND. Will the cart get through?',
          'Make a call, then run it.',
          'neutral'
        )
        this.console.setActions([[act('predict_open', 'It passes', 'check', {primary: true}), act('predict_shut', 'It is blocked', 'close')]])
        break
      }
      case 'logic_result':
        break
      case 'logic_table':
        this.machine.setStage('logic')
        this.showLogicLabels()
        this.renderTable()
        break
      case 'logic_policy':
        this.machine.setStage('logic')
        this.showLogicLabels()
        this.console.setCopy(
          'CHAPTER 3  ·  POLICY',
          'Which gate enforces "both checks must pass"?',
          'Your rule for this purchase: needs covered AND the cushion stays intact. One operator matches that rule. The other opens the gate when only one check is true.',
          '',
          'none'
        )
        this.console.setActions([[act('policy_and', 'AND', 'check', {primary: true}), act('policy_or', 'OR', 'bolt')]])
        break
      case 'summary':
        this.chapterDone[2] = true
        this.console.setChapter(-1, this.chapterDone)
        this.machine.setStage('summary')
        this.machine.hideGrowth()
        this.machine.setJarGuides(JAR_GUIDE, s.coinCount, false)
        this.renderSummary()
        break
      case 'freeplay':
        this.machine.setStage('budget')
        this.machine.setJarGuides(JAR_GUIDE, s.coinCount, true)
        this.machine.setBudget(this.state.alloc, this.state.remaining)
        this.machine.setGrabbable(this.state.remaining > 0)
        this.showBudgetLabels()
        this.console.setCopy('FREE PLAY', 'Rebuild the split any way you like', 'Pinch coins into jars or tap a jar. Run the month as often as you want. The gate stage follows from whatever you decide here.', 'Coins left: ' + this.state.remaining, 'neutral')
        this.console.setActions([[act('undo', 'Undo', 'back', {disabled: this.state.history.length === 0}), act('auto', '50 / 30 / 20', 'savings'), act('run_month', 'Run month', 'bolt', {primary: true, disabled: this.state.remaining > 0})], [act('to_gate', 'Jump to gate', 'cart'), act('to_summary', 'Back to summary', 'done')]])
        break
    }
    this.log('page ' + page)
  }

  // ---------------------------------------------------------------------------------------------
  // Page renderers
  // ---------------------------------------------------------------------------------------------

  private showTaxLabels(detail: boolean): void {
    const r = this.state.tax
    const m = this.machine
    const place = (id: string, anchor: string, local: vec3) => m.anchorPosition(anchor).add(local)
    this.labels.setChip('gross', {title: 'PAYCHECK', value: money(r.gross), tone: 'gold', visible: true, position: place('gross', 'hopper', new vec3(0, 1.5, 4)), width: 12})
    this.labels.setChip('tax', {title: 'TAX', value: money(r.tax), tone: 'coral', visible: true, position: place('tax', 'tube', new vec3(0, 0.8, 3)), width: 10})
    this.labels.setChip('takehome', {title: 'TAKE-HOME', value: money(r.takeHome), tone: 'cyan', visible: true, position: place('takehome', 'basin', new vec3(0, 0, 8)), width: 13})
    const rates = ['0%', '10%', '20%']
    const ranges = ['first $1,000', '$1,000 – $3,000', 'above $3,000']
    for (let i = 0; i < 3; i++) {
      this.labels.setChip('rate' + i, {
        title: detail ? ranges[i] : '',
        value: rates[i],
        tone: i === 0 ? 'mint' : i === 1 ? 'gold' : 'coral',
        visible: true,
        position: place('rate' + i, 'terrace' + i, new vec3(-3.5, 1.4, 1)),
        width: 9.6,
        height: detail ? 3.6 : 2.6,
      })
    }
    this.labels.setChip('rate_eff', {title: 'EFFECTIVE RATE', value: percent(r.effectiveRate, 1), tone: 'ivory', visible: detail, position: place('rate_eff', 'tube', new vec3(0, 5.6, 3)), width: 10, height: 4.0})
  }

  private renderTaxStep(): void {
    const r = this.state.tax
    const s = this.state.scenario
    const i = this.taxStep
    const slice = r.slices[Math.min(2, i)]
    const copy = [
      ['Step 1: the first $1,000 at 0%', 'The first $1,000 of ' + money(s.gross) + ' lands on the top step. Rate 0%, so all ' + money(slice.amount) + ' keeps falling.', 'Nothing peels off here.'],
      ['Step 2: $1,000 to $3,000 at 10%', 'The next ' + money(r.slices[1].amount) + ' lands on the second step. 10% of it, ' + money(r.slices[1].tax) + ', peels off into the tax tube. The rest keeps falling.', 'Only this slice pays 10%.'],
      ['Step 3: above $3,000 at 20%', money(r.slices[2].amount) + ' is above $3,000, so it lands on the bottom step. 20% of that slice, ' + money(r.slices[2].tax) + ', goes to the tube.', 'The first $3,000 never see this rate.'],
      ['Tax ' + money(r.tax) + ', take-home ' + money(r.takeHome), 'Add the three slices: ' + money(r.slices[0].tax) + ' + ' + money(r.slices[1].tax) + ' + ' + money(r.slices[2].tax) + ' = ' + money(r.tax) + ' of tax. ' + money(r.takeHome) + ' lands in the basin. That is ' + percent(r.effectiveRate, 1) + ' of your pay overall, your effective rate.', 'Marginal rate: the step your last dollar lands on. Effective rate: tax divided by everything.'],
    ]
    this.machine.highlightTerrace(i < 3 ? i : -1)
    this.machine.setStream(i < 3 ? 4 : 2.5)
    if (i < 3) this.audio.play('flow', this.machine.getAnchor('terrace' + i), 0.5)
    else this.audio.play('coin', this.machine.getAnchor('basin'))
    this.console.setCopy('CHAPTER 1  ·  STEP ' + (i + 1) + ' OF 4', copy[i][0], copy[i][1], copy[i][2], i === 3 ? 'success' : 'neutral')
    this.console.setActions([[act('back', 'Back', 'back'), act('next', i === 3 ? 'Let me try' : 'Next', 'next', {primary: true})]])
  }

  private renderExplore(): void {
    const r = this.state.tax
    this.console.setCopy(
      'CHAPTER 1  ·  EXPLORE',
      'Change the paycheck, watch the tube',
      'Gross ' + money(r.gross) + '  →  tax ' + money(r.tax) + '  →  take-home ' + money(r.takeHome) + '. The top step is ' + percent(r.topRate) + ', but overall you pay ' + percent(r.effectiveRate, 1) + '.',
      r.gross <= 1000 ? 'At $1,000 nothing reaches the 10% step.' : r.gross <= 3000 ? 'Below $3,000 the 20% step stays empty.' : 'Only the slice above $3,000 pays 20%.',
      'neutral'
    )
    this.console.setActions([
      [act('gross_down', '− $500', 'remove', {disabled: r.gross <= GROSS_MIN}), act('gross_up', '+ $500', 'add', {disabled: r.gross >= GROSS_MAX})],
      [act('back', 'Back', 'back'), act('next', 'Myth check', 'help', {primary: true})],
    ])
  }

  private showBudgetLabels(): void {
    const s = this.state.scenario
    const v = this.state.coinVal
    const place = (anchor: string, local: vec3) => this.machine.anchorPosition(anchor).add(local)
    const tones: ('cyan' | 'lavender' | 'mint')[] = ['cyan', 'lavender', 'mint']
    for (let j = 0; j < 3; j++) {
      const n = this.state.alloc[j]
      this.labels.setChip('jar' + j, {title: JAR_NAMES[j], value: money(n * v) + '  (' + n + ')', tone: tones[j], visible: true, position: place('jar' + j, new vec3(0, -2.5, 8.5)), width: 11.5})
    }
    this.labels.setChip('basin', {title: 'TO SPLIT', value: this.state.remaining + ' × ' + money(v), tone: 'gold', visible: true, position: place('basin', new vec3(0, 4.5, 0)), width: 11.5})
    this.labels.setChip('needsFloor', {title: 'NEEDS THIS MONTH', value: money(s.needsCoins * v), tone: 'ivory', visible: true, position: place('jar0', new vec3(-2, 13.5, -9)), width: 12, height: 4.0})
  }

  private renderAllocate(): void {
    const s = this.state.scenario
    const left = this.state.remaining
    const done = left === 0
    const floorOk = this.state.alloc[0] >= s.needsCoins
    this.console.setCopy(
      'CHAPTER 2  ·  YOUR SPLIT',
      done ? 'Every coin has a job' : left + (left === 1 ? ' coin' : ' coins') + ' left to place',
      done
        ? 'NEEDS ' + money(this.state.alloc[0] * this.state.coinVal) + ', WANTS ' + money(this.state.alloc[1] * this.state.coinVal) + ', SAVE ' + money(this.state.alloc[2] * this.state.coinVal) + '. Ready to run the month and see what happens?'
        : 'Pinch the floating coin and drop it into a jar, or tap a jar to send a coin there. Needs come first, then a cushion for surprises, then wants.',
      done ? (floorOk ? 'Needs are covered. Let us see if the cushion holds.' : 'Heads up: NEEDS is below ' + money(s.needsCoins * this.state.coinVal) + '. You can still run it.') : 'Rings show the 50 / 30 / 20 guide.',
      done ? (floorOk ? 'success' : 'alert') : 'neutral'
    )
    this.console.setActions([
      [act('undo', 'Undo', 'back', {disabled: this.state.history.length === 0}), act('auto', '50 / 30 / 20', 'savings'), act('run_month', 'Run the month', 'bolt', {primary: true, disabled: !done})],
    ])
  }

  private runMonthPage(): void {
    const s = this.state.scenario
    const v = this.state.coinVal
    const result = runMonth(s, v, this.state.alloc)
    this.state.monthResult = result
    this.state.attempts++
    this.machine.setGrabbable(false)
    this.busy = true
    this.showBudgetLabels()
    this.labels.hide('basin')
    this.console.setCopy('CHAPTER 2  ·  THE MONTH', 'Rent, food and bills get paid first…', 'Watch the jars.', '', 'none')
    this.console.setActions([[act('wait', 'Running…', 'bolt', {disabled: true})]])
    const needsCoins = Math.min(this.state.alloc[0], s.needsCoins)
    const fromSave = Math.ceil(result.fromSave / v)
    const fromWants = Math.ceil(result.fromWants / v)
    this.tw.delay(0.3, () => this.audio.play('coin', this.machine.getAnchor('jar0')))
    this.tw.delay(2.0 + needsCoins * 0.2, () => {
      this.audio.play('surprise', this.machine.getAnchor('jar2'))
      this.labels.setChip('bill', {title: 'SURPRISE: ' + s.surpriseLabel.toUpperCase(), value: money(s.surpriseAmount), tone: 'coral', visible: true, position: this.localOf('bill', new vec3(0, 6, 2)), width: 15, height: 3.8})
      this.console.setCopy('CHAPTER 2  ·  THE MONTH', 'Surprise: ' + s.surpriseLabel + ', ' + money(s.surpriseAmount), 'The bill comes out of SAVE first. If SAVE runs dry it raids WANTS.', '', 'none')
    })
    const total = this.machine.runMonth(needsCoins, fromSave, fromWants, () => {
      this.labels.hide('bill')
      const after = [this.state.alloc[0] - needsCoins, this.state.alloc[1] - fromWants, this.state.alloc[2] - fromSave]
      this.machine.setBudget(after.map((n) => Math.max(0, n)), 0)
      for (let j = 0; j < 3; j++) {
        const dollars = j === 0 ? result.needsPaid - result.needsPaid : j === 1 ? result.wantsAfter : result.saveAfter
        this.labels.setChip('jar' + j, {value: money(dollars) + (j === 0 ? '  (paid)' : ''), pop: true})
      }
      let title: string
      let body: string
      let note: string
      let tone: NoteTone
      if (result.success) {
        title = 'The cushion held'
        body = 'Needs were paid in full and the ' + money(s.surpriseAmount) + ' bill came out of SAVE, leaving ' + money(result.saveAfter) + '. WANTS stayed untouched. That is what an emergency cushion is for.'
        note = 'Saving ' + money(this.state.alloc[2] * v) + ' a month covered the surprise with room to spare.'
        tone = 'success'
        this.audio.play('correct', this.machine.getAnchor('jar2'))
      } else if (!result.needsCovered) {
        title = 'Needs came up short'
        body = 'Essentials needed ' + money(s.needsCoins * v) + ' but NEEDS only held ' + money(this.state.alloc[0] * v) + '. ' + money(result.needsShort) + ' of rent, food or bills went unpaid. Needs always come first.'
        note = 'Retry and move at least ' + Math.ceil(result.needsShort / v) + ' more coin' + (Math.ceil(result.needsShort / v) === 1 ? '' : 's') + ' into NEEDS.'
        tone = 'alert'
        this.audio.play('wrong', this.machine.getAnchor('jar0'))
      } else {
        title = 'The surprise raided WANTS'
        body = 'SAVE held ' + money(this.state.alloc[2] * v) + ' but the bill was ' + money(s.surpriseAmount) + '. The missing ' + money(result.fromWants + result.uncovered) + ' came out of WANTS' + (result.uncovered > 0 ? ', and ' + money(result.uncovered) + ' is still unpaid.' : '.') + ' A bigger cushion would have absorbed it.'
        note = 'Retry with at least ' + Math.ceil(s.surpriseAmount / v) + ' coins in SAVE.'
        tone = 'alert'
        this.audio.play('wrong', this.machine.getAnchor('jar1'))
      }
      this.busy = false
      this.console.setCopy('CHAPTER 2  ·  RESULT', title, body, note, tone)
      this.console.setActions([[act('retry_month', 'Retry the split', 'replay'), act('next', result.success ? 'See it grow' : 'Continue anyway', 'growth', {primary: true})]])
      this.log('month ' + JSON.stringify(result))
    })
    this.log('month running for ' + total.toFixed(1) + 's')
  }

  private renderGrow(): void {
    const s = this.state.scenario
    const monthly = this.state.alloc[2] * this.state.coinVal
    const fv = compoundMonthly(monthly, s.growthRate, s.growthYears)
    const contributed = monthly * s.growthYears * 12
    this.growthValue = 0
    this.machine.setStage('budget')
    this.labels.setChip('growth', {title: 'IN ' + s.growthYears + ' YEARS AT ' + percent(s.growthRate), value: money(0), tone: 'mint', visible: true, position: this.localOf('growth', new vec3(0, 36, 2)), width: 14, height: 4})
    this.audio.play('grow', this.machine.getAnchor('growth'))
    this.machine.showGrowth(clamp(fv / 150000, 0.15, 1), 3.2, (k) => {
      this.growthValue = fv * k
      this.labels.setChip('growth', {value: money(this.growthValue), pop: false})
    })
    this.console.setCopy(
      'CHAPTER 2  ·  THE HABIT',
      monthly > 0 ? money(monthly) + ' a month becomes ' + money(fv) : 'Nothing in SAVE grows',
      monthly > 0
        ? 'Keep that SAVE habit for ' + s.growthYears + ' years at ' + percent(s.growthRate) + ' a year and the column on the right is what you end up with. You put in ' + money(contributed) + '; the rest, ' + money(fv - contributed) + ', is growth on growth.'
        : 'With nothing in SAVE there is no cushion and nothing compounds. Even a small habit changes the column on the right.',
      monthly > 0 ? 'Interest earns interest. Time does the heavy lifting.' : 'Try the retry and move a coin or two into SAVE.',
      monthly > 0 ? 'success' : 'alert'
    )
    this.console.setActions([[act('back', 'Back', 'back'), act('next', 'On to the gate', 'next', {primary: true})]])
  }

  private showLogicLabels(): void {
    const s = this.state.scenario
    const l = this.state.lamps()
    const checks = purchaseChecks(s, this.state.coinVal, this.state.alloc)
    this.labels.setChip('lampA', {title: 'A  ·  NEEDS COVERED', value: l.a ? 'TRUE' : 'FALSE', tone: l.a ? 'mint' : 'coral', visible: true, position: this.localOf('lampA', new vec3(0, 1.2, 2)), width: 11, height: 4.0})
    this.labels.setChip('lampB', {title: 'B  ·  CUSHION HOLDS', value: l.b ? 'TRUE' : 'FALSE', tone: l.b ? 'mint' : 'coral', visible: true, position: this.localOf('lampB', new vec3(0, 1.2, 2)), width: 11, height: 4.0})
    this.labels.setChip('op', {title: 'GATE', value: this.state.op, tone: 'gold', visible: true, position: this.localOf('gate', new vec3(0, 6.5, 2)), width: 8, height: 4.0})
    this.labels.setChip('purchase', {title: s.purchaseLabel.toUpperCase(), value: money(s.purchasePrice), tone: 'lavender', visible: true, position: this.localOf('cart', new vec3(0, 3.5, 2)), width: 12})
    this.labels.setChip('cushion', {title: 'SAVE AFTER BUYING vs CUSHION', value: money(checks.saveAfterBuy) + ' vs ' + money(checks.cushion), tone: checks.b ? 'mint' : 'coral', visible: true, position: this.localOf('lampB', new vec3(14.5, 1.2, 2)), width: 16, height: 4.0})
  }

  private renderTable(): void {
    const l = this.state.lamps()
    const lines: string[] = []
    const ops: Op[] = ['AND', 'OR']
    for (let o = 0; o < 2; o++) {
      for (let a = 0; a < 2; a++) {
        for (let b = 0; b < 2; b++) {
          const key = rowKey(a === 1, b === 1, ops[o])
          const found = this.state.discovered[key]
          const res = gateOpen(a === 1, b === 1, ops[o])
          lines.push((a ? 'T' : 'F') + ' ' + ops[o] + ' ' + (b ? 'T' : 'F') + '  =  ' + (found ? (res ? 'OPEN' : 'SHUT') : '?'))
        }
      }
    }
    const table = lines.slice(0, 4).join('\n') + '\n\n' + lines.slice(4).join('\n')
    this.labels.setChip('table', {title: 'TRUTH TABLE  ·  ' + this.state.discoveredCount + ' / 8', value: table, tone: 'ivory', visible: true, position: new vec3(-24.5, 26, 4), width: 14, height: 14})
    const n = this.state.discoveredCount
    this.console.setCopy(
      'CHAPTER 3  ·  TRUTH TABLE  ·  ' + n + ' OF 8',
      n >= 8 ? 'Every row discovered' : 'Flip the checks, switch the gate, run it',
      n >= 8
        ? 'AND opened once: only when both were true. OR shut once: only when both were false. Every other case split them.'
        : 'Override A and B, pick AND or OR, then run the cart. Each new combination fills a row of the table on the left.',
      'A is ' + (l.a ? 'TRUE' : 'FALSE') + ', B is ' + (l.b ? 'TRUE' : 'FALSE') + ', gate is ' + this.state.op + '.',
      n >= 8 ? 'success' : 'neutral'
    )
    this.console.setActions([
      [act('tog_a', 'A: ' + (l.a ? 'TRUE' : 'FALSE'), 'bolt', {toggled: l.a}), act('tog_b', 'B: ' + (l.b ? 'TRUE' : 'FALSE'), 'bolt', {toggled: l.b}), act('tog_op', 'Gate: ' + this.state.op, 'help', {toggled: this.state.op === 'OR'})],
      [act('run_cart', 'Run the cart', 'cart', {primary: true, disabled: this.busy}), act('next', n >= 4 ? 'Pick the policy' : 'Skip ahead', 'next')],
    ])
  }

  private renderSummary(): void {
    const s = this.state.scenario
    const r = taxBreakdown(s.gross)
    const v = this.state.coinVal
    const m = this.state.monthResult
    const monthly = this.state.alloc[2] * v
    const fv = compoundMonthly(monthly, s.growthRate, s.growthYears)
    const policyOk = this.state.policyAnswer === 'AND'
    this.labels.setChip('sum1', {title: 'PAYCHECK → TAX → TAKE-HOME', value: money(r.gross) + ' → ' + money(r.tax) + ' → ' + money(r.takeHome), tone: 'gold', visible: true, position: new vec3(0, 42, -4), width: 30, height: 4.2})
    this.labels.setChip('sum2', {title: 'YOUR SPLIT', value: 'Needs ' + money(this.state.alloc[0] * v) + '   Wants ' + money(this.state.alloc[1] * v) + '   Save ' + money(this.state.alloc[2] * v), tone: 'cyan', visible: true, position: new vec3(0, 36.5, -4), width: 34, height: 4.2})
    this.labels.setChip('sum3', {title: 'THE MONTH', value: m ? (m.success ? 'Cushion held, ' + money(m.saveAfter) + ' left' : !m.needsCovered ? 'Needs short by ' + money(m.needsShort) : 'Surprise raided WANTS') : 'Not run', tone: m && m.success ? 'mint' : 'coral', visible: true, position: new vec3(-9, 31, -4), width: 17, height: 4.2})
    this.labels.setChip('sum4', {title: s.growthYears + '-YEAR HABIT', value: money(fv), tone: 'mint', visible: true, position: new vec3(10, 31, -4), width: 15, height: 4.2})
    this.machine.setBudget(this.state.alloc, 0)
    this.machine.showGrowth(clamp(fv / 150000, 0.15, 1), 1.2)
    this.console.setCopy(
      'YOUR MONTH  ·  ' + s.title.toUpperCase(),
      'Three things to keep',
      '1. Only the dollars on a step pay that step\'s rate, so a raise never lowers take-home.\n2. Needs first, then a cushion, then wants. The cushion is what turns a surprise into a shrug.\n3. "Both must hold" is an AND. OR lets a purchase through on one check alone.',
      policyOk ? 'You picked AND for the policy. That is the rule that protects the cushion.' : 'The policy that protects the cushion is AND.',
      policyOk ? 'success' : 'neutral'
    )
    this.console.setActions([
      [act('replay', 'Replay', 'replay'), act('new_scenario', 'New scenario', 'next', {primary: true}), act('free', 'Free play', 'touch')],
    ])
  }

  // ---------------------------------------------------------------------------------------------
  // Action handling
  // ---------------------------------------------------------------------------------------------

  private handle(id: string): void {
    const now = getTime()
    if (now - this.lastAction < 0.12) return
    this.lastAction = now
    if (id === 'mute') {
      const m = this.audio.toggle()
      this.console.setMuted(m)
      return
    }
    if (id === 'recenter') {
      this.recenter()
      return
    }
    if (id === 'restart') {
      this.audio.play('click')
      this.restart()
      return
    }
    if (id === 'help') {
      this.audio.play('click')
      this.toggleHelp()
      return
    }
    if (this.helpOpen) {
      if (id === 'help_close') {
        this.helpOpen = false
        this.goto(this.helpReturn)
      }
      return
    }
    if (this.busy && id !== 'wait') return
    this.audio.play('click')
    const s = this.state.scenario
    switch (this.page) {
      case 'tax_intro':
        if (id === 'next') {
          this.taxStep = 0
          this.goto('tax_steps')
        }
        break
      case 'tax_steps':
        if (id === 'next') {
          if (this.taxStep < 3) {
            this.taxStep++
            this.renderTaxStep()
          } else this.goto('tax_explore')
        } else if (id === 'back') {
          if (this.taxStep > 0) {
            this.taxStep--
            this.renderTaxStep()
          } else this.goto('tax_intro')
        }
        break
      case 'tax_explore':
        if (id === 'gross_up' || id === 'gross_down') {
          const next = clamp(this.state.gross + (id === 'gross_up' ? GROSS_STEP : -GROSS_STEP), GROSS_MIN, GROSS_MAX)
          if (next !== this.state.gross) {
            this.state.gross = next
            this.machine.setTax(this.state.tax, true, true)
            this.machine.setStream(7)
            this.tw.clear('trickle')
            this.tw.delay(1.6, () => this.machine.setStream(3), 'trickle')
            this.audio.play('flow', this.machine.getAnchor('hopper'), 0.3)
            this.showTaxLabels(true)
            this.renderExplore()
          }
        } else if (id === 'next') {
          this.goto('tax_quiz')
        } else if (id === 'back') {
          this.taxStep = 3
          this.goto('tax_steps')
        }
        break
      case 'tax_quiz':
        if (id === 'quiz_yes' || id === 'quiz_no') {
          this.state.taxQuizAnswer = id === 'quiz_yes'
          this.goto('tax_result')
        }
        break
      case 'tax_result':
        if (id === 'next') this.goto('budget_intro')
        else if (id === 'back') this.goto('tax_quiz')
        break
      case 'budget_intro':
        if (id === 'next') this.goto('budget_allocate')
        else if (id === 'back') this.goto('tax_result')
        break
      case 'budget_allocate':
      case 'freeplay':
        if (id === 'undo') {
          const jar = this.state.undo()
          if (jar >= 0) {
            this.machine.returnCoin(jar)
            this.afterAllocationChange()
          }
        } else if (id === 'auto') {
          this.state.autoSplit()
          this.machine.setBudget(this.state.alloc, this.state.remaining)
          for (let j = 0; j < 3; j++) this.tw.delay(0.1 * j, () => this.audio.play('coin', this.machine.getAnchor('jar' + j)))
          this.afterAllocationChange()
        } else if (id === 'run_month') {
          if (this.state.remaining === 0) this.goto('budget_month')
        } else if (id === 'to_gate') {
          this.freeFromSummary = true
          this.goto('logic_intro')
        } else if (id === 'to_summary') {
          this.goto('summary')
        }
        break
      case 'budget_month':
        if (id === 'retry_month') {
          this.state.resetBudget()
          this.goto('budget_allocate')
        } else if (id === 'next') {
          this.goto(this.freeFromSummary ? 'summary' : 'budget_grow')
        }
        break
      case 'budget_grow':
        if (id === 'next') this.goto('logic_intro')
        else if (id === 'back') {
          this.machine.hideGrowth()
          this.state.resetBudget()
          this.goto('budget_allocate')
        }
        break
      case 'logic_intro':
        if (id === 'next') this.goto('logic_predict')
        else if (id === 'back') this.goto('budget_grow')
        break
      case 'logic_predict':
        if (id === 'predict_open' || id === 'predict_shut') {
          this.predicted = id === 'predict_open'
          this.runPrediction()
        }
        break
      case 'logic_result':
        if (id === 'next') this.goto('logic_table')
        else if (id === 'back') this.goto('logic_predict')
        break
      case 'logic_table':
        if (id === 'tog_a') {
          const l = this.state.lamps()
          this.state.overrideA = !l.a
          this.afterLampChange()
        } else if (id === 'tog_b') {
          const l = this.state.lamps()
          this.state.overrideB = !l.b
          this.afterLampChange()
        } else if (id === 'tog_op') {
          this.state.op = this.state.op === 'AND' ? 'OR' : 'AND'
          this.afterLampChange()
        } else if (id === 'run_cart') {
          this.runTableRow()
        } else if (id === 'next') {
          this.goto('logic_policy')
        }
        break
      case 'logic_policy':
        if (id === 'policy_and' || id === 'policy_or') {
          this.state.policyAnswer = id === 'policy_and' ? 'AND' : 'OR'
          const ok = this.state.policyAnswer === 'AND'
          this.audio.play(ok ? 'correct' : 'wrong', this.machine.getAnchor('gate'))
          this.console.setCopy(
            'CHAPTER 3  ·  ' + (ok ? 'EXACTLY' : 'NOT QUITE'),
            ok ? 'AND is the rule' : 'OR lets one check carry the day',
            ok
              ? 'With AND the cart only passes when needs are covered AND the cushion survives. One failed check is enough to stop a purchase that would hurt.'
              : 'OR opens the gate when either check is true, so a purchase could pass with needs uncovered or the cushion drained. "Both must hold" is an AND.',
            'Logic gates are just rules written down precisely enough for a machine.',
            ok ? 'success' : 'alert'
          )
          this.console.setActions([[act('next', 'See your month', 'done', {primary: true})]])
          this.page = 'logic_policy'
          this.helpReturn = 'summary'
          this.policyAnswered = true
        } else if (id === 'next' && this.policyAnswered) {
          this.goto('summary')
        }
        break
      case 'summary':
        if (id === 'replay') {
          this.chapterDone = [false, false, false]
          this.state.resetScenario(this.state.scenarioIndex)
          this.freeFromSummary = false
          this.policyAnswered = false
          this.goto('tax_intro')
        } else if (id === 'new_scenario') {
          this.chapterDone = [false, false, false]
          this.state.resetScenario((this.state.scenarioIndex + 1) % SCENARIOS.length)
          this.freeFromSummary = false
          this.policyAnswered = false
          this.goto('tax_intro')
        } else if (id === 'free') {
          this.freeFromSummary = true
          this.state.resetBudget()
          this.machine.hideGrowth()
          this.goto('freeplay')
        }
        break
    }
    this.log('action ' + id)
  }

  private policyAnswered = false

  private afterAllocationChange(): void {
    this.machine.setGrabbable(this.state.remaining > 0)
    this.showBudgetLabels()
    if (this.page === 'freeplay') {
      this.console.setNote('Coins left: ' + this.state.remaining, 'neutral')
      this.console.setActions([[act('undo', 'Undo', 'back', {disabled: this.state.history.length === 0}), act('auto', '50 / 30 / 20', 'savings'), act('run_month', 'Run month', 'bolt', {primary: true, disabled: this.state.remaining > 0})], [act('to_gate', 'Jump to gate', 'cart'), act('to_summary', 'Back to summary', 'done')]])
    } else this.renderAllocate()
  }

  private onCoinDropped(jar: number): void {
    if (this.page !== 'budget_allocate' && this.page !== 'freeplay') return
    if (jar < 0) {
      this.audio.play('pop', this.machine.getAnchor('basin'))
      return
    }
    if (this.state.allocate(jar)) {
      this.machine.setBudget(this.state.alloc, this.state.remaining, jar)
      this.audio.play('coin', this.machine.getAnchor('jar' + jar))
      this.afterAllocationChange()
    }
  }

  private onJarTapped(jar: number): void {
    if (this.page !== 'budget_allocate' && this.page !== 'freeplay') return
    if (this.busy) return
    if (this.state.allocate(jar)) {
      this.machine.setBudget(this.state.alloc, this.state.remaining, jar)
      this.audio.play('coin', this.machine.getAnchor('jar' + jar))
      this.afterAllocationChange()
    } else this.audio.play('pop', this.machine.getAnchor('jar' + jar))
  }

  private runPrediction(): void {
    const l = this.state.lamps()
    const open = gateOpen(l.a, l.b, 'AND')
    this.state.discovered[rowKey(l.a, l.b, 'AND')] = true
    this.busy = true
    this.console.setCopy('CHAPTER 3  ·  RUNNING', 'Here it comes…', 'A ' + (l.a ? 'TRUE' : 'FALSE') + ', B ' + (l.b ? 'TRUE' : 'FALSE') + ', gate AND.', '', 'none')
    this.console.setActions([[act('wait', 'Running…', 'cart', {disabled: true})]])
    this.audio.play(open ? 'gateOpen' : 'gateClosed', this.machine.getAnchor('gate'))
    this.machine.runCart(open, (passed) => {
      const correct = this.predicted === passed
      this.busy = false
      this.page = 'logic_result'
      this.audio.play(correct ? 'correct' : 'wrong', this.machine.getAnchor('cart'))
      this.console.setCopy(
        'CHAPTER 3  ·  ' + (correct ? 'CALLED IT' : 'WORTH A LOOK'),
        passed ? 'The gate opened' : 'The gate stayed shut',
        passed
          ? 'Both A and B are true, so AND is true and the cart rolls through. This purchase fits your split.'
          : (l.a && !l.b ? 'A is true but B is false: ' + money(this.state.scenario.purchasePrice) + ' would eat into the cushion. ' : !l.a && l.b ? 'B is true but A is false: needs are not covered yet. ' : 'Both checks are false. ') + 'AND needs both, so the gate stays shut.',
        correct ? 'Your prediction matched the gate.' : 'AND is strict: one FALSE is enough to block it.',
        correct ? 'success' : 'alert'
      )
      this.console.setActions([[act('back', 'Run it again', 'replay'), act('next', 'Fill the truth table', 'next', {primary: true})]])
      this.log('prediction ' + JSON.stringify({a: l.a, b: l.b, open, predicted: this.predicted}))
    })
  }

  private afterLampChange(): void {
    const l = this.state.lamps()
    this.machine.setLamps(l.a, l.b)
    this.audio.play('pop', this.machine.getAnchor('lampA'))
    this.showLogicLabels()
    this.renderTable()
  }

  private runTableRow(): void {
    const l = this.state.lamps()
    const open = gateOpen(l.a, l.b, this.state.op)
    this.state.discovered[rowKey(l.a, l.b, this.state.op)] = true
    this.busy = true
    this.tableRuns++
    this.renderTable()
    this.audio.play(open ? 'gateOpen' : 'gateClosed', this.machine.getAnchor('gate'))
    this.machine.runCart(open, () => {
      this.busy = false
      if (this.page === 'logic_table') {
        this.renderTable()
        if (this.state.discoveredCount >= 8) this.audio.play('correct', this.machine.getAnchor('gate'))
      }
    })
  }

  private toggleHelp(): void {
    if (this.helpOpen) {
      this.helpOpen = false
      this.goto(this.helpReturn)
      return
    }
    if (this.page === 'intro' || this.page === 'placing') return
    this.helpOpen = true
    this.helpReturn = this.page
    this.console.setCopy(
      'HOW TO PLAY',
      'Pinch, drop, decide',
      'Pinch buttons on this card to move through the lesson. In the Split chapter, pinch the floating coin and drop it in a jar, or tap a jar. Everything in the machine is a real quantity: the tube is tax, the basin is take-home, the jars are your plan.',
      'Dock: sound · bring the machine here · restart · this help.',
      'neutral'
    )
    this.console.setActions([[act('help_close', 'Back to the lesson', 'back', {primary: true})]])
  }

  private restart(): void {
    this.tw.clear()
    this.busy = false
    this.helpOpen = false
    this.chapterDone = [false, false, false]
    this.freeFromSummary = false
    this.policyAnswered = false
    this.state.resetScenario(0)
    this.machine.hideGrowth()
    this.goto('tax_intro')
  }

  private localOf(anchor: string, offset: vec3): vec3 {
    return this.machine.anchorPosition(anchor).add(offset)
  }

  // ---------------------------------------------------------------------------------------------
  // Frame update: tweens, audio clock, out-of-view rescue
  // ---------------------------------------------------------------------------------------------

  private update(): void {
    const dt = getDeltaTime()
    this.tw.update(dt)
    if (this.audio) this.audio.tick(dt)
    if (!this.placed || this.page === 'intro' || this.page === 'placing') return
    const cam = WorldCameraFinderProvider.getInstance().getComponent().getTransform()
    const camPos = cam.getWorldPosition()
    const fwd = cam.getWorldRotation().multiplyVec3(new vec3(0, 0, -1))
    const to = this.machineRoot.getTransform().getWorldPosition().add(new vec3(0, 20, 0)).sub(camPos)
    const dist = to.length
    const cos = dist > 1 ? to.normalize().dot(fwd) : 1
    const behind = cos < 0.1 || dist > 450
    this.outOfView = behind ? this.outOfView + dt : 0
    if (this.outOfView > 2.5 && !this.rescueShown) {
      this.rescueShown = true
      this.intro.setMode('rescue')
    } else if (!behind && this.rescueShown && this.outOfView === 0) {
      this.rescueShown = false
      this.intro.setMode('hidden')
    }
  }

  private log(msg: string): void {
    if (!this.debug) return
    print('[Cashfall] ' + msg + ' ' + this.state.snapshot())
  }

  /** Read-only snapshot for tests. */
  public getSnapshot(): string {
    return JSON.stringify({page: this.page, placed: this.placed, busy: this.busy, chapterDone: this.chapterDone, state: JSON.parse(this.state.snapshot())})
  }
}
