const fs = require('fs');
const text = fs.readFileSync('resources/js/Pages/Pasteur/Liturgie/Index.jsx', 'utf8');
let idx = text.indexOf('activeTab === "formations"');
while (idx >= 0) {
  console.log(idx);
  idx = text.indexOf('activeTab === "formations"', idx + 1);
}
