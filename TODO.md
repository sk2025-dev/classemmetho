# TODO: Remove jQuery and Replace Select2 with React-Select

## Tasks
- [x] Remove "jquery" and "select2" from package.json dependencies
- [x] Remove jQuery and Select2 CDN loads from app.blade.php
- [x] Rewrite Select2Classe.jsx to use react-select with Tailwind styles
- [x] Rewrite SmartSelect.jsx to use react-select, keeping smart logic
- [x] Run npm install to update lock file
- [x] Clean all form files to remove jQuery/Select2 imports
- [x] Create CitySelect.jsx component with react-select and API search
- [x] Replace all CitySearch components with CitySelect in all forms
- [x] Test application to ensure selects work correctly (dev server running on localhost:5174)
