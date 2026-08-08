const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const reportHeader = `  <div className="p-4 bg-[#141417] border-t border-gray-800">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                  <FileAudio className="w-4 h-4 text-indigo-400" />
                                  Mastering Report
                                </h4>`;

const newReportHeader = `  <div className="p-4 bg-[#141417] border-t border-gray-800">
                                <h4 className="font-medium mb-3 flex items-center gap-2">
                                  <FileAudio className="w-4 h-4 text-indigo-400" />
                                  Mastering Report & A/B Test
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                                    <div className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Before (Original)</div>
                                    <audio controls src={URL.createObjectURL(fileObj.file)} className="w-full h-8" />
                                  </div>
                                  <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
                                    <div className="text-xs text-indigo-400 mb-2 font-medium uppercase tracking-wider flex items-center gap-2">
                                      After (Mastered)
                                      <span className="bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded text-[10px]">Loudness Matched</span>
                                    </div>
                                    {fileObj.blob && <audio controls src={URL.createObjectURL(fileObj.blob)} className="w-full h-8" />}
                                  </div>
                                </div>`;

content = content.replace(reportHeader, newReportHeader);

fs.writeFileSync('src/App.tsx', content);
