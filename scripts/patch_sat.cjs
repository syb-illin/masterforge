const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

content = content.replace("followed by analog tape saturation for warmth.", "followed by multi-band digital harmonic excitation (Oversampled 4x) for pristine warmth and body.");

fs.writeFileSync('src/lib/audio.ts', content);
