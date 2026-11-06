# Money Garden custom UI verification

Verified 2026-11-06 in Lens Studio 5.24.1 Preview using native CLAD/LEAF. **This report describes the custom botanical UI revision and supersedes the earlier tutor-only verification.** All eight default scenarios have current UI PASSED evidence. Seven native calls returned succeeded; full replay exceeded the120-second transport limit but completed uninterrupted with Lens-side PASSED at126.702 seconds and the correct final snapshot.

Tutor/practice/budget/logic passed after the custom UI freeze and before the later tax-only height correction. Tax was rerun after that correction; full replay then traversed every teaching/guided/check screen on the corrected final layout. Utilities and IK also passed afterward. No math or lesson flow changed in the UI revision.

## Actual interaction results

Tests use enabled SIK/UIKit controls and IncomeToken drag, not private lesson handlers or lesson-state mutation. Read-only snapshots and visible text/geometry supply assertions. Each starts with an actual Restart press.

| Default scenario | Pass time (Eastern) | Evidence and coverage |
| --- | --- | --- |
| money-garden-tutor | 18:15:05.499 | Returned succeeded, 50.042s. Start opens teaching before answers. Five budget and five tax demo states have exact values and preserve learner state. No automatic page advance; Back/Replay/Return work. Demo collider/Interactable disabled. AND/OR contrasting gate geometry matches explanations. Guided steps precede independent checks. Teach again preserves allocations, plan-check state and pending logic prediction. Wrong-answer feedback traces amounts/Boolean inputs. Restart clears progress. |
| money-garden-practice | 18:15:29.379 | Returned succeeded, 9.922s. Mandatory budget lesson, invalid drag return, valid exactly-once 100-credit drop, conservation, token disappearance after success, unchanged scale, reset to budget. |
| money-garden-budget | 18:16:00.960 | Returned succeeded, 20.172s. Allocate/undo/conservation, prediction before month, shortfall without invented borrowing, retry, exhaustion guard, successful plan and reserve after surprise. |
| money-garden-tax | 18:22:09.804 | Returned succeeded, 19.010s. Mandatory teaching and guided 2500→3000 example before independent 3500→4000 prediction. Exact tax/retained values, lower layers unchanged, +400 retained comparison, fictional-rate labels and 8% average-rate explanation. |
| money-garden-logic | 18:17:44.816 | Returned succeeded, 53.854s. Mandatory AND/OR teaching and guided TRUE AND TRUE before prediction. All eight truth cases, required prediction, matching feedback/gate geometry, OR rejected for the separate BOTH-checks policy. |
| money-garden-replay | 18:25:29.929 | **Lens-side PASSED, 126.702s; native call timed out at 120s.** No reset occurred between RUNS and PASSED. Completed first lesson, same-scenario replay, then both new scenarios with teaching and guided practice. Final summary scenario2: 400/200/300 allocation; all tutor completion flags true. |
| money-garden-utilities | 18:26:00.707 | Returned succeeded, 10.801s. Details preserves progress; mute volume zero/restored; recenter preserves state and places content 115cm horizontally ahead/8cm below camera. |
| money-garden-ik | 18:28:36.959 | Returned succeeded, 13.374s. IK avatar presses Start and Allocate through SIK; tutorial completed between these. Both IK routes are indirect, not proof of direct arm reach. |

Authoritative log: `LensStudioLog-2026-11-06-17-15-49-758-8a1a4.txt`, matching `DefaultLeafScenarioManager` PASSED lines above. Final replay snapshot: summary/scenario2, allocated400/200/300, all three tutor completion flags true. Screenshot-only mode passes are not substituted for default acceptance results.

## Teaching correctness and state separation

- Budget demonstration: 1000 credits, then allocations 500/0/0 → 500/300/0 → 500/300/200. A 200 surprise leaves 100 Reserve. Learner allocations remain unchanged throughout demonstration.
- Tax demonstration: incomes 0,1000,2000,2500,3000 produce tax 0,0,100,200,300. At2500 retained=2300; at3000 retained=2700. Independent3500→4000 adds100 tax and400 retained. Practice rates remain explicitly fictional.
- Logic demonstration uses the same TRUE/FALSE inputs to show AND closed, OR open, and why the stated purchase policy requires AND. Guided practice changes B to TRUE and runs AND. Independent tests cover every truth-table combination.
- Teaching advances only through user input. Review enters a separate demo model and Return restores the learner's prior work, including a saved prediction. Decorative demonstration money remains visible but cannot be grabbed.

