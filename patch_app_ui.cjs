const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldTable = `<td className="py-2 text-gray-400">Integrated LUFS</td>
                                        <td className="py-2 text-right">{file.report.analysis.lufs.toFixed(1)}</td>`;

const newTable = `<td className="py-2 text-gray-400">Integrated LUFS</td>
                                        <td className="py-2 text-right">{file.report.analysis.lufs.toFixed(1)}</td>`; // Keep as is but add LRA below

const targetRegex = /<tr>\s*<td className="py-2 text-gray-400">Integrated LUFS<\/td>\s*<td className="py-2 text-right">\{file\.report\.analysis\.lufs\.toFixed\(1\)\}<\/td>\s*<td className="py-2 text-right text-indigo-300 font-medium">\{file\.report\.refinedAnalysis\.lufs\.toFixed\(1\)\}<\/td>\s*<\/tr>/;

content = content.replace(targetRegex, `<tr>
                                        <td className="py-2 text-gray-400">Integrated LUFS</td>
                                        <td className="py-2 text-right">{file.report.analysis.lufs.toFixed(1)}</td>
                                        <td className="py-2 text-right text-indigo-300 font-medium">{file.report.refinedAnalysis?.lufs?.toFixed(1) || (file.report as any)?.analysis?.lufs?.toFixed(1)}</td>
                                      </tr>
                                      <tr>
                                        <td className="py-2 text-gray-400">Loudness Range (LRA)</td>
                                        <td className="py-2 text-right">{file.report.analysis.lra ? file.report.analysis.lra.toFixed(1) + ' LU' : 'N/A'}</td>
                                        <td className="py-2 text-right text-indigo-300 font-medium">-</td>
                                      </tr>`);

const oldDiv = `<div className="flex flex-col"><span className="text-gray-500 text-xs">LUFS</span> <span className="font-medium">{file.report.analysis.lufs.toFixed(1)}</span></div>`;
const newDiv = `<div className="flex flex-col"><span className="text-gray-500 text-xs">LUFS</span> <span className="font-medium">{file.report.analysis.lufs.toFixed(1)}</span></div>
                                    <div className="flex flex-col"><span className="text-gray-500 text-xs">LRA</span> <span className="font-medium">{file.report.analysis.lra ? file.report.analysis.lra.toFixed(1) + ' LU' : 'N/A'}</span></div>`;

content = content.replace(oldDiv, newDiv);

const characteristicsOld = `<div className="flex flex-wrap gap-2 mt-4">
                                  {file.report.analysis.characteristics.map((c, i) => (
                                    <span key={i} className="px-2.5 py-1 text-xs bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">{c}</span>
                                  ))}
                                </div>`;
const characteristicsNew = `<div className="flex flex-wrap gap-2 mt-4">
                                  {file.report.analysis.characteristics.map((c, i) => (
                                    <span key={i} className="px-2.5 py-1 text-xs bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">{c}</span>
                                  ))}
                                  {file.report.analysis.sunoArtifactProb !== undefined && file.report.analysis.sunoArtifactProb > 20 && (
                                    <span className="px-2.5 py-1 text-xs bg-red-500/10 text-red-400 rounded border border-red-500/20">
                                      AI Artifact Prob: {file.report.analysis.sunoArtifactProb}%
                                    </span>
                                  )}
                                </div>`;
                                
content = content.replace(characteristicsOld, characteristicsNew);

fs.writeFileSync('src/App.tsx', content);
