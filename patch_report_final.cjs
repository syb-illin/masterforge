const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

content = content.replace(
  'Pro-Q 4 style Natural Phase processing: Zero pre-ringing and strictly phase-coherent EQ. Original low-end body and bass strictly preserved.',
  'Suno Master EQ: Gentle Pultec-style low-end enhancement (+2dB at 60Hz) to bring out the deep bass body, while carving out low-mid mud (-1.5dB at 250Hz).'
);

content = content.replace(
  /audioBuffer.numberOfChannels === 2\s*\?\s*`Stereo phase preserved[^\n]*\n[^\n]*\n\s*:\s*'Mono track, skipped stereo widening.',/,
  `audioBuffer.numberOfChannels === 2 ? 'Modern MS Matrix: Sub-bass forced to mono for maximum punch. Side channel highs gently widened (+2dB shelf) for a wider, immersive sound.' : 'Mono track, skipped stereo widening.',`
);

fs.writeFileSync('src/lib/audio.ts', content);
