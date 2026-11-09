---
status: approved
name: Cashfall
date: 2026-11-08
supersedes: Money Garden (an earlier prototype, archived outside this repository)
---

# Design brief: Cashfall

<!-- Filled in by plan-lens from the learner's interview, then checked against the finished build. Values the learner did not choose are marked (default). -->

## The one spatial moment
You stand at your own table and watch your paycheck fall through a tabletop money machine: it drops down three tax steps, splits into three jars you fill with pinched coins, and a purchase has to roll through a logic gate that your own budget lights up. Three lessons, one machine, one month. For anyone; no prior finance or logic knowledge needed. All amounts are fictional practice credits shown as dollars, and the tax steps are practice rates, not a real schedule.

## Why it belongs on glasses
- Uses: draws in the world; leaves your body free.
- Why it's better than the phone or laptop version: on a screen, taxes are a spreadsheet. On glasses, height carries the meaning. Money literally falls, only the dollars that land on a step pay that step's rate, and the learner moves coins between jars with their hands, one pinch per decision. Cause and effect live in space: the tax tube fills on the right while the basin fills in the middle, the gate is shut or open, the cart rolls or bounces, and every clink comes from the part that made it.

## Product or overlay
- Type: product. The machine is the experience.
- What the real version would sense: a flat surface to stand on (a table or desk).
- Stand-in for the preview: a "Place in front of me" button that places the machine at a fixed distance in front of the viewer, next to a "Place on a surface" option that uses the WorldQuery hit test with a reticle. The preview exercised the fallback; the surface path is built against the WorldQuery API with a camera-relative fallback pose when no surface data is available.

## Where things live
- Where the user is looking during the main task: down and slightly ahead at a table-height machine about an arm's length away, with the console lying in front of it like a lectern.
- Machine: world-locked on the surface. Base slab 46 × 2 × 32 cm, about 46 cm tall. Coordinates below are machine-local centimeters with +Z toward the viewer.
- Tax stage: hopper at (0, 40, −12); three terraces at y 31 / 24 / 17 stepping toward the viewer; basin at (0, 6, 9); tax tube at (17, 14, −6).
- Budget stage: the basin lifts to (0, 18, −4); jars NEEDS, WANTS and SAVE at x −14 / 0 / 14, y 4, z 8, each with a 50/30/20 guide ring.
- Logic stage: a track along the front, cart from x −16 to +16, gate at x 2, lamps A and B on posts at the left.
- Console (lesson card and controls): 40 × 16 cm in front of the machine, tilted back 25 degrees, world-locked with the machine. Back and Next on every page; help and recenter on the dock.
- Value chips (PAYCHECK, TAX, TAKE-HOME, EFFECTIVE RATE, jar totals, savings growth): float beside the part they describe, anchored to scale-independent anchor points so they land correctly while parts are still popping in.
- Welcome card: head-relative, in front of the viewer, before placement only.
- Look: night-market fintech. Deep indigo cards with glowing cyan and gold edges, white Outfit type, gold coins, mint / gold / coral rate colors, cyan / lavender / mint jars. Everything is readable on an additive display; nothing dark carries meaning and color never carries an answer alone.

## Hands and input
- Place: pinch the reticle on a surface, or pinch "Place in front of me".
- Pace the lesson: pinch Back, Next and the answer buttons on the console.
- Explore the tax: pinch + $500 / − $500; the falls, pools and chips update live.
- Fill the jars: pinch a jar to drop the next coin into it, or grab the floating coin and drag it onto a jar; + and − chips, Undo and a one-tap 50/30/20 are on the console.
- Run the month and Run the cart: console buttons.
- Truth table: pinch the override toggles for lamps A and B, then Run the cart; pick AND or OR for the policy question.
- Targets are big and highlight when aimed at: every control has hover and press states.
- Voice (if any) and the button that does the same job: none.

