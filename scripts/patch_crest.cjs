const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '{file.report.analysis.crestFactor.toFixed(1)} dB',
  '{(20 * Math.log10(file.report.analysis.crestFactor || 1)).toFixed(1)} dB'
);

content = content.replace(
  '{file.report.refinedAnalysis.crestFactor.toFixed(1)} dB',
  '{(20 * Math.log10(file.report.refinedAnalysis.crestFactor || 1)).toFixed(1)} dB'
);

content = content.replace(
  '<div><span className="text-gray-500">Crest Factor:</span> {file.report.analysis.crestFactor.toFixed(1)}</div>',
  '<div><span className="text-gray-500">Crest Factor:</span> {(20 * Math.log10(file.report.analysis.crestFactor || 1)).toFixed(1)} dB</div>'
);

fs.writeFileSync('src/App.tsx', content);
