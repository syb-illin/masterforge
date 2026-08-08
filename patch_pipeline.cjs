const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<h3 className="font-semibold text-sm mb-4">Pipeline Preview<\/h3>[\s\S]*?<\/div>\n\s*<\/div>\n\s*<\/div>/m;
const replace = `<h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                DSP Signal Chain
              </h3>
              <div className="space-y-2">
                {[
                  { id: 'step-1', name: 'Input Stage & Analysis', module: 'Meyda / K-Weighted LUFS' },
                  { id: 'step-2', name: 'Dynamic Equalization', module: '31-Band Phase-Linear Biquads' },
                  { id: 'step-3', name: 'Harmonic Exciter', module: 'Multi-Band Tape Saturation' },
                  { id: 'step-4', name: 'Stereo Field', module: 'Mid/Side Matrix' },
                  { id: 'step-5', name: 'Maximizer', module: 'True Peak Limiter' }
                ].map((step, i) => {
                  const activeFile = files.find(f => f.status === 'processing');
                  const errorFile = files.find(f => f.status === 'error');
                  const doneFile = files.find(f => f.status === 'done');
                  
                  let state = 'idle';
                  if (activeFile) {
                    const prog = activeFile.progress;
                    const thresholds = [0, 20, 50, 70, 90, 100];
                    if (prog >= thresholds[i] && prog < thresholds[i+1]) state = 'processing';
                    else if (prog >= thresholds[i+1]) state = 'done';
                  } else if (errorFile) {
                    state = 'error';
                  } else if (doneFile && files.every(f => f.status !== 'processing')) {
                    state = 'done';
                  }

                  return (
                    <div key={step.id} className={\`group relative flex items-center justify-between p-3 rounded border transition-all duration-300 \${
                      state === 'processing' ? 'bg-indigo-500/10 border-indigo-500/30' :
                      state === 'done' ? 'bg-green-500/5 border-green-500/20' :
                      'bg-gray-900/50 border-gray-800'
                    }\`}>
                      <div className="flex items-center gap-3">
                        <div className={\`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] \${
                          state === 'processing' ? 'text-indigo-400 bg-indigo-400 animate-pulse' :
                          state === 'done' ? 'text-green-400 bg-green-400' :
                          'text-gray-700 bg-gray-700 shadow-none'
                        }\`}></div>
                        <span className={\`text-xs font-semibold uppercase tracking-wider \${
                          state === 'processing' ? 'text-indigo-300' :
                          state === 'done' ? 'text-green-300' :
                          'text-gray-400'
                        }\`}>{step.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-600 bg-black/30 px-2 py-0.5 rounded">{step.module}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>`;
content = content.replace(regex, replace);
fs.writeFileSync('src/App.tsx', content);
