# Money Garden verification

Verified 2026-11-06 in Lens Studio 5.24.1 Preview using native CLAD tools and LEAF. All seven acceptance scenarios returned **succeeded** and emitted a matching **DefaultLeafScenarioManager PASSED** line. Final native TypeScript recompilation succeeded at 17:36 Eastern; runtime refresh reached the expected welcome state with all seven tests registered and no application script exception.

## Actual interaction coverage

Tests use LEAF's SIK interactors against enabled UIKit controls and the movable IncomeToken. They do not call private lesson handlers or mutate lesson state. Read-only snapshots and visible text/geometry provide assertions. Each scenario starts by pressing Restart.

| Scenario ID | Latest full pass (Eastern) | Assertions |
| --- | --- | --- |
| money-garden-practice | 17:35:07.860 | Invalid drag returns token without allocation; valid drag allocates exactly 100 once; conservation; token hidden after success; scale unchanged; practice completion resets budget. |
| money-garden-budget | 17:30:20.801 | Allocate, undo, conservation, shortfall with no invented borrowing, retry reset, full allocation, rejection of extra allocation, and reserve remaining after surprise. |
| money-garden-tax | 17:32:00.282 | 2500 income gives 200 tax / 2300 retained; 3000 gives 300 / 2700; extra 500 yields 100 extra tax / 400 retained; lower layers unchanged; comparison and fictional-rate labels; Details explanation. |
| money-garden-logic | 17:33:10.277 | All eight AND/OR truth cases; prediction required; feedback and gate position agree; OR cannot satisfy the separate BOTH-checks purchase policy. |
| money-garden-replay | 17:34:44.333 | Complete budget → tax → logic → three-takeaway summary; replay resets same scenario; New scenario progresses through and completes all three scenarios. |
| money-garden-utilities | 17:29:43.083 | Details opens/closes without losing progress; mute sets music volume to zero and restores it; recenter preserves state and places content 115 cm horizontally ahead / 8 cm below camera. |
| money-garden-ik | 17:29:58.274 | IK avatar successfully presses Start and Allocate through SIK. Both routes explicitly logged **indirect**. This is not proof of direct arm reach. |

A successful full budget run allocated 500 Essentials / 300 Reserve / 200 Choice. A 200 surprise left 100 Reserve. The gallery budget image intentionally shows a plan in progress: 500 / 300 / 100 with 100 still available.

### Authoritative log evidence

Source: local Lens Studio session log `LensStudioLog-2026-11-06-17-15-49-758-8a1a4.txt`. The native runner independently returned succeeded for each matching run. These are the default acceptance modes, not the shorter screenshot-only modes.

```text
17:35:07.860 [DefaultLeafScenarioManager] [  6.427s]PASSED: money-garden-practice
17:30:20.801 [DefaultLeafScenarioManager] [ 14.240s]PASSED: money-garden-budget
17:32:00.282 [DefaultLeafScenarioManager] [  8.248s]PASSED: money-garden-tax
17:33:10.277 [DefaultLeafScenarioManager] [ 33.323s]PASSED: money-garden-logic
17:34:44.333 [DefaultLeafScenarioManager] [ 64.802s]PASSED: money-garden-replay
17:29:43.083 [DefaultLeafScenarioManager] [  6.943s]PASSED: money-garden-utilities
17:29:58.274 [DefaultLeafScenarioManager] [  6.445s]PASSED: money-garden-ik
```

## Done criteria and visual evidence

1. **Natural input:** actual SIK button and valid/invalid token-drag paths pass; alternate allocation buttons work.
2. **State integrity:** conservation, single allocation, undo, exhaustion, shortfall and retry pass.
3. **Correct teaching:** exact fictional tax comparison, all eight Boolean results and the separate purchase policy pass.
4. **Complete repeatable lesson:** three-stage summary, same-scenario replay and three completed scenarios pass.
5. **Utilities and presentation:** Details/mute/recenter assertions pass. Plant placement and label contrast were corrected and screenshots inspected. Station plaques sit below the model; gold stacks contrast with bowls.

Clean native Preview captures after actual input are in [screenshots](screenshots/): [welcome](screenshots/welcome.png), [practice](screenshots/practice.png), [budget](screenshots/budget.png), [month](screenshots/month.png), [shortfall](screenshots/shortfall.png), [taxes](screenshots/taxes.png), [logic](screenshots/logic.png), and [summary](screenshots/summary.png). These are editor Preview evidence, not on-device recordings. Diagnostic overlays and the IK test avatar are absent from the final gallery. The opening scene is welcome; no tests auto-run.

## Resolved defects and dependencies

Testing exposed and resolved synchronous destruction of a triggering button, which broke input completion, and stopping an unassigned audio cue, which aborted lesson transitions. Controls now retain their Interactable identities; audio initialization and guards keep supplemental audio from interrupting lessons. A test text lookup was updated after label text moved inside contrast plaques.

Official Leaf 2.0.2 and AiPreviewAgentInteract 2.0.1 replace the incompatible freshly auto-installed version 4 testing dependencies. Existing SpectaclesInteractionKit and SpectaclesUIKit packages remain at their original 2.0.0 package versions (SIK's internal startup banner says 0.18.0). The package reload/editor recovery is resolved. The user allowed the Icon Atlas and LEAF plugin permissions. No Cache content or immutable testing-package source was edited.

## Limits still requiring physical-device/manual assessment

- No Specs hardware run, real hand comfort, direct near-field reach, real-room legibility, frame-rate/thermal profile, or user learning study was performed.
- IK used indirect targeting; physical reach and direct pokes are unverified.
- Audio playback produced no application exception in passing runs and mute volume was asserted. Audible quality, loudness and mix were not assessed by listening.
- Two-hand rotate/scale rejection, out-of-view recovery, and walking/recentering after an actual camera move were not explicitly exercised. Recenter's target placement and state preservation were checked.
- Tests cover the stated tax comparison, not every income boundary. The tax schedule is fictional educational practice, not filing guidance.
- Native warnings remain: LEAF can skip saving transient plugin state during rapid Preview resets; the engine also reported material batching retries for some UI/hand visuals. These are not application assertion failures, but performance is not certified.

Reproduce using the seven registered scenarios in the LEAF panel, one at a time, with their default mode parameters. Test source: `Assets/Tests/MoneyGardenAcceptance.ts` and `MoneyGardenLeafIndex.ts`.
