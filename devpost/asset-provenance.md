# Asset provenance

| Asset | Source | License / notes |
| --- | --- | --- |
| `Assets/Fonts/Outfit.ttf` | Google Fonts "Outfit", imported with the Lens Studio FontSelector tool | SIL Open Font License 1.1 |
| `Assets/Icons/*.png` | Google Material Symbols (Rounded), rasterised and imported with the Lens Studio IconSelector tool | Apache License 2.0 |
| `Assets/GeneratedSFX/*.wav` | Synthesised locally with the CLAD build-sfx and build-music engines (fully algorithmic, no samples); generator scripts in `tempAssetGen/` | License-clean by construction; see the engine's notes |
| Machine geometry | Code-authored MeshBuilder geometry in `Assets/Scripts/CashfallShapes.ts` and `CashfallMachine.ts` | Project code |
| `SimpleVertexBaseColor.lspkg` | Vertex-colour unlit material shipped with the CLAD mesh-builder skill | Apache 2.0 |
| SpectaclesInteractionKit, SpectaclesUIKit, Motion, Utilities, SnapDecorators, Leaf, AiPreviewAgent packages | Lens Studio Asset Library | Snap package licenses; keep their notices |

No third-party models, textures or recordings are used. The earlier Money Garden assets (plant GLB, Inter font, older cues) were removed from `Assets/` and are preserved in `Submission/backup/MoneyGarden-backup-2026-11-08.zip`.
