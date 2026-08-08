const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');
content = content.replace(
  '// Post-process array to guarantee exact peak ceiling\n  const exactThreshGain = dbToGain(targetTruePeak);',
  '// Post-process array to guarantee exact peak ceiling\n  // exactThreshGain is already declared'
);
fs.writeFileSync('src/lib/audio.ts', content);
