const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<tr>\s*<td className="py-1 text-gray-500">AI Artifact Probability<\/td>\s*<td className="py-1 text-right text-red-400">\{\(file\.report\.analysis\.aiArtifactScore \* 10\)\.toFixed\(0\)\}%<\/td>\s*<td className="py-1 text-right text-indigo-300">\{\(file\.report\.refinedAnalysis\.aiArtifactScore \* 10\)\.toFixed\(0\)\}%<\/td>\s*<\/tr>/m;

content = content.replace(regex, '');
fs.writeFileSync('src/App.tsx', content);
