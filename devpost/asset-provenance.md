# Money Garden asset provenance

Recorded November 6, 2026. Preserve original package notices when sharing the project.

| Asset | Source and treatment |
| --- | --- |
| `Assets/GeneratedMeshes/MoneyGardenPlant.glb` | Generated for Money Garden using CLAD's SPECS mesh generation workflow. Imported and normalized to approximately 7.5 × 10 × 8.4 cm. |
| Board, bowls, credits, tax columns, and logic paths | Project-authored runtime geometry in `MoneyGardenWorld.ts`, using Lens Studio MeshBuilder. |
| Custom botanical interface | Project-authored composition and theme in `MoneyGardenPanelUI.ts`: chapter tabs, sprout mark, layered cards, station headings/values, and button states built with public SpectaclesUIKit rounded-rectangle and custom-visual APIs. The existing Inter font is reused and previously imported Material Symbols remain in the project. Text stays native Text rather than raster artwork. No substantial implementation was copied from the custom-visual example. |
| `Assets/GeneratedSFX/Allocate.wav`, `Correct.wav`, `Retry.wav` | CLAD build-sfx presets waterDrop, uiSuccess, and a soft uiClick, with local filtering/mastering. Recipe: `Assets/Authoring/gen_money_garden_audio.cjs`. |
| `Assets/GeneratedSFX/BackgroundMusic.wav` | CLAD build-music: F-major harmony, vibraphone/kalimba, 62 BPM, eight bars. Recipe is preserved in the same authoring script; its random seed was not recorded. |
| `Assets/Fonts/Inter.ttf` | Imported through FontSelector. Embedded metadata identifies Inter 4.001, revision 66647c0bb, Rasmus Andersson and the Inter Project Authors. No font modification is claimed. |
| Four `Assets/Icons/*.png` files | Native IconSelector rasterizations of Google Material Symbols Rounded: play_arrow, info, volume_up, and center_focus_strong. |
| Lens Studio project/template | The existing Specs project supplied the starting framework and scene setup. Custom Money Garden lesson scripts and geometry were created during this build. |

Inter uses the [SIL Open Font License](https://github.com/rsms/inter/blob/master/LICENSE.txt); its full notice is included in `licenses/Inter-OFL.txt`. Material Symbols use [Apache License 2.0](https://developers.google.com/fonts/docs/material_symbols); the full license is included in `licenses/Material-Icons-Apache-2.0.txt`. The exact font download URL was not retained; the source attribution above comes from its embedded metadata.

## Development dependencies and compatibility changes

- SpectaclesInteractionKit 2.0.0 and SpectaclesUIKit 2.0.0 are the original framework packages used by the Lens.
- The testing setup uses official Leaf 2.0.2 and AiPreviewAgentInteract 2.0.1 packages. Native Asset Library APIs replaced newly auto-installed incompatible 4.x testing packages; the original SIK/UIKit packages were preserved.
- AiPreviewAgentInspect 4 was unpacked through Lens Studio's supported native package API into editable Assets. Seven import paths in two example scripts were adapted from `UIKit.lspkg` / `InteractionKit.lspkg` to the verified installed Spectacles-prefixed packages. Existing copyright headers were retained. Generated Cache files were not edited.
- Icons, Motion, Bitmoji 3D, and SimpleVertexBaseColor support the installed frameworks and development tools. Retain the notices distributed with these packages; do not apply the font/icon licenses to all dependencies.
- `Assets/Authoring/preview_glb_45.py` adapts CLAD's preview helper for Blender 4.5 and retains its Specs copyright and Apache-2.0 header.
- Planning used the [Devpost Learn Specs pack](https://github.com/challengepost/learn-specs), revision `5d8bc0800346d38e468c29b15afcb7ca92280005`.

These records describe asset provenance, not a claim of exclusive ownership over generated material. The participant must supply their own creation-period and eligibility declarations in the submission.
