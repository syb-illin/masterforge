const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldCall = `{ profile: profileName, targetLufs, targetTruePeak }`;
const newCall = `{ 
          profile: profileName, 
          targetLufs: referenceFile ? referenceFile.stats.lufs : targetLufs, 
          targetTruePeak: referenceFile ? (20 * Math.log10(referenceFile.stats.peak || 1e-6)) : targetTruePeak,
          referenceStats: referenceFile?.stats 
        }`;

content = content.replace(oldCall, newCall);

fs.writeFileSync('src/App.tsx', content);
