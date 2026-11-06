# Money Garden — run and demonstrate

Money Garden is a Specs AR tutor for a broad audience. It uses explanations, spatial worked examples, and guided practice to teach budgeting, progressive tax layers, and Boolean decision rules. No prior financial or programming knowledge is assumed.

## Open the project

1. Open `Learn_AR_with_Specs.esproj` in Lens Studio. The build environment is Lens Studio 5.24.1.
2. Allow the project's assets to import and TypeScript to compile.
3. Use the SPECS27 device and Interactive Preview, which the project is configured to use. No headset is required for the demonstration.
4. Click the large **Start growing** control. Mouse clicks simulate standard pinch interactions.

Read `devpost/verification.md` for the tutor revision's acceptance results and limitations; successful startup alone is not the evidence. IK coverage uses far-field interaction and does not establish physical arm reach or hardware comfort.

## Learn through the tutor

1. **Budget teaching:** Start opens the explanation. Use Next and Back to see what income, essentials, reserve, and choice mean. The worked example allocates 500 / 300 / 200 from 1,000 credits, then shows a 200-credit surprise leaving 100 in reserve. These example credits are separate from your budget.
2. **Budget practice:** move the 100-credit token to Essentials, or press Allocate. **Plan with guidance** restores the full starting income. Follow the tutor's next-step hints, allocate in 100-credit increments, and use Undo to revise. **Check my plan** asks whether both needs are covered before running the month; the result explains uncovered costs and reserve remaining. Retry has no penalty.
3. **Tax teaching and practice:** the tutor defines taxable income, tax, and retained income, then builds the three layers. Compare 2,500 credits (200 tax / 2,300 retained) with 3,000 (300 / 2,700). Complete the guided step before making a prediction and exploring the controls. Rates are fictional practice rates, not a real tax schedule.
4. **Logic teaching and practice:** learn true/false conditions, AND (both), and OR (either or both). With A true and B false, watch AND close the gate and OR open it. Complete the guided example, then change conditions, choose a rule, predict, and Run. The purchase policy requires both conditions, so test AND before finishing. OR is correct for policies that accept either condition.
5. **Summary:** review the three takeaways, Replay the same scenario, or choose New scenario for different amounts. Each new attempt includes teaching, so the flow remains suitable for someone learning the topic for the first time.

**Teach again** revisits the worked example without changing your allocations, predictions, or progress; return to continue your work. **Details** adds context. **Mute** controls sound. **Recenter** brings the world-space model back in front of you without resetting the lesson. **Restart** starts the current scenario again. Teaching has no forced timers.

The custom field-guide interface uses chapter tabs to show the current topic, gold emphasis for the primary action, and a separate inset for teaching notes and feedback. Mint controls brighten on hover and use a gold border when pressed. Station plaques give numeric values more visual prominence than their headings. These cues supplement the written labels.

## Demonstration checks

- Show the running Lens during the first ten seconds.
- Include an uncut stretch of the actual flow; the video must show behavior, not only screenshots or a description.
- Keep the full video below three minutes and publish it on YouTube.
- Clearly identify the broad audience and the three concepts taught.
- Call the numbers fictional credits and the tax rates practice rates.
- Show a tutor explanation and visible worked example before any question. Include at least one cause and consequence: the reserve absorbing a surprise, the extra 400 retained from 500 more taxable income, or the difference between OR and AND when one condition is false.
- End at the summary and demonstrate replay or a new scenario.
- Distinguish Preview-tested behavior from real-device comfort and hand tracking, which have not been validated on hardware.

## Where to find things

- `Assets/Scripts/MoneyGardenMain.ts`: lesson flow and input routing.
- `Assets/Scripts/MoneyGardenState.ts`: budget scenarios, tax formula, and logic state.
- `Assets/Scripts/MoneyGardenTutor.ts`: worked-example steps and independent demonstration state.
- `Assets/Scripts/MoneyGardenWorld.ts`: spatial model, token manipulation, and animation.
- `Assets/Scripts/MoneyGardenPanelUI.ts`: UIKit labels, panels, and controls.
- `Assets/Scripts/MoneyGardenAudio.ts`: music and feedback cues.
- `Assets/GeneratedMeshes`, `Assets/GeneratedSFX`, `Assets/Icons`, `Assets/Fonts`: imported presentation assets.
- `devpost/design-brief.md`: approved design and acceptance criteria.
- `devpost/learning-sources.md`: educational sources and fictional example definitions.
- `devpost/submission-checklist.md`: official delivery requirements and readiness notes.

## Repository preparation

The public repository must include the Lens Studio project, required source/assets/packages, and the `devpost` folder. Exclude `.mcp.json`, `.codex/config.toml`, local credentials, caches, logs, lock files, and user workspace settings. Preserve appropriate asset/package licenses and disclose the Lens Studio template, CLAD-generated assets, and any package compatibility adaptations. A source archive is not a substitute for the required public repository URL.
