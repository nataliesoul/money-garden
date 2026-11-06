# Money Garden tutor-first verification

Verified 2026-11-06 in Lens Studio 5.24.1 Preview using native CLAD tools and LEAF. **This report supersedes the earlier seven-test, question-first build.** All eight default acceptance scenarios have authoritative Lens-side scenario-manager PASSED evidence. Seven native calls returned succeeded; the full replay's call hit the 120-second transport limit, then the uninterrupted Lens-side run completed at 125.823 seconds with PASSED and the expected final summary. This distinction is preserved below.

## Actual interaction results

Tests use enabled SIK/UIKit controls and IncomeToken drag, not private lesson handlers or lesson-state mutation. Read-only snapshots and visible text/geometry supply assertions. Each starts with an actual Restart press.

| Default scenario | Pass time (Eastern) | Evidence and coverage |
| --- | --- | --- |
| money-garden-tutor | 17:51:34.090 | Returned succeeded, 47.123s. Start opens teaching before answers. Five budget and five tax demo states have exact values and preserve learner state. No automatic page advance; Back/Replay/Return work. Demo collider/Interactable disabled. AND/OR contrasting gate geometry matches explanations. Guided steps precede independent checks. Teach again preserves allocations, plan-check state and pending logic prediction. Wrong-answer feedback traces amounts/Boolean inputs. Restart clears progress. |
| money-garden-practice | 17:51:55.235 | Returned succeeded, 9.868s. Mandatory budget lesson, invalid drag return, valid exactly-once 100-credit drop, conservation, token disappearance after success, unchanged scale, reset to budget. |
| money-garden-budget | 17:52:29.722 | Returned succeeded, 20.136s. Allocate/undo/conservation, prediction before month, shortfall without invented borrowing, retry, exhaustion guard, successful plan and reserve after surprise. |
| money-garden-tax | 17:53:00.110 | Returned succeeded, 18.503s. Mandatory teaching and guided 2500→3000 example before independent 3500→4000 prediction. Exact tax/retained values, lower layers unchanged, +400 retained comparison, fictional-rate labels and 8% average-rate explanation. |
| money-garden-logic | 17:54:05.000 | Returned succeeded, 53.591s. Mandatory AND/OR teaching and guided TRUE AND TRUE before prediction. All eight truth cases, required prediction, matching feedback/gate geometry, OR rejected for the separate BOTH-checks policy. |
| money-garden-replay | 17:57:35.715 | **Lens-side PASSED, 125.823s; native call timed out at 120s.** No reset occurred between RUNS and PASSED. Completed first lesson, same-scenario replay, then both new scenarios with teaching and guided practice. Final summary scenario2: 400/200/300 allocation; all tutor completion flags true. |
| money-garden-utilities | 17:58:45.963 | Returned succeeded, 11.657s. Details preserves progress; mute volume zero/restored; recenter preserves state and places content 115cm horizontally ahead/8cm below camera. |
| money-garden-ik | 17:59:24.439 | Returned succeeded, 11.689s. IK avatar presses Start and Allocate through SIK; tutorial completed between these. Both IK routes are indirect, not proof of direct arm reach. |

Authoritative log: `LensStudioLog-2026-11-06-17-15-49-758-8a1a4.txt`, `DefaultLeafScenarioManager` PASSED lines at the times above. Full replay began 17:55:29.892. Its final read-only snapshot and `MG_TEST_PASS replay` confirm completed learner state. The later `summaryView` pass at 18:01:33.031 (32.113s, native returned succeeded) is a single-completion gallery run and is not substituted for the full replay test.

## Teaching correctness and state separation

- Budget demonstration: 1000 credits, then allocations 500/0/0 → 500/300/0 → 500/300/200. A 200 surprise leaves 100 Reserve. Learner allocations remain unchanged throughout demonstration.
- Tax demonstration: incomes 0,1000,2000,2500,3000 produce tax 0,0,100,200,300. At2500 retained=2300; at3000 retained=2700. Independent3500→4000 adds100 tax and400 retained. Practice rates remain explicitly fictional.
- Logic demonstration uses the same TRUE/FALSE inputs to show AND closed, OR open, and why the stated purchase policy requires AND. Guided practice changes B to TRUE and runs AND. Independent tests cover every truth-table combination.
- Teaching advances only through user input. Review enters a separate demo model and Return restores the learner's prior work, including a saved prediction. Decorative demonstration money remains visible but cannot be grabbed.

## Compile, fixes and presentation

Native TypeScript compilation and runtime refresh succeeded after the final changes; welcome rendered and all eight scenarios registered without an application script exception. The test-only experimental 200ms replay pacing was reverted; source uses the original passing 300ms action wait. A screenshot-only summary mode was added without changing acceptance assertions.

The first tutor test incorrectly required the decorative income token to be hidden. Source inspection confirmed intentional visibility with disabled interaction; the assertion was corrected to check collider/Interactable disabled, and the complete tutor test passed. No tutor implementation failure was found in these runs.

Earlier resolved defects remain fixed: persistent action-button identities prevent destruction during release; initialized/guarded audio cues prevent first-action exceptions. Plant support and dark label plaques were visually reviewed. Native package recovery is resolved: official Leaf2.0.2 / AiPreviewAgentInteract2.0.1, unchanged original SpectaclesInteractionKit/SpectaclesUIKit2.0.0 packages. No Cache or immutable testing-package source edits.

Clean actual-input Preview images: [budget teaching](screenshots/tutor-budget.png), [tax teaching](screenshots/tutor-tax.png), [logic teaching](screenshots/tutor-logic.png), [welcome](screenshots/welcome.png), [practice](screenshots/practice.png), [budget](screenshots/budget.png), [month](screenshots/month.png), [shortfall](screenshots/shortfall.png), [taxes](screenshots/taxes.png), [logic](screenshots/logic.png), [summary](screenshots/summary.png). Parent visually reviewed the teaching pages for readable text/controls and correct demonstrated values. Gallery uses no diagnostic overlay or IK avatar. These are editor images, not device recordings.

## Remaining limits

No physical Specs run, direct near-field reach, real-hand comfort, real-room legibility, frame-rate/thermal profile or learner study was performed. Audio calls and mute volume passed; audible quality/mix was not assessed by listening. Two-hand rotate/scale rejection, walking/recentering after camera movement and out-of-view recovery were not explicitly exercised. Recenter placement/state preservation were checked.

Tests cover the listed tax examples, not every boundary. This is fictional educational practice, not filing guidance. Native warnings remain for transient LEAF state saving during rapid resets and material batching retries for some UI/hand visuals; they are not application assertion failures, and performance is not certified.

Run the eight registered LEAF scenarios serially using default mode parameters. Full replay can outlive the MCP transport timeout; wait for the Lens-side PASSED/FAILED and final snapshot rather than resetting or launching another scenario. Source: `Assets/Tests/MoneyGardenAcceptance.ts`, `MoneyGardenLeafIndex.ts`. Screenshot modes are separate from acceptance results.
