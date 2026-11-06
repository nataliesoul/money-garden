# Money Garden

Devpost draft: https://devpost.com/software/money-garden (project 1530579, hackathon submission 1285095). The draft includes a description, thumbnail, and three verified Preview screenshots. It has not been submitted. Personal reflections and eligibility declarations remain for the participant to supply.

## Tagline

Grow your money skills in AR: explore budgets, tax layers, and decision logic in a miniature garden.

## Intended audience and problem

Money Garden is designed for a broad audience without assuming financial or programming knowledge. Money decisions can be difficult to understand when their consequences are hidden in numbers. The experience aims to make the relationships visible: where income goes, which income layer a tax rate applies to, and when a decision satisfies two conditions.

## What it does

The learner moves 100-credit tokens into Essentials, Reserve, and Choice bowls in a miniature garden. The remaining balance and visible stacks show where the money went. Running the month applies a disclosed surprise expense and explains any uncovered costs. Undo and retry make experimentation forgiving.

The tax lesson asks for a prediction, then divides annual taxable income into three columns using clearly labeled practice rates. Adding 500 credits above the top threshold adds 100 tax and 400 retained income. The first two columns stay unchanged, making the marginal-rate concept visible.

The logic lesson asks which rule implements a policy requiring two conditions. Learners toggle A and B, select AND or OR, predict the outcome, and send pulses through a visible gate. A summary closes the three-lesson sequence, and three budget scenarios provide repeat practice.

## Why AR

The model stays in world space after initialization or recentering. Money moves between destinations; its location and stacked quantity communicate allocation. Separate tax columns show where each rate applies. Converging input paths and an opening gate make Boolean conditions visible. Standard SIK manipulation and large UIKit controls provide direct interaction and a button alternative.

This version uses a virtual tabletop. It does not claim furniture detection, persistent spatial anchors, or a real-device demonstration. The logic conditions are explorable examples, separate from the preceding budget state.

## Technology explanation — submission field 29092

Planning used the official Devpost Learn `plan-lens` skill, its design-brief template, and its AR design and Preview limits references. The participant selected Money Garden for a broad audience. The approved brief is included in `devpost/design-brief.md`.

The build uses Codex with the CLAD plugin and native Lens Studio MCP tools in Lens Studio 5.24.1. TypeScript manages lesson state, conservation of credits, tax arithmetic, and input routing. SpectaclesInteractionKit supplies manipulation and interaction; SpectaclesUIKit supplies world-space controls. MeshBuilder creates the tabletop, bowls, credits, tax columns, and gate. CLAD generated the plant, music, and sound cues. Asset provenance and license notices are included in `devpost/asset-provenance.md`.

Seven LEAF acceptance flows passed using actual SIK interactions: practice drag/drop, budgeting and guards, tax arithmetic, all eight AND/OR cases, complete replay across three scenarios, utility controls, and IK-assisted interaction. Native compilation and startup checks passed after project recovery. The IK check routes indirectly at 115 cm; no claim of direct arm reach or real-device comfort is made. Exact evidence and limits are recorded in `devpost/verification.md`.

## Build challenges

Automatically installed inspection/testing dependencies used newer package names than the project's installed frameworks. The build preserved the original SIK/UIKit versions, adapted verified imports in an editable inspection package, and selected compatible official testing packages through native APIs. A package reload error required reopening the saved project.

Actual interaction testing then exposed a button-lifecycle bug: refreshing a panel destroyed the control while its release event was still finishing. The fix keeps button identities stable and queues layout changes. This is why compilation and a welcome screenshot alone were insufficient verification.

## Learning content

All money uses fictional credits. The tax lesson explicitly labels its practice rates and demonstrates a concept rather than calculating real tax liability. Budget and reserve targets are scenario conditions, not prescriptions for the learner. Content sources are documented in `devpost/learning-sources.md`.

## Participant reflections — complete in the participant's own words

- What inspired this project?
- What did you learn about designing for glasses?
- Where did the build become difficult, and what changed?
- How well did CLAD implement the brief?
- How did AI cost or usage limits affect your work?
- What would you improve next?

## Links

- Public source repository: https://github.com/nataliesoul/money-garden
- Public YouTube demonstration: not recorded/uploaded yet.

## Attribution and disclosure

- Devpost Learn planning pack: https://github.com/challengepost/learn-specs (MIT); reference revision `5d8bc0800346d38e468c29b15afcb7ca92280005`.
- CLAD and Lens Studio: Snap development tools.
- Lens Studio base template: existing project starting point.
- Package versions, generated-asset provenance, and font/icon notices are recorded in `devpost/asset-provenance.md`.
- No prior custom gameplay code has been identified in the initial Assets inventory. The participant must confirm the project's creation-period declaration.
