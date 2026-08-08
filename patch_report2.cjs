const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

content = content.replace(
  'Pro-Q 4 style exhaustive Hybrid Stereo/Mid-Side 31-band processing with target curve matching in Natural Phase mode (zero pre-ringing)',
  'Pro-Q 4 style exhaustive 31-band processing with target curve matching in Natural Phase mode (zero pre-ringing). Phase-coherent processing'
);

content = content.replace(
  "Adaptive MS Matrix: Centered bass below 150Hz. Widened highs by",
  "Stereo field preserved completely to ensure zero phase cancellation in the low end. Width adjustment:"
);

fs.writeFileSync('src/lib/audio.ts', content);
