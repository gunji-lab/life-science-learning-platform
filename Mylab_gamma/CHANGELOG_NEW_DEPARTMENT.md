# CHANGELOG: New Department Addition

Date: 2026-07-17

## Added

- Added `Mylab_gamma` as a gamma working copy based on the current `Mylab_beta`.
- Added the Department of Biomedical Engineering (`生体医工学科`) to `data/departments.json`.
- Added 14 official laboratory entries for `生体医工学科` to `data/labs.json`.
- Added blue department theme values:
  - `className`: `biomed`
  - `color`: `#2f6fb3`
  - `soft`: `#eef5ff`
  - `line`: `#c8dcf4`
- Added minimal tag parent rules for biomedical engineering terms such as medical devices, biomaterials, biosensors, rehabilitation, stress, and bio-signal processing.
- Added `LAB_RESEARCH_WORKSHEET.csv` for manual review.
- Added audit and review reports:
  - `DATA_AUDIT_REPORT.md`
  - `NEEDS_REVIEW.md`
  - `MISSING_INFORMATION_REPORT.md`

## Preserved

- Existing 26 laboratories were not edited.
- Existing stable/beta folders were not intentionally modified.
- Existing card variants, Research Compass order, and JSON field meanings were preserved.

## UI Behavior

- New department appears through the existing department-driven UI.
- Course section is hidden when a lab has no confirmed course data.
- No new department-specific component was introduced.

## Validation

- JSON syntax check passed for departments, labs, events, and Research Compass JSON.
- JavaScript syntax check passed for `Mylab_gamma/app.js`.
- Data integrity check passed:
  - Departments: 3
  - Total labs: 40
  - New labs: 14
  - Duplicate IDs: none
  - Unknown departments: none
