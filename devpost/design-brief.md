---
status: approved-by-build
name: Cashfall
date: 2026-11-08
supersedes: Money Garden (backup in Submission/backup/MoneyGarden-backup-2026-11-08.zip)
---

# Design brief: Cashfall

**One line.** A tabletop money machine that you place on a real surface. Your paycheck falls through tax steps, splits into jars, and a purchase has to pass a logic gate. Three lessons, one machine, one month.

**Audience.** Broad. No prior finance or logic knowledge. Plain words, concrete amounts, forgiving retries. All amounts are fictional practice credits shown as dollars; the tax steps are practice rates, not a real schedule.

## Why AR

- The machine is world-locked on the learner's own table (WorldQuery hit test, with a fallback placement in front of the viewer). Height carries meaning: money literally falls.
- Money is tangible. Coins are pinched and dropped into jars with SIK hand interaction. Each pinch is one decision.
- Cause and effect live in space: the tax tube fills on the right while the basin fills in the middle; the gate is shut or open; the cart rolls or bounces.
- Spatial audio puts the coin clinks and the gate thunk where the parts are.

## Flow (beginning, middle, end, replay)

1. **Place.** Title card. "Place on a surface" (pinch the reticle on a table) or "Place in front of me".
2. **Chapter 1, The Falls (taxes).** The paycheck lands in the hopper and drops down three terraces: 0% up to $1,000, 10% up to $3,000, 20% above. Only the dollars that land on a step are taxed at that step's rate. Explore with +$500 / -$500. Myth check: "A raise pushes you into the 20% step. Does your take-home go down?" The machine runs the raise and shows +$500 gross becomes +$400 take-home. Marginal vs effective rate is shown with the real numbers.
3. **Chapter 2, The Split (budget).** Take-home becomes ten coins. Pinch coins into NEEDS, WANTS, SAVE (or use the + and - chips). A 50/30/20 guide ring sits on each jar. Run the month: needs are paid, then a surprise bill hits the SAVE jar. If the cushion is too small, WANTS is raided and any remainder is shown as uncovered. Retry is always available. Then the growth reveal: the monthly SAVE amount compounded at 5% for 10 years.
4. **Chapter 3, The Gate (logic).** A purchase arrives. Check A: needs are covered. Check B: the cushion stays intact after buying. Both lamps are lit from the learner's own budget. The gate combines them with AND or OR. Predict, run the cart, see the result, then fill the truth table (8 rows) with override toggles, then pick the operator that enforces "both checks must pass".
5. **Summary.** Your month on one card plus three takeaways. Replay, New scenario (three deterministic scenarios), or Free play.

## Visual identity

Night-market fintech: deep indigo cards with glowing cyan and gold edges, white Outfit type, gold coins, mint/gold/coral rate colors, cyan/lavender/mint jars. Everything readable on an additive display (no dark-only meaning, color never carries an answer alone). Custom UIKit visuals (RoundedRectangle gradients and borders, custom Button states), Material icons on every control.

## Layout (machine-local cm, +Z toward the viewer)

- Base slab 46 x 2 x 32 on the surface. Machine height about 46.
- Tax stage: hopper (0,40,-12), terraces at y 31 / 24 / 17 stepping toward the viewer, basin (0,6,9), tax tube (17,14,-6).
- Budget stage: basin lifts to (0,18,-4); jars at x = -14 / 0 / 14, y 4, z 8.
- Logic stage: track along the front, cart from x -16 to +16, gate at x 2, lamps A and B on posts at the left.
- Console (lesson card and controls) in front, 40 x 16, tilted back 25 degrees, world-locked with the machine.
- Value chips float beside the parts they describe.

## Done criteria (checked in Preview)

1. Place, then the machine assembles in front of the viewer; console readable; recenter works without losing progress.
2. Tax math is exact for every gross from $1,000 to $8,000 in $500 steps; raise demo shows the right delta; effective rate shown.
3. Ten coins conserve; needs floor and cushion checks produce the right month result; surprise drains the right jar; retry restores.
4. Gate truth is correct for all 8 (A, B, op) rows; truth table fills; policy question grades correctly.
5. Summary reaches with replay / new scenario / free play; no compile or runtime errors.
