const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const sidebarStart = `<div className="space-y-6">
            <div className="bg-[#141417] border border-gray-800 rounded-xl p-6">`;

const newUI = `<div className="space-y-6">
            <div className="bg-[#141417] border border-gray-800 rounded-xl p-6">
              <div className="mb-6 pb-6 border-b border-gray-800">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                  Reference Track
                </h3>
                <input 
                  type="file" 
                  ref={refInputRef} 
                  accept="audio/*,.wav,.mp3,.flac" 
                  className="hidden" 
                  onChange={handleReferenceUpload} 
                />
                
                {referenceFile ? (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-200 truncate pr-2">{referenceFile.name}</span>
                      <button onClick={() => setReferenceFile(null)} className="text-gray-500 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                      <div>LUFS: <span className="text-gray-200">{referenceFile.stats.lufs.toFixed(1)}</span></div>
                      <div>Peak: <span className="text-gray-200">{(20 * Math.log10(referenceFile.stats.peak || 1e-6)).toFixed(1)} dB</span></div>
                    </div>
                    <div className="mt-2 text-[10px] text-indigo-400 font-medium">EQ Matching Active</div>
                  </div>
                ) : (
                  <button 
                    onClick={() => refInputRef.current?.click()}
                    disabled={isAnalyzingRef}
                    className="w-full py-3 px-4 border-2 border-dashed border-gray-700 hover:border-indigo-500 hover:bg-indigo-500/5 rounded-lg text-sm text-gray-400 hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
                  >
                    {isAnalyzingRef ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                        Analyzing...
                      </span>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Reference
                      </>
                    )}
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                  Upload a commercial track to match its loudness and tonal balance.
                </p>
              </div>`;

content = content.replace(sidebarStart, newUI);

fs.writeFileSync('src/App.tsx', content);
