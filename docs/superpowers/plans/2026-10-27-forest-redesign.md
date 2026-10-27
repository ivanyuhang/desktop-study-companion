# Forest UI redesign implementation plan

Approved scope: apply the attached hand-painted forest reference to the existing app; proceed with implementation, preserve working features.
Project: D:\Projects\desktop-study-companion. Keep the existing uncommitted Phase 2 work. No commits or pushes.

## Design
- Dark evergreen sidebar, warm parchment clearing, serif headings and readable sans-serif body text.
- Locally generated painterly canopy, alpha wood/vine frame, and circular wreath derived from the supplied reference's visual language.
- Use a nine-slice frame for scalable panels, sparse foliage details, native accessible controls with wood grain and leaf-shaped completion indicators.
- Main application theme scope excludes the transparent desktop pet window.
- Preserve routes, data models, commands, main/preload, storage, scheduling and timer state logic.

## Steps
1. Inspect source, styles, components, navigation, dependencies and Git status.
2. Generate and optimize local assets; verify alpha and record prompts/provenance.
3. Add centralized theme tokens and reusable ForestPanel, ForestButton and ForestProgressRing components. Adapt existing Page, PlaceholderCard, Sidebar, Dialog and FormField rather than duplicate them.
4. Apply forest surfaces and states to all pages, style focus countdown inside wreath and pet preview inside leafy frame.
5. Validate lint, typecheck/build, domain tests and existing Electron interaction/restart tests, narrow layouts, reduced motion, keyboard focus and screenshots.
6. Review for regressions and document changed files, asset limits and run commands.

## Validation
No new dependencies. UI styling is reversible, so reuse the existing meaningful integration tests rather than tests that mirror CSS rules. Add only checks needed for visual behavior such as reduced-motion and overflow. Record output in docs/forest-redesign.md.

Completion: all six implementation steps and validation complete. See docs/forest-redesign.md for evidence and asset provenance.
