# Forest Fairy replacement — 27 October 2026

The supplied PNG is now the only companion, identified as forest-fairy. It is copied unchanged to src/renderer/src/assets/pets/forest-fairy.png. Source and destination SHA256: 35AA3141661E301BA4275FB6013CD625E58B5B41922040B0B1733402E265BC9A. The image is 1254 × 1254 RGBA with transparent pixels (alpha 0–255), approximately 2.01 MB. No generation, cropping, recoloring, or compression was applied.

## Created
- src/renderer/src/assets/pets/forest-fairy.png
- src/renderer/src/components/ForestFairyPet.tsx — reusable static image with optional size and className, contain sizing, preserved aspect ratio and transparency.
- src/renderer/src/components/CompanionInfo.tsx — simple character information and preview.
- tests/pet-migration.test.ts — four regression tests.
- tests/fairy-ui.cjs — image decode, sizing, absent selection controls, narrow layout and transparent desktop window verification.
- docs/superpowers/plans/2026-10-27-forest-fairy.md and this report.

## Modified
- src/shared/models.ts — sole registered/default ID forest-fairy.
- src/main/store.ts — load-time migration of known legacy IDs before validation. All unrelated data survives. Migration is reflected immediately in memory and persists on the next normal atomic save; until then it is safely reapplied at startup. Unknown IDs remain invalid.
- src/renderer/src/pages/DesktopPet.tsx, Settings.tsx, PetWindow.tsx — use new mascot, remove selection UI, retain show/hide/close behavior.
- src/renderer/src/assets/modules.css and forest.css — remove obsolete selector styling, transparent full-figure rendering.
- tests/foundation.test.ts, electron-smoke.cjs and notification-smoke.cjs — current mascot fixtures.

## Removed
- src/renderer/src/components/PetCharacter.tsx
- src/renderer/src/components/PetSelector.tsx
- src/renderer/src/assets/pets/cat.svg, fox.svg, owl.svg

Only historical migration code and regression fixtures retain old IDs. No old character is registered or selectable. Preload and desktop-window main-process behavior are unchanged. No new dependencies, animations, movement, or unrelated redesign were added.

## Validation
- npm test: 17 tests passed. The four new tests were first observed failing, then passing.
- npm run lint: passed.
- npm run build, including both TypeScript checks: passed.
- Electron smoke initial and restart: passed.
- Fairy UI checks: FAIRY_UI_PASS; image decoded in both previews at 1100 and 480 window widths and in the existing 200 × 240 desktop window.
- Visually reviewed full-size preview, narrow settings, and transparent desktop-window captures. Whole character remains visible.
- Independent review caught a CSS specificity issue retaining the old preview frame; corrected before final checks.

Screenshots: .test-data/fairy-ui/. Tests use isolated data. Existing npm mirror-option and Node module-format warnings remain; no blocking issues found. Static PNG only, as requested. No commit or push.

Run from D:\Projects\desktop-study-companion with npm run dev.
