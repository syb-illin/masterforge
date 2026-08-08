const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove from Header
content = content.replace(/\{file\.report\.analysis\.aiArtifactScore \!== undefined && \([\s\S]*?<\/span>\n\s* \)\}/m, '');

// 2. Remove from Table
const tableRegex = /\{file\.report\.analysis\.characteristics\.filter[\s\S]*?<\/tr>\n\s*\)\}/m;
content = content.replace(tableRegex, '');

// 3. Replace characteristics mapping at bottom with robust UI
const oldChars = /<div className="flex flex-wrap gap-1\.5 mt-2">[\s\S]*?<\/div>/m;

const newChars = `{file.report.analysis.characteristics.filter(c => c.includes('Signature') || c.includes('Haze') || c.includes('Phase') || c.includes('Codec') || c.includes('Muddy') || c.includes('Flattened')).length > 0 && (
                                  <div className="mt-4 mb-3">
                                    <h5 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                      Neural Codec Detection (KB Match)
                                    </h5>
                                    <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-lg">
                                      <div className="text-red-400 font-bold text-sm mb-2 border-b border-red-500/10 pb-2">
                                        Artifact Probability: {(file.report.analysis.aiArtifactScore * 10).toFixed(0)}%
                                      </div>
                                      <ul className="text-sm text-gray-300 space-y-1.5">
                                        {file.report.analysis.characteristics.filter(c => c.includes('Signature') || c.includes('Haze') || c.includes('Phase') || c.includes('Codec') || c.includes('Muddy') || c.includes('Flattened')).map((c, i) => (
                                          <li key={i} className="flex items-start gap-2">
                                            <span className="text-red-400 mt-0.5">•</span>
                                            <span>{c}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                )}
                                
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {file.report.analysis.characteristics.filter(c => !c.includes('Signature') && !c.includes('Haze') && !c.includes('Phase') && !c.includes('Codec') && !c.includes('Muddy') && !c.includes('Flattened') && !c.includes('balanced')).map((c, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full">{c}</span>
                                  ))}
                                  {file.report.analysis.characteristics.filter(c => c.includes('balanced')).map((c, i) => (
                                    <span key={i} className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full">{c}</span>
                                  ))}
                                </div>`;

content = content.replace(oldChars, newChars);

fs.writeFileSync('src/App.tsx', content);