## When things show
- The lesson runs in this order, paced by Back and Next:
  1. Place. Title card, then "Place on a surface" or "Place in front of me".
  2. Chapter 1, The Falls (taxes). The paycheck lands in the hopper and drops down three terraces: 0% up to $1,000, 10% up to $3,000, 20% above. Only the dollars that land on a step are taxed at that step's rate. Explore with + $500 / − $500. Myth check: "A raise pushes you into the 20% step. Does your take-home go down?" The machine runs the raise and shows that +$500 gross becomes +$400 take-home, with the marginal and effective rates in real numbers.
  3. Chapter 2, The Split (budget). Take-home becomes ten coins. Fill NEEDS, WANTS and SAVE. Run the month: needs are paid, then a surprise bill hits the SAVE jar. If the cushion is too small, WANTS is raided and any remainder is shown as uncovered. Retry is always available. Then the growth reveal: the monthly SAVE amount compounded at 5% for 10 years as a rising coin column.
  4. Chapter 3, The Gate (logic). A purchase arrives. Check A: needs are covered. Check B: the cushion stays intact after buying. Both lamps are lit from the learner's own budget. The gate combines them with AND or OR. Predict, run the cart, see the result, fill the eight-row truth table with the override toggles, then pick the operator that enforces "both checks must pass".
  5. Summary. Your month on one card plus three takeaways, then Replay, New scenario (three deterministic scenarios) or Free play.
- Welcome card: shows at start, hides once the machine is placed.
- Placement reticle: shows while aiming at a surface, hides after placement.
- Console: shows after placement; the lesson card changes per page; the chapter tabs turn mint as chapters complete.
- Machine stages: the tax stage is up during The Falls with the terrace highlight following the current step; the basin lifts and the jars pop in for The Split; the track, cart, gate and lamps pop in for The Gate.
- Value chips: appear with the part they describe and update live. The surprise bill drops on SAVE only while the month runs; the growth column rises only on the growth page.
- If something needs attention out of view: sound from the part that acted (coin clinks, the gate thunk, the cart rolling), and a recenter button on the dock that brings the machine back in front of the viewer without losing progress.

## Done criteria
Each one can be checked in Lens Studio's preview.
1. Place, then the machine assembles in front of the viewer; the console is readable; recenter works without losing progress.
2. Tax math is exact for every gross from $1,000 to $8,000 in $500 steps; the raise demo shows the right delta; the effective rate is shown.
3. Ten coins conserve; the needs floor and cushion checks produce the right month result; the surprise drains the right jar; retry restores.
4. Gate truth is correct for all 8 (A, B, operator) rows; the truth table fills; the policy question grades correctly.
5. The summary is reached with Replay, New scenario and Free play; no compile or runtime errors.

## Out of scope
- Real tax schedules or financial advice: the three steps are practice rates and every amount is a practice credit.
- Typing a custom income; only the three built-in scenarios and Free play.
- A chapter on interest and debt, remembering progress between sessions, and two people sharing the machine.
- Voice input and AI explanations.

## Risks and open questions
- Feel unproven: comfort over time, real hand tracking and real-table WorldQuery hits can only be judged on Specs hardware. The preview exercised the fallback placement; the surface path has not hit a real table.
- A 46 cm machine with a console and a dozen value chips is near the limit of what fits in the glasses' view from a seated viewpoint. Parts were lifted onto pedestals and the console laid flat to keep everything inside it; whether it stays comfortable over a whole lesson is unproven.
- Audio plays through the spatial emitters without errors but was not listened to in the preview.
- LEAF scenarios were not written for this build; the done criteria were checked by driving the preview with real SIK pinches and drags (see `verification.md`).

## Build notes for CLAD
- Build for SPECS so it runs and can be demonstrated in Lens Studio's preview. No SPECS device is available.
- Use Spectacles Interaction Kit (SIK) and UI Kit for all interactions, so they work with the mouse in Interactive Preview and with LEAF.
- Build any stand-in exactly as described above, and keep it obvious in the scene.
- Use real-world scale in centimeters. Keep content inside the user's view during the main task.
- The display is additive: black renders as transparent. Don't rely on black or very dark content to be seen; keep text light and readable from where the user stands.
- Get the basic flow working first, then add detail.
- Write LEAF scenarios for each done criterion, run them in preview, and report which pass. Say which criteria have no test.
- Don't record, identify, or follow people.

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
