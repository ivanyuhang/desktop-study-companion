# Forest Fairy implementation plan

Approved scope: replace all three pets with the supplied unchanged PNG. Keep current branch and unrelated work.

1. Add regression tests for migration of each legacy pet, preserving all other study data, rejection of old IDs for new writes, and restart persistence. Verify failure before implementation.
2. Register forest-fairy as the sole/default ID. Normalize known legacy IDs only at store load; retain strict validation for new writes and unknown data. Preserve original data file until next normal atomic save.
3. Copy exact supplied PNG to renderer assets/pets. Replace PetCharacter and PetSelector with ForestFairyPet and CompanionInfo. Update DesktopPet, Settings and PetWindow without changing Electron window behavior or preload.
4. Remove unused SVGs and selector-only CSS. Maintain contain sizing, transparency and full character visibility. No animation.
5. Update smoke fixtures, run tests/lint/build and Electron initial/restart checks. Inspect main/settings/narrow/desktop screenshots and PNG identity. Independent review, then handoff notes.

Completed: all five steps. Validation and final file inventory: docs/forest-fairy.md.
