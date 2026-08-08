const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

content = content.replace(
  'Pro-Q 4 style exhaustive 31-band processing with target curve matching in Natural Phase mode (zero pre-ringing). Phase-coherent processing. Dynamic EQ applied to tame transient spikes and resonances based on variance analysis.',
  'Pro-Q 4 style Natural Phase processing: Zero pre-ringing and strictly phase-coherent EQ. Original low-end body and bass strictly preserved.'
);

content = content.replace(
  /Broadband Tape Saturation: Smooth harmonic excitation \(drive x\$\{tapeDrive\.toFixed\(1\)\}\) with Pre\/De-Emphasis to preserve highs and phase coherence\./g,
  'Transparent Harmonic Exciter: Extremely gentle analog warmth applied without phase-shifting crossovers, preserving full low-end impact.'
);

fs.writeFileSync('src/lib/audio.ts', content);
