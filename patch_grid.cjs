const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const search = `<div><span className="text-gray-500">Peak:</span> {file.report.analysis.peak.toFixed(2)}</div>`;
const replace = `<div><span className="text-gray-500">True Peak:</span> {(20 * Math.log10(file.report.analysis.peak || 1e-6)).toFixed(2)} dB</div>`;

content = content.replace(search, replace);
fs.writeFileSync('src/App.tsx', content);
