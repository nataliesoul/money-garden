# Submission readiness — Cashfall

Deadline: **November 9, 2026, 5:00 p.m. America/New_York (EST)**. This file records requirements, not a guarantee of eligibility.

## Required deliverables

- [x] Working Specs Lens built through CLAD and the native Lens Studio MCP tools; placement, three chapters and the summary were driven end to end in Preview (see `verification.md`).
- [x] Design brief (`design-brief.md`), learning content (`learning-sources.md`), asset provenance and licenses (`asset-provenance.md`, `licenses/`).
- [x] Screenshots of every chapter in `screenshots/cashfall/`.
- [x] Devpost draft (`submission-draft.md`) covering the user, problem, functionality, spatial design, development lessons and CLAD usage; claims match Preview evidence and disclose that no hardware test was performed.
- [x] Public repository content prepared on 2026-11-08: the publication checkout mirrors the saved Lens Studio project (`Assets/`, `Packages/`, `devpost/`, `tempAssetGen/`, the `.esproj` and TypeScript manifests, README, `.gitignore`) with the Remote Service Gateway credential fields blanked in the public scene and every Money Garden file removed; committed on `main`. A zip of the same content sits beside the checkout for a direct upload if needed.
- [x] `main` pushed to GitHub on 2026-11-08 (commit `1a87ae5`); the pushed tree was checked again: three blank credential fields, no Money Garden or private paths, public URL reachable.
- [ ] Paste the repository URL into the Devpost form. The remote still carries the earlier name (`money-garden`); rename it to `cashfall` in the repository settings first if you prefer (GitHub redirects the old URL), then update the remote URL.
- [ ] Public YouTube video under three minutes showing the actual working Lens within the first ten seconds, with an uncut sequence (follow `run-and-demo.md` and `demo-narration.md`).
- [ ] Disclose that work was created within the submission window (Cashfall was built on November 8, 2026) and list third-party assets (Outfit font, Material Symbols, Snap packages).
- [ ] Eligibility declarations and questionnaire answers supplied by the participant (local worksheet: `Submission/participant-answers.md`, not published).

## Judging criteria mapping

| Criterion | Evidence |
| --- | --- |
| User experience | One console with Back/Next pacing, large custom buttons with hover and press states, pinch-or-tap allocation, Undo and a one-tap 50/30/20, forgiving retries, help and recenter on the dock |
| Completeness | Place → Falls → Split → Gate → summary with takeaways; Replay, three scenarios, Free play |
| Depth | WorldQuery surface placement, SIK grab-and-drop and jar colliders, world-locked spatial layout, spatial audio emitters, MeshBuilder machine with stage transitions, out-of-view recovery |
| Design and polish | Night-market fintech palette on an additive display, Outfit type, Material icons, value chips anchored to machine parts, coin flights, pop-in transitions, toned feedback notes |

## Known limits to state

- Verified in the Lens Studio Preview only; no physical Specs test.
- The WorldQuery surface path falls back to a camera-relative pose when no surface data is available (always the case in the Preview fallback test).
- Tax rates are practice rates; the lesson is not financial advice.
- The scene still contains the disabled Remote Service Gateway example object from the Lens Studio template, including an empty credentials holder; Cashfall does not use it.
