const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const searchStr = `<div className="grid grid-cols-2 gap-2 text-gray-300 mb-2">
                                  <div><span className="text-gray-500">LUFS:</span> {file.report.analysis.lufs.toFixed(1)}</div>
                                  <div><span className="text-gray-500">Peak:</span> {file.report.analysis.peak.toFixed(2)}</div>
                                  <div><span className="text-gray-500">Crest Factor:</span> {file.report.analysis.crestFactor.toFixed(1)}</div>
                                  <div><span className="text-gray-500">Centroid:</span> {Math.round(file.report.analysis.centroid)} Hz</div>
                                </div>`;

const replaceStr = `
                                {file.report.refinedAnalysis ? (
                                  <table className="w-full text-left text-gray-300 mb-2 border-collapse">
                                    <thead>
                                      <tr className="border-b border-gray-700 text-gray-500 text-xs uppercase">
                                        <th className="pb-1 font-normal">Metric</th>
                                        <th className="pb-1 font-normal text-right">Raw (Suno)</th>
                                        <th className="pb-1 font-normal text-right text-indigo-400">Refined</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
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
                                    </tbody>
                                  </table>
                                ) : (
                                  <div className="grid grid-cols-2 gap-2 text-gray-300 mb-2">
                                    <div><span className="text-gray-500">LUFS:</span> {file.report.analysis.lufs.toFixed(1)}</div>
                                    <div><span className="text-gray-500">Peak:</span> {file.report.analysis.peak.toFixed(2)}</div>
                                    <div><span className="text-gray-500">Crest Factor:</span> {file.report.analysis.crestFactor.toFixed(1)}</div>
                                    <div><span className="text-gray-500">Centroid:</span> {Math.round(file.report.analysis.centroid)} Hz</div>
                                  </div>
                                )}`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync('src/App.tsx', content);