## Custom UI and current-run diagnostics

The final theme uses botanical chapter tabs, a sprout motif, teal cards, mint borders, gold primary actions/progress, inset explanatory notes, compact action surfaces and separate station headings/large values. Buttons retain their identity through layouts. The read-only test text helper concatenates visible label descendants in visual order to match the split plaques.

A4000-credit tax column initially overlapped explanatory feedback. All tax segments were proportionally reduced from.006 to.003cm/credit, and tray spacing from3 to2cm. Final2500,3000 and4000 captures show clear text with unchanged amounts; the parent visually approved maximum4000 clearance. Exact tax regression and full replay passed afterward.

An isolated `tutorLogicView` gallery run stalled hovering Try logic and timed out at60s. No application exception was logged. A DEBUG diagnostic run logged normal trigger/completion and passed at18:20:29; later full replay repeatedly crossed the same transition successfully. The original cause remains unproven, not claimed fixed.

Initial automatic IK routing failed at18:26:25: `[IK right (direct)] trigger "MG_allocate0": 14.5cm behind the shoulder.` Post-failure native inspection placed the final control105cm ahead of the camera, not behind it. The test now awaits the public avatar `ready` Promise and bounds the wait for the target to settle within the garden. Automatic routing remains enabled; the rerun passed18:28:36 using indirect routes. No forced strategy, fallback policy or product geometry change was used. Setup timing is a plausible explanation, not conclusively established.

A supported20-second SIK hover check passed18:29:30, preserving target identity and lesson state. The parent qualitatively observed the brighter mint hover state on Try logic during diagnosis. Native screenshots queue behind the runner, so `hover.png` was captured after hover ended and **is not active-hover evidence**. A later optional runtime-style probe never reached Lens-side RUNS and had a bridge timeout; its unexecuted assertion was removed. Press/release functionality passes across the scenarios; a pressed-state frame was not independently verified.

Native compile/runtime passed after restoring the reliable test source. Final save/export returns the project to welcome, no automatic tests and no diagnostic overlay. Transient LEAF state-save/material batching warnings remain; no application exception occurred in passing runs.

## Screenshot provenance

Current custom UI actual-input captures: [welcome](screenshots/welcome.png), [budget teaching](screenshots/tutor-budget.png), [tax teaching](screenshots/tutor-tax.png), [logic teaching](screenshots/tutor-logic.png), [practice](screenshots/practice.png), [month](screenshots/month.png), [taxes3000](screenshots/taxes.png), [tax maximum4000](screenshots/tax-maximum.png), [logic](screenshots/logic.png), [summary](screenshots/summary.png). Tax images use the corrected proportional scale. Summary is the actual final full-replay scenario2 state. Parent reviewed the key pages for clear copy, hierarchy and unclipped quantities.

**Historical:** `budget.png` and `shortfall.png` still show the prior tutor-only UI, not the final theme. They are behavior evidence only; prefer current teaching/month images for the public gallery. `hover.png` is a post-hover welcome frame. All images are editor Preview captures, not device recordings.

Official Leaf2.0.2/AiPreviewAgentInteract2.0.1 and original SIK/UIKit2.0.0 packages are unchanged. No Cache or immutable package edits.

## Remaining limits

No physical Specs run, direct near-field reach, real-hand comfort, real-room legibility, frame-rate/thermal profile or learner study was performed. Audio calls and mute volume passed; audible quality/mix was not assessed by listening. Two-hand rotate/scale rejection, walking/recentering after camera movement and out-of-view recovery were not explicitly exercised. Recenter placement/state preservation were checked.

Tests cover the listed tax examples, not every boundary. This is fictional educational practice, not filing guidance. Native warnings remain for transient LEAF state saving during rapid resets and material batching retries for some UI/hand visuals; they are not application assertion failures, and performance is not certified.

Run the eight registered LEAF scenarios serially using default mode parameters. Full replay can outlive the MCP transport timeout; wait for the Lens-side PASSED/FAILED and final snapshot rather than resetting or launching another scenario. Source: `Assets/Tests/MoneyGardenAcceptance.ts`, `MoneyGardenLeafIndex.ts`. Screenshot modes are separate from acceptance results.