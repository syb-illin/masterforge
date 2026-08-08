const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  '{file.report.analysis.aiArtifactScore}/10',
  '{file.report.analysis.aiArtifactScore.toFixed(1)}/10'
);

content = content.replace(
  '<td className="py-1 text-right text-red-400">{file.report.analysis.aiArtifactScore}/10</td>',
  '<td className="py-1 text-right text-red-400">{file.report.analysis.aiArtifactScore.toFixed(1)}/10</td>'
);

content = content.replace(
  '<td className="py-1 text-right text-indigo-300">{file.report.refinedAnalysis.aiArtifactScore}/10</td>',
  '<td className="py-1 text-right text-indigo-300">{file.report.refinedAnalysis.aiArtifactScore.toFixed(1)}/10</td>'
);

fs.writeFileSync('src/App.tsx', content);
