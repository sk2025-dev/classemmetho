# TODO - Fix RegisterFamille Responsable Data Issue

## Problem
When registering a family from admin panel, the responsable de famille data is not saving to the database while member data saves correctly.

## Root Cause
The `lienParente` field is missing from the responsable state and form in RegisterFamille.jsx, causing data inconsistency.

## Tasks

- [ ] 1. Add `lienParente` field to responsable state in RegisterFamille.jsx
- [ ] 2. Add `lienParente` input field in the responsable form section (step 2)
- [ ] 3. Verify the data flow to backend

## Files to Edit
- `resources/js/Pages/Admin/Inscriptions/RegisterFamille.jsx`
