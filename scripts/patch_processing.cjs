const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const targetStr = `      processing: {
        gainStaging: \`Offset applied: \${stagingGainDb.toFixed(1)} dB to reach \${targetStagingLufs} LUFS target for optimal headroom.\`,`;
        
const replacementStr = `      processing: {
        profile: targets.profile,
        targetLufs,
        targetTruePeak,
        presetVersion: '1.0.0',
        gainStaging: \`Offset applied: \${stagingGainDb.toFixed(1)} dB to reach \${targetStagingLufs} LUFS target for optimal headroom.\`,`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync('src/lib/audio.ts', content);
