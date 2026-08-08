const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const stateHooks = `  const [expandedEq, setExpandedEq] = useState<Record<string, boolean>>({});`;
const newStateHooks = `  const [expandedEq, setExpandedEq] = useState<Record<string, boolean>>({});
  const [exportSampleRate, setExportSampleRate] = useState(48000);
  const [exportBitDepth, setExportBitDepth] = useState(24);`;

content = content.replace(stateHooks, newStateHooks);

const targetCall = `targetTruePeak: referenceFile ? (20 * Math.log10(referenceFile.stats.peak || 1e-6)) : targetTruePeak,
          referenceStats: referenceFile?.stats 
        }`;
const newTargetCall = `targetTruePeak: referenceFile ? (20 * Math.log10(referenceFile.stats.peak || 1e-6)) : targetTruePeak,
          referenceStats: referenceFile?.stats,
          exportSampleRate,
          exportBitDepth
        }`;

content = content.replace(targetCall, newTargetCall);

const uiReferenceEnd = `</p>
              </div>`;

const newUI = `</p>
              </div>
              
              <div className="mb-6 pb-6 border-b border-gray-800">
                <h3 className="font-semibold mb-4 text-sm text-gray-400">Export Format</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Sample Rate</label>
                    <select 
                      value={exportSampleRate}
                      onChange={e => setExportSampleRate(Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-300"
                    >
                      <option value={44100}>44.1 kHz</option>
                      <option value={48000}>48 kHz</option>
                      <option value={88200}>88.2 kHz</option>
                      <option value={96000}>96 kHz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Bit Depth</label>
                    <select 
                      value={exportBitDepth}
                      onChange={e => setExportBitDepth(Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 text-sm text-gray-300"
                    >
                      <option value={16}>16-bit PCM</option>
                      <option value={24}>24-bit PCM</option>
                      <option value={32}>32-bit Float</option>
                    </select>
                  </div>
                </div>
              </div>`;

content = content.replace(uiReferenceEnd, newUI);

fs.writeFileSync('src/App.tsx', content);
