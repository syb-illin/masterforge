const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

content = content.replace(
  'sideGain.gain.value = 1.2; // Boost side signal to increase stereo width',
  'sideGain.gain.value = 0.55; // Subtle side boost (0.5 is neutral)'
);

content = content.replace(
  "sideHighShelf.gain.value = 3.0; // Fixed gentle widening for that modern sheen",
  "sideHighShelf.gain.value = 1.5; // Fixed gentle widening for that modern sheen"
);

fs.writeFileSync('src/lib/audio.ts', content);
