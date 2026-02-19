# Task: Add Profession Column to TabUtilisateurs and TabClasse

## Analysis:
- The `profession` column already exists in the users table (database migration)
- The User model already has `profession` in `$fillable`
- Profession is displayed in MemberDetailsModal (both files)
- Profession field exists in EditMemberModal (both files)
- **Missing**: Profession column in main tables

## Changes Required:

### 1. TabUtilisateurs.jsx
- [ ] Add "Profession" header to table
- [ ] Add profession data cell to each row

### 2. TabClasse.jsx  
- [ ] Add "Profession" header to ClasseDetailsModal table
- [ ] Add profession data cell to each row in class members table

## Implementation Status:
- [ ] Pending: TabUtilisateurs.jsx edits
- [ ] Pending: TabClasse.jsx edits
