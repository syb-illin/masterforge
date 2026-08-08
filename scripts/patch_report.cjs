const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const search = 'leveling: `Applied ${exactMakeupGainDb.toFixed(1)} dB makeup gain targeting ${targetLufs} LUFS. True Peak Limiter applied at ${targetTruePeak.toFixed(1)} dBTP ceiling.`';
const replace = 'leveling: `Exact 2-pass leveling applied to target ${targetLufs} LUFS. True Peak Limiter ceiling set at ${targetTruePeak.toFixed(1)} dBTP.`';

content = content.replace(search, replace);
fs.writeFileSync('src/lib/audio.ts', content);
