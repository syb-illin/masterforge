const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

content = content.replace(
  /\? \`Adaptive MS Matrix: Centered bass below \$\{bassMonoFreq\}Hz\. \` \+/g,
  "? `Stereo phase preserved (MS bypassed for Natural Phase). ` +"
);

// Also update the saturation description to match the new broadband tape
content = content.replace(
  /Multi-Band Tape: Low Drive.*?prevent harshness\.\'\)/g,
  "Broadband Tape Saturation: Smooth harmonic excitation with Pre/De-Emphasis to preserve highs and phase coherence.'"
);

fs.writeFileSync('src/lib/audio.ts', content);
