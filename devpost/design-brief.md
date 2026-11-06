---
status: approved
name: Money Garden
planned_with: challengepost/learn-specs skills/plan-lens
date: 2026-11-06
---

# Design brief: Money Garden

User request: an educational spatial experience that uses AR cleverly to teach financial literacy, taxes, and logic, with intuitive interaction, completeness, depth, and visual polish.

The user approved the Money Garden direction on 2026-11-06: "It should be for broad audience, let's try the Money Garden". This is an approved build brief, not a description of completed software. Choices marked (default) are implementation defaults. This brief uses the official Devpost Learn plan-lens template and its AR design and Preview constraints.

## The one spatial moment

Move a glowing income token into a miniature garden and watch the money physically divide into essentials, a savings reservoir, and discretionary spending. Run a simulated month: a surprise expense drains the reservoir, while the money reserved for a goal grows a plant. Then inspect the same money passing through tax layers and a purchase-decision gate. All three lessons use the same compact tabletop world (default).

Audience: a broad audience, as requested by the user. Assume no prior financial or programming knowledge; use plain language, concrete quantities, required teaching before practice, and forgiving retries. Main takeaway: account for obligations and uncertainty before committing money; use explicit rules to reason about tradeoffs (default).

## Tutor-first revision — November 6

The user clarified: "Make sure it's not just a game with questions, but a tutor that teaches you first." This requirement supersedes the original prediction-first tax/logic sequence and optional-only explanations below. Each topic must explain its terms, demonstrate a worked example in the spatial model, guide practice, and only then ask for an independent prediction. Questions check understanding after teaching; they do not introduce an unexplained concept.

- Budget: define spendable income, essentials, reserve, and choice. Build a worked 1,000-credit allocation in view: 500 essentials, 300 reserve, 200 choice. Apply the 200-credit surprise and show the remaining 100 reserve before the learner allocates their own money.
- Taxes: define taxable income, tax, and retained income. Build the fictional layers from zero through 1,000, 2,000, and 2,500 credits. Explain 200 tax and 2,300 retained, then show that another 500 adds 100 tax and 400 retained. The earlier layers must stay unchanged.
- Logic: define a condition as a true/false statement, AND as both conditions, and OR as either or both. With A true and B false, demonstrate the closed AND gate and open OR gate before asking the learner to predict or select a policy.
- Teaching uses user-paced Next and Back controls. No timed reading or answer choices before the explanation and demonstration. A Teach again route revisits the lesson and returns to the exact learner state; demonstration values must never spend the learner's credits or overwrite their answers.
- Practice supplies a concrete next step and explains the cause of a shortfall or incorrect prediction. Retry and explanation remain available without scores, penalties, or shaming.

Acceptance for this revision: actual SIK interactions must prove teaching precedes each assessment, examples update the visible world, Back reverses the example, and Teach again preserves progress. Earlier passing tests do not establish this revision's correctness; see the updated verification report when complete.

## Why it belongs on glasses

- Uses: draws in the world; lets learners look around and act directly on a shared spatial model.
- A visible stream splits into destinations with quantities conserved. Tax brackets are separate physical layers. Two visible input paths combine at a logic gate. Position, volume, and motion communicate the causal relationships.
- Learners can look around the model and compare outcomes at the place where their decisions happen, rather than read a floating spreadsheet.
- This version does not claim to recognize currency, receipts, or furniture. No live camera AI is required.

## Product or overlay

- Type: product; the miniature learning garden is the experience.
- What the real version would sense: standard tracked hand input and head movement.
- Stand-in for the preview: a clearly identified virtual tabletop; fixed fictional scenarios. No physical-table detection is claimed.
- Preview and device share the same SIK interaction path. No voice-only, network-only, or custom gesture action.

## Where things live

- User looks slightly down at the garden. It stays in world space after placement; no constantly head-locked dashboard.
- Garden board: approximately 48 cm wide by 28 cm deep, centered about 110 cm in front of the starting view and 25 cm below eye height (default). Final placement must be calculated from the existing camera pose and verified in Preview.
- Three learning stations occupy the same central board sequentially. Inactive station detail hides, avoiding a wide panorama of simultaneous controls.
- Active controls: two or three large targets at a time, at least 5 cm across with separation (default). Labels remain immediately beside their associated objects.
- Lesson prompt: one short teaching step beside the active station. The worked example is part of the default flow; extra detail remains available on request.
- Small progress markers show Budget / Taxes / Logic. Summary replaces the active scene at the end.
- Recenter action brings the board back in front of the current view, then leaves it world-fixed again. Restart and mute remain reachable.
- All labels use readable light colors. Meaning uses text, shape, and motion as well as color.

## Hands and input

