# Refactor Conducteur/Liturgie/Index.jsx

Status: [IN PROGRESS]

## Goals

- Fix syntax errors (line 5233 styles, line 4912 {value || })
- Split monolith (~5k lines) into reusable components/hooks
- Improve performance (memos/effects), fix typos, standardize UI
- No UX/API changes

## Breakdown Steps (approved plan)

- [x]   1. Create this TODO.md
- [ ]   2. Fix syntax errors in Index.jsx (styles template literal, incomplete expressions)
    - Edit malformed `const styles = `...`;` at end (missing closing `</style>`, syntax)
    - Fix `{value || }` → `{value || '—'}`
- [ ]   3. Extract constants (ACTE_TYPES, ANNONCE_TYPES, etc.) to `Liturgie/constants.js`
- [ ]   4. Extract hooks: `useListData.js` (paging/filter), `useBulkActions.js`, `useModals.js`, `useToasts.js`
- [ ]   5. Extract UI: `Toolbar.jsx` (tabs/search), `KpiCards.jsx`, `ListPanel.jsx` (generic list/pagination/bulk), `ItemCards/ActeCard.jsx`, `AnnonceCard.jsx`
- [ ]   6. Extract Modals: `CreateActeModal.jsx`, `CreateAnnonceModal.jsx` (wizard), `DecisionModal.jsx` (approve/refuse)
- [ ]   7. Extract Stats/Circuits: `StatsPanels.jsx`, `CircuitDiagram.jsx`
- [ ]   8. Update Index.jsx: Orchestrator composes extracts, minimal state
- [ ]   9. Create `Liturgie/index.scss` for styles, remove inline
- [ ]   10. Test: All tabs/filters/bulk/modals/create/submit, responsive, no regressions
- [ ]   11. Lint/Perf: npm run lint, React DevTools re-renders <50
- [ ]   12. Complete: attempt_completion

Next: Fix syntax → Step 2
