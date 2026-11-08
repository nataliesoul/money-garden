# Cashfall — submission draft

## Tagline

See where every dollar goes. A tabletop money machine for Specs that teaches taxes, budgeting and logic in one month.

## Inspiration

Money lessons usually arrive as spreadsheets. On glasses the lesson can be a thing on your table: a paycheck you watch fall, coins you move with your hands, a gate you can see open or stay shut. Cashfall turns three abstract ideas, marginal tax steps, the 50/30/20 split with a cushion, and AND/OR decision rules, into one machine you stand in front of.

## What it does

- **Place it.** Aim at your table and pinch (WorldQuery hit test) or place it in front of you.
- **The Falls.** Your paycheck drops down three tax steps. Only the dollars that land on a step pay that step's rate; the skimmed coins arc into a tax tube. Explore with +/− $500 and bust the "a raise can lower my take-home" myth with a live demo and the marginal vs effective rate.
- **The Split.** Take-home becomes ten coins. Pinch and drop them into NEEDS, WANTS and SAVE, run the month, watch a surprise bill test your cushion, then see the SAVE habit compound over ten years as a rising coin column.
- **The Gate.** A purchase must pass two checks lit from your own split. Predict, run the cart through an AND gate, fill the eight-row truth table with override toggles, and pick the operator that enforces "both must hold".
- **Finish and repeat.** A summary with three takeaways, then Replay, three scenarios, or Free play.

## How we built it

Claude Code with the CLAD toolkit drove Lens Studio through its MCP tools: VirtualScene bootstrapped the authored hierarchy, IconSelector and FontSelector imported Material Symbols and Outfit, the build-sfx and build-music engines synthesised every sound, and the AiPreviewAgent tools drove the finished lens with real SIK pinches and drags for verification. The machine is MeshBuilder geometry with baked vertex shading; the UI is SpectaclesUIKit with custom RoundedRectangle visuals; interaction is SpectaclesInteractionKit.

## Challenges

Keeping a 46 cm machine, a readable console and a dozen value chips inside the Specs field of view from a seated viewpoint meant lifting the basin, jars and track onto pedestals and laying the console flat in front like a lectern. Labels had to be placed from scale-independent anchors because parts are mid pop-in when a page opens.

## Accomplishments

A complete three-chapter lesson with a beginning, middle and end, verified end to end in Preview with no runtime errors, custom UI with hover and press states on every control, and spatial audio that comes from the part that made the sound.

## What we learned

Height is a teaching tool: when money literally falls, "only the slice above $3,000 pays 20%" needs no diagram. And making the learner's own budget light the logic lamps turns an abstract truth table into a personal decision.

## What's next

Hardware testing on Specs, LEAF scenarios for every page, a custom-income keypad, and a fourth chapter on interest and debt.