- Start: pinch a large Start control; one practice token demonstrates the interaction.
- Budget: grab/drag tokens into clearly labeled destinations with forgiving snapping. A large Allocate button provides an alternative to dragging, using the same allocation logic.
- Taxes: pinch Add income / Remove income controls to see which layer receives the next portion. Pinch Compare to show before/after amounts in the world.
- Logic: pinch the AND/OR selector and two labeled condition controls; then Run to send a visible pulse through the gate.
- Feedback: hover highlight, immediate visual response, short generated sound, and a concise explanation. Sounds are supplemental; mute is available.
- Targets are big and highlight when aimed at. Actions commit once on release; rapid repeated input must not duplicate transactions.
- Voice: none. Mouse-driven Interactive Preview must support every essential action.

## When things show

- Welcome: a title, one sentence explaining the goal, and Start. No introductory text wall.
- Practice: show just the income source, one destination, and a hand hint; remove the hint after success.
- Budget: show three destinations and a live remaining balance. Running the month reveals the surprise expense and its consequences.
- Taxes: hide budget controls; show stacked income layers, a tax collector, and retained income. Label fictional rates throughout this lesson.
- Logic: hide tax controls; show two condition paths and one AND/OR gate, then an open/closed purchase path.
- Feedback: explain the specific outcome and offer Retry or Continue. Wrong answers never trap the learner.
- End: show three short takeaways and scenario results, with Replay / New scenario. The next scenario changes amounts rather than merely recoloring the same puzzle.
- If the board is out of view: a compact direction cue and Recenter affordance; no compulsory turning behind the user (default).

## Lesson rules and exact examples

These are fictional learning exercises, not personalized financial advice or a tax filing calculator.

### 1. Budget: give every token a job

Start with 1,000 credits of spendable money after tax (default), represented by ten 100-credit tokens. Meet 500 credits of essentials, reserve at least 200 credits for the scenario's possible surprise, and decide how to use the remaining 300. The savings target belongs to this scenario; it is not a universal savings rule.

After Check my plan and the learner's prediction, apply a disclosed 200-credit surprise expense. Show savings before and after, unmet essentials, and any uncovered surprise amount. Do not invent debt, interest, or automatic borrowing. Explain shortfalls without shaming the learner. Allow undo before the check, and a complete retry afterward.

Enforce conservation: allocated credits + unallocated credits = income. Never allow negative balances or duplicate token allocation. Do not mark a month successful until the stated essential and reserve constraints are satisfied.

### 2. Taxes: only the next layer gets the next rate

Use a separate fictional annual taxable-income example, visibly distinct from the monthly budget. Rates: first 1,000 credits at 0%; next 1,000 at 10%; amount above 2,000 at 20% (default). Label: "Practice rates — not a real tax schedule."

At income 2,500: tax = 0 + 100 + 100 = 200; retained income = 2,300. At income 3,000: tax = 300; retained income = 2,700. The additional 500 therefore adds 400 to retained income in this simplified example. Animate only the new layer receiving the higher rate; never recolor all income as if it were taxed at that rate.

Teach and demonstrate the comparison before asking the learner to predict in practice. Explain marginal versus average rate with the actual quantities: at 2,500, the top rate is 20%, while 200 / 2,500 = 8% is the average rate in this exercise. Do not generalize this simplified example to benefits eligibility, all taxes, deductions, credits, or real take-home pay.

### 3. Logic: can this purchase pass both checks?

Condition A: essentials are covered. Condition B: enough remains for the scenario's reserve after the proposed purchase. The objective explicitly requires BOTH conditions, so AND implements the policy. OR deliberately opens the path when only one condition is true; let the learner observe why that conflicts with this particular objective. OR is not intrinsically a bad operator.

Allow all four input combinations. AND results: false, false, false, true for (false,false), (false,true), (true,false), (true,true). OR results: false, true, true, true. False paths use a closed gate and text; true paths use a moving pulse and an open gate. Explain and demonstrate both operators first; then ask for a prediction, reveal the result, and explain any mismatch.

### Repeat value

Provide at least three deterministic, solvable budget scenarios (default): income / essentials / surprise = 1,000 / 500 / 200; 1,200 / 600 / 300; 900 / 400 / 200. Derive tokens and checks from scenario data. Tax examples and gate inputs vary accordingly or offer separate practice controls. Show within-session learning progress; cross-session persistence is not required or claimed.

## Done criteria

Each one can be checked in Lens Studio's preview.

1. From a clean start, a user can begin, complete the practice interaction, and see a stable, readable garden in front of them. Recenter returns the garden to view without resetting learning progress.
2. Allocating the budget updates the correct destinations, conserves all credits, and never permits double spending. Checking the plan and predicting displays the 200-credit surprise correctly in the first scenario; shortfalls explain what happened and Retry restores the initial state.
3. Adding 500 to taxable income 2,500 shows tax increasing from 200 to 300 and retained income increasing from 2,300 to 2,700. Only the incremental layer uses 20%; practice-rate labeling stays visible.
4. Both AND and OR give correct results for all four input combinations. A learner can choose AND to enforce the two-condition purchasing objective and receive specific explanatory feedback.
5. The complete sequence reaches a summary with three takeaways. Replay resets all relevant state, New scenario changes the numbers to another solvable scenario, and essential actions work with Preview's mouse-driven hand input. No compile or new runtime errors occur.

