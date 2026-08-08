const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<td className="py-1 text-gray-500">AI Artifacts<\/td>\s*<td className="py-1 text-right text-red-400">\{file\.report\.analysis\.aiArtifactScore\.toFixed\(1\)}\/10<\/td>\s*<td className="py-1 text-right text-indigo-300">\{file\.report\.refinedAnalysis\.aiArtifactScore\.toFixed\(1\)}\/10<\/td>\s*<\/tr>/m;

const replace = `<td className="py-1 text-gray-500">AI Artifact Probability</td>
                                        <td className="py-1 text-right text-red-400">{(file.report.analysis.aiArtifactScore * 10).toFixed(0)}%</td>
                                        <td className="py-1 text-right text-indigo-300">{(file.report.refinedAnalysis.aiArtifactScore * 10).toFixed(0)}%</td>
                                      </tr>
                                      {file.report.analysis.characteristics.filter(c => c.includes('Signature') || c.includes('Haze') || c.includes('Phase') || c.includes('Codec')).length > 0 && (
                                      <tr>
                                        <td colSpan={3} className="pt-3 pb-1">
                                          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 mt-2">Neural Codec Detection (KB Match)</div>
                                          <ul className="text-sm text-gray-400 space-y-1 bg-red-500/5 border border-red-500/10 p-3 rounded-lg">
                                            {file.report.analysis.characteristics.filter(c => c.includes('Signature') || c.includes('Haze') || c.includes('Phase') || c.includes('Codec') || c.includes('Muddy') || c.includes('Flattened')).map((c, i) => (
                                              <li key={i} className="flex items-start gap-2">
                                                <span className="text-red-400 mt-0.5">•</span>
                                                <span>{c}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </td>
                                      </tr>
                                      )}`;

content = content.replace(regex, replace);
fs.writeFileSync('src/App.tsx', content);
