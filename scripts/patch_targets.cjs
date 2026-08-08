const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const profileState = /const \[selectedProfile, setSelectedProfile\] = useState\(PROFILES\[0\]\.id\);/m;
content = content.replace(profileState, `const [selectedProfile, setSelectedProfile] = useState(PROFILES[0].id);\n  const [targetLufs, setTargetLufs] = useState(-14);\n  const [targetTruePeak, setTargetTruePeak] = useState(-1.0);`);

// When profile is changed, update the targets
const onChangeRegex = /onChange=\{\(e\) => setSelectedProfile\(e\.target\.value\)\}/gm;
content = content.replace(onChangeRegex, `onChange={(e) => {
                        const val = e.target.value;
                        setSelectedProfile(val);
                        if (val === 'youtube' || val === 'music') { setTargetLufs(-14); setTargetTruePeak(-1.0); }
                        else if (val === 'tiktok') { setTargetLufs(-11); setTargetTruePeak(-2.0); }
                      }}`);

const callRegex = /const \{ blob, report \} = await processAudio\([\s\S]*?\n\s*profile,\n\s*\(step, progress\)/m;
content = content.replace(callRegex, `const { blob, report } = await processAudio(
        fileObj.file, 
        { profile, targetLufs, targetTruePeak },
        (step, progress)`);

const sidebarRegex = /<h3 className="font-semibold mb-4 flex items-center gap-2">\n\s*<Settings className="w-4 h-4 text-gray-400" \/>\n\s*Destination Profile\n\s*<\/h3>\n\s*<div className="space-y-3">[\s\S]*?<\/div>/m;
const sidebarReplace = `<h3 className="font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-400" />
                Mastering Targets
              </h3>
              
              <div className="space-y-3 mb-6">
                {PROFILES.map(profile => (
                  <label 
                    key={profile.id}
                    className={\`
                      block relative p-4 rounded-lg border cursor-pointer transition-all
                      \${selectedProfile === profile.id 
                        ? 'border-indigo-500 bg-indigo-500/5' 
                        : 'border-gray-800 bg-gray-900/30 hover:border-gray-700'
                      }
                    \`}
                  >
                    <input 
                      type="radio" 
                      name="profile" 
                      value={profile.id}
                      checked={selectedProfile === profile.id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedProfile(val);
                        if (val === 'youtube' || val === 'music') { setTargetLufs(-14); setTargetTruePeak(-1.0); }
                        else if (val === 'tiktok') { setTargetLufs(-11); setTargetTruePeak(-2.0); }
                      }}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{profile.name}</span>
                      {selectedProfile === profile.id && (
                        <CheckCircle className="w-4 h-4 text-indigo-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{profile.desc}</p>
                  </label>
                ))}
              </div>
              
              <div className="space-y-5 pt-4 border-t border-gray-800">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Target LUFS</span>
                    <span className="font-mono text-gray-200">{targetLufs.toFixed(1)}</span>
                  </div>
                  <input type="range" min="-24" max="-6" step="0.5" value={targetLufs} onChange={(e) => { setTargetLufs(parseFloat(e.target.value)); setSelectedProfile('custom'); }} className="w-full accent-indigo-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">True Peak Limit</span>
                    <span className="font-mono text-gray-200">{targetTruePeak.toFixed(1)} dB</span>
                  </div>
                  <input type="range" min="-3" max="0" step="0.1" value={targetTruePeak} onChange={(e) => { setTargetTruePeak(parseFloat(e.target.value)); setSelectedProfile('custom'); }} className="w-full accent-indigo-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>`;

content = content.replace(sidebarRegex, sidebarReplace);

const profileArrRegex = /const PROFILES = \[[\s\S]*?\];/m;
content = content.replace(profileArrRegex, `const PROFILES = [
  { id: 'music', name: 'Music Platforms', desc: 'Target -14 LUFS, True Peak -1.0dB (Spotify, Apple Music)' },
  { id: 'youtube', name: 'YouTube', desc: 'Target -14 LUFS, optimized for dialogue & music balance' },
  { id: 'tiktok', name: 'TikTok', desc: 'Aggressive leveling, mono compatibility, punchy presence' },
  { id: 'custom', name: 'Custom Targets', desc: 'Manually defined LUFS and True Peak limits' }
];`);

fs.writeFileSync('src/App.tsx', content);
