const fs = require('fs');
const path = 'resources/js/Pages/MembreFamille/Liturgie/Index.jsx';
let src = fs.readFileSync(path, 'utf8');
const start = '<div className= acte-timeline>';
const idx = src.indexOf(start);
if (idx === -1) throw new Error('start not found');
const closeIdx = src.indexOf('</div>', idx);
if (closeIdx === -1) throw new Error('end not found');
fs.writeFileSync(path, src.slice(0, idx) + src.slice(closeIdx + '</div>'.length));
