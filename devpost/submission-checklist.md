# Submission readiness — Money Garden

Checked against Devpost's live overview, rules, submission form, judging criteria, dates, and November 6 organizer update on 2026-11-06. This file records requirements, not a guarantee of eligibility.

Deadline: **November 9, 2026, 5:00 p.m. America/New_York (EST)**.

## Required deliverables

- [ ] New work created within the October 15–November 9 submission period; disclose incorporated pre-existing work and third-party assets.
- [x] Planning through the official Devpost Learn skill pack; reviewed design brief in `devpost/`.
- [x] Working Specs Lens built through CLAD and native Lens Studio MCP.
- [x] Native compile/startup checks and seven passing LEAF flows cover the five done criteria. Final evidence and hardware limits are recorded in `verification.md`.
- [ ] Public GitHub, GitLab, or Bitbucket repository containing the Lens Studio project and `devpost/` folder. Exclude credentials, local MCP authentication, caches, and machine-specific settings from publication.
- [ ] Public YouTube video under three minutes showing the actual working Lens. Show the Lens within the first ten seconds and include an uncut sequence, following the November 6 organizer guidance.
- [ ] Description covering the user, problem, functionality, spatial design, learning, and how Devpost Learn and CLAD were used. Claims must match demonstrated behavior.
- [ ] Authorized third-party asset/software use and required license notices.
- [ ] English submission materials or required translations; accessible project for judging through November 17.
- [ ] User-provided eligibility declarations and required questionnaire answers; never infer them from machine location or project history.

The formal rules call planning docs optional, while the overview, submission form, and latest organizer update request them. Include them to satisfy the stricter practical requirement.

## Acceptance mapping

| User criterion | Planned evidence |
| --- | --- |
| User experience | One practice interaction, few large targets, contextual feedback, undo/retry/recenter, mouse-compatible SIK interactions |
| Completeness | Welcome → three connected lessons → summary → replay/new scenario, with failure recovery |
| Depth | World-space scale and inspection, direct manipulation, spatial animation, logic simulation, supplemental audio |
| Design and polish | Consistent art direction, readable additive-display UI, uncluttered stages, responsive highlighting, screenshots reviewed |

Official equally weighted judging categories: Design, Technical Implementation, Innovation/Idea, Presentation. The submission must address both the user's quality checklist and these official categories.

## Suggested demo sequence (target 2:40)

- 0:00–0:10: show the active garden and identify the intended learner.
- 0:10–0:55: uncut budget allocation, surprise expense, and visible result.
- 0:55–1:30: predict then reveal the incremental tax-layer example.
- 1:30–2:05: demonstrate why OR admits an unsafe purchase under this scenario's stated policy, then switch to AND.
- 2:05–2:25: reach the summary and start a new scenario.
- 2:25–2:40: briefly explain the design brief, CLAD build, and verified tests. Do not claim device testing without evidence.

## Submission form information still needed

The live form requires personal identity/location and eligibility declarations, repository URL, a technology explanation, and reflections on prior Lens Studio experience, CLAD fidelity, time spent, AI cost, obstacles, desired improvements, future use, learning, and AR design. These are the participant's answers; keep them unset until supplied.

## Sources

- https://learn-specs.devpost.com/
- https://learn-specs.devpost.com/rules
- https://learn-specs.devpost.com/updates
- https://learn-specs.devpost.com/resources
- https://github.com/challengepost/learn-specs

Native connection checks succeeded: ListAllPanels and ExecuteEditorCode. Loaded project matched `E:/Dev/SPECS/Learn_AR_with_Specs/Learn_AR_with_Specs.esproj`; account authorization was true. Executable version: 5.24.1.

## Build checkpoint — 2026-11-06

The user approved Money Garden for a broad audience. CLAD created the lesson state, UI, world geometry, controller, audio, authored scene objects, generated plant, icons, font, and audio assets. The first assembled version compiled successfully and returned no runtime errors; the builder reviewed its welcome screenshot.

Final verification is incomplete. Native QueryRuntimeSceneTool automatically installed AiPreviewAgentInspect, whose examples reference missing `UIKit.lspkg` and `InteractionKit.lspkg` modules. The existing project uses `SpectaclesUIKit.lspkg` and `SpectaclesInteractionKit.lspkg`. The automatic installation also brought Icons/Motion packages and triggered an Icon Atlas plugin permission dialog. The user confirmed reviewing and allowing that dialog; native tools respond again and still identify the intended project. Compatibility recovery and final verification are underway.

The animation/placement edits subsequently passed native compilation and startup verification. Inspection imports were repaired in a native-unpacked editable package; no generated Cache files were edited. The user also reviewed and allowed the separate LEAF Plugin permission prompt.

The automatically installed Leaf/Interact 4 packages were incompatible with the existing framework names. Native package APIs replaced only those new testing dependencies with official Leaf 2.0.2 and AiPreviewAgentInteract 2.0.1, preserving SIK/UIKit 2.0.0. The project was explicitly saved after replacement. Package unload/reload caused an internal Lens Studio error. The user subsequently closed and reopened only this project. Native connection, exact project identity, and sign-in were verified again; compilation and startup runtime checks now pass.

The interaction script binding was restored and the plant was moved inside the tabletop footprint. Actual testing found and fixed button destruction during release and an uninitialized audio-cue stop. Seven real-SIK LEAF flows now pass: practice, budget, tax, logic, replay, utilities, and IK. The IK test routes indirectly at 115 cm; it is not proof of direct arm reach or hardware comfort.

Visual review also prompted readable label plaques and contrasting coin stacks. Clean gallery captures are being finalized in `devpost/screenshots`; test-run screenshots under Assets may include diagnostic overlays and are not the submission gallery.

The submission draft, timed demo narration, asset provenance, font/icon license notices, and repository exclusions are prepared. The Devpost draft is https://devpost.com/software/money-garden, with a thumbnail and three verified screenshots. A public repository, public YouTube demonstration, and participant declarations remain outstanding. Draft status is not a submitted entry.