## Design and polish targets

- Custom UI revision requested by the user on November 6: "Also use custom UI so experience looks impressive." Give the tutor a botanical field-guide identity with layered lesson cards, clear chapter markers, distinct primary/secondary/utility controls, and coordinated station labels. This supersedes relying on the default translucent UIKit appearance.
- Use supported custom UIKit visuals and standard SIK behavior. Retain the tutor-first sequence, generous targets, visible labels, and persistent control identities. Hover and press feedback should be apparent without distracting from the worked example.
- Use mint, teal, warm gold, and a restrained lavender accent. Bright text and visible edges must remain meaningful on an additive display; color alone must never convey an answer or control state. Keep decoration outside reading and interaction areas.
- Consistent warm ivory, mint/teal, amber, and lavender palette with bright readable labels (default).
- Soft sculpted garden objects and animated money flow, with sparse UI Kit controls. Spatial content carries the lesson; controls support it.
- Short transition animations preserve context between the three stations. No flashing or unnecessary motion.
- Gentle generated ambient music at low volume, with separate allocation, correct-answer, and retry cues and a visible mute control (default).
- Responsive visual feedback on every action; disabled controls explain their prerequisites.
- Preview screenshots reviewed at welcome, active lessons, failure/retry, and summary. Animated stages checked at multiple timestamps.

## Out of scope

- Real tax rates, tax filing, bank connections, investment recommendations, real money, or collection of financial details.
- Camera recognition, voice dependence, multiplayer, persistent spatial anchors, or claims of device-tested comfort.
- Public posting, publishing, or Devpost submission before the deliverables exist and required personal declarations are supplied.

## Risks and open questions

- Money Garden and its broad audience are approved. Tune the implementation defaults for clarity and comfort during Preview verification.
- Three topics could overload a short session. Keep them one sequential story and show one instruction at a time. Target a 4–6 minute first session with a shorter practiced demo (default).
- Dragging reliability and text readability must be checked in Interactive Preview. Real-device comfort and tracking remain "feel unproven" until tested on hardware.
- CLAD package and asset-generation availability must be verified during build. Never silently replace a promised working feature with a decorative placeholder.

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

## Implemented design decisions

The garden initializes approximately 115 cm ahead and 8 cm below the current camera, then stays in world space. The virtual tabletop tilts 25 degrees so its teaching objects are visible from the starting view. Recenter places it relative to the current view without resetting lesson state.

Each tax column is split into retained income and tax, replacing the proposed separate collector. This keeps each layer's total visible without displaying the same tax twice. The tutor revision animates changed tax-layer heights, grouped coin transfers, reserve depletion, plant growth, and logic pulses.

Interaction testing revealed that controls must retain their identities while release and hover events finish. Buttons now persist across lesson changes, with inactive controls disabled. Audio is supplemental and cannot interrupt the learning flow if playback becomes unavailable.

Final verification and any remaining limits belong in `verification.md`; the brief above records the approved design, not a promise that device comfort has been measured.

## After the build: judge it
This part is for you, after CLAD finishes.

1. **Does it work?** Ask your agent which LEAF tests passed and which done criteria have no test.
2. **Walk around it.** Open the preview in Interactive Preview. Use WASD to move, Q and E to go down and up, and right-drag (or hold Shift) to look around. Clicking acts as a pinch. Stand where a user would and look at the task.
3. **Ask the three questions.**
   - Does it use what I'm looking at?
   - Does it put something in my space, where it belongs?
   - Does it free my hands or let me keep my eyes up?
   - Would it be just as good on a phone? If so, what would make it need the glasses?
4. **Check comfort.**
   - Everything I need is in view while I do the task. Nothing sits at the edges, behind me, or stuck to my face.
   - Every control is within reach of someone standing there.
   - Text reads easily from where I stand. No dark UI disappearing.
   - Things show when needed and get out of the way.
5. **Label what you know.** Write "logic proven" next to anything the tests and preview show working, and "feel unproven" next to anything only real glasses could tell you (comfort over time, real hand tracking, real recognition).
6. **Fix with design notes, not code.** Tell your agent what to change in design terms, for example: "Move the step card 15 cm lower and next to the pan. Make the Next button twice as big. Re-run the tests." If a fix takes under a minute, like nudging a panel, do it yourself in the scene.
7. **Submit.** Record a video under 3 minutes of your Lens in the preview, public on YouTube. Make your repo public with your Lens Studio project and this `devpost/` folder. Details are on the hackathon site: https://learn-specs.devpost.com/resources
