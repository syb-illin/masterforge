const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// 1. Fix EQ target and scaling
content = content.replace(
  'const targetDb = 20 * Math.log10(targetEnergy);',
  'const targetDb = 20 * Math.log10(targetEnergy) + (freq < 120 ? 4.0 : 0) + (freq > 8000 ? 2.0 : 0); // Modern curve'
);

content = content.replace(
  'eqOffsets[b] = Math.max(-6, Math.min(6, (eqOffsets[b] - monoAvgDb) * 0.5)); // General stereo EQ',
  'eqOffsets[b] = Math.max(-3, Math.min(3, (eqOffsets[b] - monoAvgDb) * 0.3)); // Gentle EQ to preserve character'
);

// 2. Fix the compressor that squashes the bass
content = content.replace(
  'mainComp.threshold.value = -24;',
  'mainComp.threshold.value = -14;'
);
content = content.replace(
  'mainComp.ratio.value = 1.5;',
  'mainComp.ratio.value = 1.2;'
);

// 3. Keep side highpass gentle
content = content.replace(
  'sideHighPass.frequency.value = 150;',
  'sideHighPass.frequency.value = 100;' // Monos below 100Hz instead of 150Hz
);

fs.writeFileSync('src/lib/audio.ts', content);
