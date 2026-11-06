# Money Garden — run and demonstrate

Money Garden is an educational Specs Lens for a broad audience. It uses fictional credits to teach budgeting, progressive tax layers, and Boolean decision rules. No prior financial or programming knowledge is assumed.

## Open the project

1. Open `Learn_AR_with_Specs.esproj` in Lens Studio. The build environment is Lens Studio 5.24.1.
2. Allow the project's assets to import and TypeScript to compile.
3. Use the SPECS27 device and Interactive Preview, which the project is configured to use. No headset is required for the demonstration.
4. Click the large **Start growing** control. Mouse clicks simulate standard pinch interactions.

Seven LEAF acceptance flows passed in Preview. Read `devpost/verification.md` for coverage and limitations; successful startup alone is not the evidence. IK coverage used far-field interaction and does not establish physical arm reach or hardware comfort.

## Play through

1. **Practice:** move the 100-credit token to Essentials, or press Allocate. Begin budget restores the full starting income.
2. **Budget:** cover the stated essentials and surprise reserve. Allocate in 100-credit increments; Undo reverses the last allocation. Run month shows uncovered costs and reserve remaining. Retry lets you revise without penalties.
3. **Taxes:** predict the effect of more income, then add/remove 500 credits and compare tax with retained income. The displayed rates are fictional practice rates, not a real tax schedule.
4. **Logic:** toggle the two conditions, choose AND or OR, predict the result, and Run. This purchase policy requires both conditions, so test AND before finishing. OR is correct for other policies that accept either condition.
5. **Summary:** review the three takeaways, Replay the same scenario, or choose New scenario for different amounts.

**Details** opens the current explanation. **Mute** controls sound. **Recenter** brings the world-space model back in front of you without resetting the lesson. **Restart** starts the current scenario again.

## Demonstration checks

- Show the running Lens during the first ten seconds.
- Include an uncut stretch of the actual flow; the video must show behavior, not only screenshots or a description.
- Keep the full video below three minutes and publish it on YouTube.
- Clearly identify the broad audience and the three concepts taught.
- Call the numbers fictional credits and the tax rates practice rates.
- Show at least one cause and consequence: a budget shortfall and retry, the extra 400 retained from 500 more taxable income, or the difference between OR and AND when one condition is false.
- End at the summary and demonstrate replay or a new scenario.
- Distinguish Preview-tested behavior from real-device comfort and hand tracking, which have not been validated on hardware.

## Where to find things

- `Assets/Scripts/MoneyGardenMain.ts`: lesson flow and input routing.
- `Assets/Scripts/MoneyGardenState.ts`: budget scenarios, tax formula, and logic state.
- `Assets/Scripts/MoneyGardenWorld.ts`: spatial model, token manipulation, and animation.
- `Assets/Scripts/MoneyGardenPanelUI.ts`: UIKit labels, panels, and controls.
- `Assets/Scripts/MoneyGardenAudio.ts`: music and feedback cues.
- `Assets/GeneratedMeshes`, `Assets/GeneratedSFX`, `Assets/Icons`, `Assets/Fonts`: imported presentation assets.
- `devpost/design-brief.md`: approved design and acceptance criteria.
- `devpost/learning-sources.md`: educational sources and fictional example definitions.
- `devpost/submission-checklist.md`: official delivery requirements and readiness notes.

## Repository preparation

The public repository must include the Lens Studio project, required source/assets/packages, and the `devpost` folder. Exclude `.mcp.json`, `.codex/config.toml`, local credentials, caches, logs, lock files, and user workspace settings. Preserve appropriate asset/package licenses and disclose the Lens Studio template, CLAD-generated assets, and any package compatibility adaptations. A source archive is not a substitute for the required public repository URL.
