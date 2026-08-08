const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regex = /const calculateArtifactScore = \(s\) => \{[\s\S]*?return Math.max\(0, Math.min\(10, score\)\);\n    \};/m;

const replace = `    const calculateArtifactScore = (s) => {
      let score = 0;
      // 1. Phase issues (Suno often has extreme phase issues < 0.3)
      if (s.correlation < 0.3) {
        score += (0.3 - s.correlation) * 10;
      }
      // 2. Mud (centroid < 500)
      if (s.centroid < 500) {
        score += (500 - s.centroid) / 100;
      }
      // 3. Squashed Dynamics (Crest Factor < 3.5 linear)
      if (s.crestFactor < 3.5) {
        score += (3.5 - s.crestFactor) * 2;
      }
      // 4. Overly wide (stereo width > 0.8 is unnatural)
      if (s.stereoWidth > 0.8) {
        score += (s.stereoWidth - 0.8) * 10;
      }
      // 5. Artificial harshness / Swish (high flatness)
      if (s.flatness > 0.25) {
        score += (s.flatness - 0.25) * 10;
      }

      return Math.max(0, Math.min(10, score));
    };`;

content = content.replace(regex, replace);

// Fix limiter threshold
content = content.replace(
  'safetyLimiter.threshold.value = targetTruePeak - 1.0;',
  'safetyLimiter.threshold.value = targetTruePeak - 0.1;'
);

// We also want to push the gain a little bit harder into the limiter so it actually hits -1.0 dB. 
// If targetLufs is -14, we can add a bit of drive if we want it to hit the limiter, or we can just normalize the final buffer.
// Actually, let's add a final normalization pass to EXACTLY targetTruePeak if we want.
// No, the user says "tjs pas de -1db", they might mean the final peak isn't exactly -1dB.

fs.writeFileSync('src/lib/audio.ts', content);
