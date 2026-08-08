const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const oldReport = `        leveling: \`Transparent Multi-Stage True Peak Limiting (8x Oversampled, Soft-Knee Transient Shaping + ISP Brickwall) targeting \${targetLufs} LUFS. True Peak ceiling set at \${targetTruePeak.toFixed(1)} dBTP.\`,`;
const newReport = `        leveling: \`SSL-Style VCA Bus Compressor applied for gentle mix glue. Transparent Multi-Stage True Peak Limiting (8x Oversampled, Soft-Knee Transient Shaping + ISP Brickwall) targeting \${targetLufs} LUFS. True Peak ceiling set at \${targetTruePeak.toFixed(1)} dBTP. TPDF Dither applied on export.\`,`;
content = content.replace(oldReport, newReport);

const oldStaging = `gainStaging: \`Offset applied: \${stagingGainDb.toFixed(1)} dB to reach \${targetStagingLufs} LUFS target for optimal headroom.\`,`;
const newStaging = `gainStaging: \`DC Offset Removal (15Hz High-pass). Offset applied: \${stagingGainDb.toFixed(1)} dB to reach \${targetStagingLufs} LUFS target for optimal headroom.\`,`;
content = content.replace(oldStaging, newStaging);

fs.writeFileSync('src/lib/audio.ts', content);
