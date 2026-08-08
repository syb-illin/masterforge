const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const wrongHeader = `</p>
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

content = content.replace(wrongHeader, `</p>\n              </div>`);

const correctPlace = `Upload a commercial track to match its loudness and tonal balance.
                </p>
              </div>`;

const newUI = `Upload a commercial track to match its loudness and tonal balance.
                </p>
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

content = content.replace(correctPlace, newUI);

fs.writeFileSync('src/App.tsx', content);
