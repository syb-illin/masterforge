const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

content = content.replace(
  'let tapeDrive = Math.max(1.0, Math.min(8.0, stats.crestFactor * 0.6));',
  'let tapeDrive = Math.max(1.1, Math.min(2.5, stats.crestFactor * 0.2)); // Gentle mastering saturation'
);

// Also remove the "isMuddy" aggressive low cut in tape to preserve bass body
content = content.replace(
  'lowPreCut.gain.value = isMuddy ? -2 : 0;',
  'lowPreCut.gain.value = 0; // Keep bass intact'
);
content = content.replace(
  'lowPostBoost.gain.value = isMuddy ? 2 : 0;',
  'lowPostBoost.gain.value = 0; // Keep bass intact'
);


fs.writeFileSync('src/lib/audio.ts', content);
