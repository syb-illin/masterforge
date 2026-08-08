const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<tr>\s*<td className="py-1 text-gray-500">Spectral Flatness<\/td>[\s\S]*?<\/tr>/m;

const match = content.match(regex);
if (match) {
  const replace = match[0] + `
                                      <tr>
                                        <td className="py-1 text-gray-500">Spectral Rolloff (85%)</td>
                                        <td className="py-1 text-right">{Math.round(file.report.analysis.rolloff || 0)} Hz</td>
                                        <td className="py-1 text-right text-indigo-300">{Math.round(file.report.refinedAnalysis.rolloff || 0)} Hz</td>
                                      </tr>`;
  content = content.replace(regex, replace);
  fs.writeFileSync('src/App.tsx', content);
}
