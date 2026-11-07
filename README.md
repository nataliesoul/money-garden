# Money Garden

A Specs AR tutor for a broad audience. Learn budgeting, progressive tax layers, and AND/OR decision logic through explanations and worked examples in a miniature garden, followed by guided practice.

![The Money Garden tutor demonstrates a reserve absorbing a surprise](devpost/screenshots/tutor-budget.png)

The custom botanical interface uses teal gradient cards, mint chapter tabs, a sprout mark, gold teaching notes and primary actions, and larger values beside the garden models. Buttons respond visibly to hover and press. Native text and the existing SIK interaction system keep the presentation readable and responsive.

## Run

Open `Learn_AR_with_Specs.esproj` in Lens Studio 5.24.1 or a compatible version, allow assets to import, and use the SPECS27 Interactive Preview. Select **Start growing** to meet the tutor. Mouse interaction simulates standard SIK pinch input.

Each lesson follows **explanation → visible worked example → guided practice → prediction and feedback**. Use Next and Back to set the teaching pace. The budget demonstration allocates money and absorbs a surprise; the tax demonstration builds each income layer; the logic demonstration contrasts AND and OR with the same conditions. Questions appear after teaching.

During practice, **Teach again** replays the explanation using separate demonstration state and returns to your preserved work. The sequence ends with three takeaways. Replay resets the current scenario; New scenario cycles through three solvable budgets. Details, mute, recenter, and restart remain available.

**Ask coach** opens a plain-language AI conversation about the current lesson. Type a question or load a suggestion, then press **Send**. Follow-up questions retain recent conversation context; **Explain more simply** requests a simpler explanation. Replies have page controls when needed, and Back to garden preserves your work. The coach requires connectivity and your own development credentials in a public source copy; see [coach setup and privacy](devpost/coach-setup.md) and the verification report for tested behavior and Preview limitations.

Live suggested-question and simpler-follow-up replies were verified. **Free-form typing still needs an on-device check:** SPECS 27 Preview does not show the system keyboard, and automated text injection did not update the draft. Do not treat the live suggestion test as proof of typed input.

## Verified behavior

All eight LEAF acceptance scenarios have passing results for the custom UI revision: tutor flow and state preservation, practice drag/drop, budgeting, tax arithmetic, all eight AND/OR cases, full replay across three scenarios, utility controls, and IK interaction. Tax checks and full replay were repeated after adjusting column clearance. Native compilation and startup checks passed. Replay completed in 126.702 seconds, beyond the tool's 120-second response window; its authoritative LEAF pass and final state were verified in the native log. The IK test now waits for avatar and control-layout readiness. See [verification details](devpost/verification.md) for results, earlier failed attempts, and limits.

The IK check used **indirect/far-field interaction at 115 cm**. It does not prove direct arm reach, real-device comfort, or physical hand tracking. No hardware demonstration is claimed. The tabletop is virtual, not detected furniture; progress is within the current session.

## Learning content

All amounts are fictional credits. Tax rates and thresholds are practice examples, not a real tax schedule or a filing calculator. The budgeting reserve is a scenario condition, not a universal recommendation. [Content sources and exact examples](devpost/learning-sources.md) document the teaching model.

## Build and submission materials

- [Approved design brief](devpost/design-brief.md)
- [Run and demo guide](devpost/run-and-demo.md) and [timed narration](devpost/demo-narration.md)
- [Asset provenance and licenses](devpost/asset-provenance.md)
- [Coach design](devpost/coach-design.md) and [connection setup](devpost/coach-setup.md)
- [Submission draft](devpost/submission-draft.md) and [readiness checklist](devpost/submission-checklist.md)

Built with Codex, CLAD, native Lens Studio MCP tools, TypeScript, SpectaclesInteractionKit, SpectaclesUIKit, and LEAF. Runtime geometry uses MeshBuilder; the plant and audio were generated through CLAD workflows. Preserve third-party package notices and the included font/icon licenses.

`Assets/Scripts` contains the lesson code; `Assets/Tests` contains the LEAF scenario and index. Open the LEAF panel in Lens Studio to run the `money-garden-*` scenarios. Scenarios use real SIK controls and read-only state snapshots rather than calling private lesson handlers.
