const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const searchTable = `<tbody className="divide-y divide-gray-800/50">
                                      <tr>
                                        <td className="py-1 text-gray-500">LUFS</td>
                                        <td className="py-1 text-right">{file.report.analysis.lufs.toFixed(1)}</td>
                                        <td className="py-1 text-right text-indigo-300">{file.report.refinedAnalysis.lufs.toFixed(1)}</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 text-gray-500">True Peak</td>
                                        <td className="py-1 text-right">{file.report.analysis.peak.toFixed(2)}</td>
                                        <td className="py-1 text-right text-indigo-300">{file.report.refinedAnalysis.peak.toFixed(2)}</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 text-gray-500">Crest Factor</td>
                                        <td className="py-1 text-right">{file.report.analysis.crestFactor.toFixed(1)}</td>
                                        <td className="py-1 text-right text-indigo-300">{file.report.refinedAnalysis.crestFactor.toFixed(1)}</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 text-gray-500">Centroid (Mud/Bright)</td>
                                        <td className="py-1 text-right">{Math.round(file.report.analysis.centroid)} Hz</td>
                                        <td className="py-1 text-right text-indigo-300">{Math.round(file.report.refinedAnalysis.centroid)} Hz</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 text-gray-500">Stereo Width</td>
                                        <td className="py-1 text-right">{file.report.analysis.stereoWidth.toFixed(2)}</td>
                                        <td className="py-1 text-right text-indigo-300">{file.report.refinedAnalysis.stereoWidth.toFixed(2)}</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 text-gray-500">AI Artifacts</td>
                                        <td className="py-1 text-right text-red-400">{file.report.analysis.aiArtifactScore.toFixed(1)}/10</td>
                                        <td className="py-1 text-right text-indigo-300">{file.report.refinedAnalysis.aiArtifactScore.toFixed(1)}/10</td>
                                      </tr>
                                    </tbody>`;

const replaceTable = `<tbody className="divide-y divide-gray-800/50">
                                      <tr>
                                        <td className="py-1 text-gray-500">LUFS</td>
                                        <td className="py-1 text-right">{file.report.analysis.lufs.toFixed(1)} LUFS</td>
                                        <td className="py-1 text-right text-indigo-300">{file.report.refinedAnalysis.lufs.toFixed(1)} LUFS</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 text-gray-500">True Peak</td>
                                        <td className="py-1 text-right">{(20 * Math.log10(file.report.analysis.peak || 1e-6)).toFixed(2)} dB</td>
                                        <td className="py-1 text-right text-indigo-300">{(20 * Math.log10(file.report.refinedAnalysis.peak || 1e-6)).toFixed(2)} dB</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 text-gray-500">Crest Factor</td>
                                        <td className="py-1 text-right">{file.report.analysis.crestFactor.toFixed(1)} dB</td>
                                        <td className="py-1 text-right text-indigo-300">{file.report.refinedAnalysis.crestFactor.toFixed(1)} dB</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 text-gray-500">Spectral Centroid</td>
                                        <td className="py-1 text-right">{Math.round(file.report.analysis.centroid)} Hz</td>
                                        <td className="py-1 text-right text-indigo-300">{Math.round(file.report.refinedAnalysis.centroid)} Hz</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 text-gray-500">Zero Crossing Rate</td>
                                        <td className="py-1 text-right">{Math.round(file.report.analysis.zcr)}</td>
                                        <td className="py-1 text-right text-indigo-300">{Math.round(file.report.refinedAnalysis.zcr)}</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 text-gray-500">Spectral Flatness</td>
                                        <td className="py-1 text-right">{file.report.analysis.flatness.toFixed(3)}</td>
                                        <td className="py-1 text-right text-indigo-300">{file.report.refinedAnalysis.flatness.toFixed(3)}</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 text-gray-500">Phase Correlation</td>
                                        <td className="py-1 text-right">{file.report.analysis.correlation.toFixed(2)}</td>
                                        <td className="py-1 text-right text-indigo-300">{file.report.refinedAnalysis.correlation.toFixed(2)}</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 text-gray-500">Stereo Width</td>
                                        <td className="py-1 text-right">{file.report.analysis.stereoWidth.toFixed(2)}</td>
                                        <td className="py-1 text-right text-indigo-300">{file.report.refinedAnalysis.stereoWidth.toFixed(2)}</td>
                                      </tr>
                                      <tr>
                                        <td className="py-1 text-gray-500">AI Artifacts</td>
                                        <td className="py-1 text-right text-red-400">{file.report.analysis.aiArtifactScore.toFixed(1)}/10</td>
                                        <td className="py-1 text-right text-indigo-300">{file.report.refinedAnalysis.aiArtifactScore.toFixed(1)}/10</td>
                                      </tr>
                                    </tbody>`;

content = content.replace(searchTable, replaceTable);
fs.writeFileSync('src/App.tsx', content);
