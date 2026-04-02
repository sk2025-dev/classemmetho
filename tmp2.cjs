const fs = require('fs');
const text = fs.readFileSync('resources/js/Pages/Pasteur/Liturgie/Index.jsx', 'utf8');
const markers = [];
let idx = text.indexOf('activeTab === "formations"');
while (idx >= 0) {
  markers.push(idx);
  idx = text.indexOf('activeTab === "formations"', idx + 1);
}
markers.forEach((pos, i) => {
  console.log('marker', i, pos);
  console.log(text.slice(Math.max(0, pos - 80), pos + 80));
  console.log('---');
});
