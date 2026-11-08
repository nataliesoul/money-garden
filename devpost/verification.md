# Cashfall verification

Verified 2026-11-08 in Lens Studio 5.24.1 (Public), SPECS27 Interactive Preview, using the Lens Studio MCP tooling (AiPreviewAgent pinches and drags, runtime scene queries, log capture). Everything below was driven through real SIK controls: UIKit buttons on the console, jar `Interactable`s, and the grabbable coin's `InteractableManipulation`. No private handlers were called.

## Runtime health

- `RecompileTypeScriptTool`: clean on every build.
- `RunAndCollectLogsTool` after each change: no script errors. The only warnings are Lens Studio's own material-batching notices and the LEAF plugin's state-save notice, neither from Cashfall code. The earlier "Audio Listener component has to be added" warning was fixed by adding an `AudioListenerComponent` to the camera.
- Every page logs a read-only snapshot (`[Cashfall] page …` / `action …`) with scenario, gross, tax, take-home, allocation, lamp states, operator, discovered truth-table rows and the month result.

## Flow checks (first-paycheck scenario)

| Step | Driven by | Observed |
| --- | --- | --- |
| Welcome → place | pinch "Place in front of me" | Machine assembles with a pop-in; console appears; `page tax_intro` logged with gross 4000, tax 400, take-home 3600. |
| Falls, steps 1–4 | Next ×3 | Terrace highlight moves per step; copy shows $0 + $200 + $200 = $400, take-home $3,600, effective rate 10%. |
| Explore | + $500 ×3 | Snapshots logged at 4500/500/4000, 5000/600/4400, 5500/700/4800; pools, tube fill, PAYCHECK/TAX/TAKE-HOME/EFFECTIVE RATE chips update (12.7% at $5,500). Coins skim into the tube. |
| Myth check | "No, it goes up" | Result page "Right: take-home goes up", raise demo shows $4,500 → $500 tax → $4,000 take-home, effective 11.1%. |
| Split | tap NEEDS ×5, WANTS ×3, SAVE ×1, then drag the floating coin onto SAVE | Chips read $1,800 (5) / $1,080 (3) / $720 (2); "Every coin has a job"; Run the month enabled. The drag was accepted as the tenth coin. |
| Month | Run the month | 5.75 s animation (log 02:33:42.598 → 02:33:48.348): needs paid, bill drops on SAVE, two coins pulled. Result "The cushion held", SAVE $70 left, WANTS untouched. |
| Growth | See it grow | "$720 a month becomes $111,803" (contributed $86,400, growth $25,403); coin column rises; chip counts up. |
| Gate intro | On to the gate | Lamps A TRUE / B FALSE from the learner's split; SAVE after buying $320 vs cushion $720. |
| Predict | "It is blocked" | Cart rolls to the gate and bounces; "Called it"; T AND F recorded. |
| Truth table | toggle B, Run the cart | Both lamps lit, gate opens, cart crosses to the end pad; table shows T AND F = SHUT and T AND T = OPEN (2 / 8). |
| Policy | AND | "Exactly: AND is the rule" with mint tone. |
| Summary | See your month | Four chips (paycheck → tax → take-home; split; month; 10-year habit), three takeaways, Replay / New scenario / Free play. All three chapter tabs mint. |

## Model checks (pure functions, inspected by reading the code and the logged snapshots)

- `taxBreakdown` is exact for every $500 step from $1,000 to $8,000 because it sums slice × rate with the slice capped per bracket; the logged values at 4000, 4500, 5000 and 5500 match hand calculation.
- `runMonth` pays needs up to the scenario floor, takes the surprise from SAVE, then WANTS, then reports the uncovered remainder; `success` requires needs covered and no raid.
- `gateOpen` is the plain AND / OR truth; `ALL_ROWS` enumerates all eight rows and `discoveredCount` drives the 8-of-8 completion copy.
- `compoundMonthly` is the standard future value of a monthly contribution.

## Not verified

- Physical Specs hardware: comfort, hand-tracking feel, real-table WorldQuery hits. The surface path was implemented against the WorldQuery API with a fallback; only the fallback was exercised in Preview.
- Audio was not listened to; cues are played through the spatial emitter pool without errors.
- Scenarios 2 and 3 share the same code path as scenario 1 and were not driven end to end in this pass.
- No LEAF scenarios were written for this build.
