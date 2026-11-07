# Money Garden

Devpost draft: https://devpost.com/software/money-garden (project 1530579, hackathon submission 1285095). The gallery includes the custom botanical tutor interface and an actual live AI coach reply; the thumbnail shows the budget tutor. Earlier gallery images document the previous presentation. It has not been submitted. Personal reflections and eligibility declarations remain for the participant to supply.

## Tagline

A spatial tutor that explains money, taxes, and logic through worked examples in a miniature AR garden, then guides your practice.

## Intended audience and problem

Money Garden is designed for a broad audience without assuming financial or programming knowledge. Money decisions can be difficult to understand when their consequences are hidden in numbers. The experience aims to make the relationships visible: where income goes, which income layer a tax rate applies to, and when a decision satisfies two conditions.

## What it does

Money Garden teaches before it asks questions. Each topic starts with a plain-language explanation and a user-paced worked example in the spatial model. Next and Back let the learner inspect each change. Guided practice follows, then prediction and feedback. Teach again replays a separate demonstration and returns to the learner's preserved work.

The budget tutor defines income, essentials, reserve, and choice. It allocates 1,000 example credits into 500 essentials, 300 reserve, and 200 choice, then shows a 200-credit surprise leaving 100 reserve. Only afterward does the learner move their own 100-credit tokens, with next-step coaching, Undo, and forgiving retries.

The tax tutor defines taxable and retained income, then builds separate columns using clearly labeled practice rates. At 2,500 credits, 200 goes to tax and 2,300 remains. Adding 500 above the top threshold adds 100 tax and 400 retained income. The first two columns stay unchanged. Guided practice and a prediction follow the explanation.

The logic tutor defines true/false conditions and demonstrates AND and OR with the same inputs. A true and B false closes the AND gate but opens OR. Learners then practice, predict, and send pulses through the gate. The example purchasing policy requires both conditions, so AND implements it. A summary closes the three-lesson sequence, and three budget scenarios provide repeat practice.

## Plain-language coach

An optional **Ask coach** panel connects the current lesson to an AI conversation. Learners write arbitrary questions using a custom Preview-compatible QWERTY keyboard, review them with Done and explicitly Send, then ask follow-ups or request a simpler explanation. Numbers, punctuation and draft pages support financial questions. Suggestions are optional. Actual key entry and a two-turn live conversation passed: “Why save200?” followed by “Use an example.” The coach receives the visible worked example during teaching and the learner's fictional choices during practice. It cannot change lesson state. The custom panel provides response pages, cancellation, retry and Clear chat.

Chat requires a network connection and configured Remote Service Gateway credentials. The public source deliberately excludes local tokens and documents setup. Questions, recent conversation and fictional context are sent to AI only on Send; the interface asks for fictional examples. Local conversation history is held in session memory. Verification and remaining hardware limits are documented in `devpost/verification.md`.

## Why AR

The model stays in world space after initialization or recentering. Money moves between destinations; its location and stacked quantity communicate allocation. Separate tax columns show where each rate applies. Converging input paths and an opening gate make Boolean conditions visible. Standard SIK manipulation and large UIKit controls provide direct interaction and a button alternative.

This version uses a virtual tabletop. It does not claim furniture detection, persistent spatial anchors, or a real-device demonstration. The logic conditions are explorable examples, separate from the preceding budget state.

## Custom interface

The botanical field-guide interface carries the garden theme into the controls. Teal gradient cards and a sprout mark frame three chapter tabs; gold highlights the next teaching action and the feedback inset. Station plaques separate headings from larger numeric values, making the financial examples easier to compare with the spatial models. Custom hover and pressed states provide immediate feedback. All labels remain native text, and the controls retain standard SIK interaction and stable identities as lessons change.

## Technology explanation — submission field 29092

Planning used the official Devpost Learn `plan-lens` skill, its design-brief template, and its AR design and Preview limits references. The participant selected Money Garden for a broad audience. The approved brief is included in `devpost/design-brief.md`.

The build uses Codex with the CLAD plugin and native Lens Studio MCP tools in Lens Studio 5.24.1. TypeScript manages lesson state, conservation of credits, tax arithmetic, and input routing. SpectaclesInteractionKit supplies manipulation and interaction; SpectaclesUIKit supplies world-space controls. MeshBuilder creates the tabletop, bowls, credits, tax columns, and gate. CLAD generated the plant, music, and sound cues. Asset provenance and license notices are included in `devpost/asset-provenance.md`.

All eight actual-SIK LEAF scenarios passed for the custom UI revision: required teaching and worked examples, Back/Next and preserved learner state, practice drag/drop, budgeting, tax arithmetic, all eight AND/OR cases, full replay, utility controls, and IK interaction. Native compilation and startup checks passed. The expanded replay took 126.702 seconds, exceeding the tool's response window; the native LEAF log and final state confirm its pass. Exact evidence is in `devpost/verification.md`. The IK check routes indirectly at 115 cm; no claim of direct arm reach or real-device comfort is made.

## Build challenges

Automatically installed inspection/testing dependencies used newer package names than the project's installed frameworks. The build preserved the original SIK/UIKit versions, adapted verified imports in an editable inspection package, and selected compatible official testing packages through native APIs. A package reload error required reopening the saved project.

Actual interaction testing then exposed a button-lifecycle bug: refreshing a panel destroyed the control while its release event was still finishing. The fix keeps button identities stable and queues layout changes. This is why compilation and a welcome screenshot alone were insufficient verification.

Reviewing the custom interface at the maximum example income exposed a tax column covering the feedback inset. A shared smaller height scale and closer tray spacing keep the retained/tax proportions intact while leaving room for the tutor's explanation.

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
