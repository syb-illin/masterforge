const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<tr>\s*<td className="py-1 text-gray-500">Spectral Rolloff \(85\%\)<\/td>[\s\S]*?<\/tr>/m;
const match = content.match(regex);
if (match) {
  const replace = match[0] + `
                                      <tr>
                                        <td className="py-1 text-gray-500">Low Frequency Energy (&lt;250Hz)</td>
                                        <td className="py-1 text-right">{(file.report.analysis.lowEnergyPct || 0).toFixed(1)}%</td>
                                        <td className="py-1 text-right text-indigo-300">{(file.report.refinedAnalysis.lowEnergyPct || 0).toFixed(1)}%</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 text-gray-500">Mid Frequency Energy (250Hz-4kHz)</td>
                                        <td className="py-1 text-right">{(file.report.analysis.midEnergyPct || 0).toFixed(1)}%</td>
                                        <td className="py-1 text-right text-indigo-300">{(file.report.refinedAnalysis.midEnergyPct || 0).toFixed(1)}%</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 text-gray-500">High Frequency Energy (&gt;4kHz)</td>
                                        <td className="py-1 text-right">{(file.report.analysis.highEnergyPct || 0).toFixed(1)}%</td>
                                        <td className="py-1 text-right text-indigo-300">{(file.report.refinedAnalysis.highEnergyPct || 0).toFixed(1)}%</td>
                                      </tr>`;
  content = content.replace(regex, replace);
  fs.writeFileSync('src/App.tsx', content);
}
