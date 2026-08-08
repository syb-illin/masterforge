const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regex = /const calculateArtifactScore = \(s\) => \{[\s\S]*?return Math.max\(0, Math.min\(10, score\)\);\n    \};/m;

const replace = `    const calculateArtifactScore = (s) => {
      let score = 0;
      // 1. Phase issues (Suno often has extreme phase issues < 0.3)
      if (s.correlation < 0.3) {
        score += (0.3 - s.correlation) * 10;
      }
      // 2. Mud (centroid < 1000) - Suno is notoriously muddy
      if (s.centroid < 1000) {
        score += (1000 - s.centroid) / 100;
      }
      // 3. Squashed Dynamics (Crest Factor < 10 dB)
      // Assuming crest factor is in dB now? Wait, stats.crestFactor is linear in analyzeAudio!
      // In App.tsx we convert it to dB for display, but in audio.ts it is linear.
      // Crest factor linear: peak / rms. If linear crest factor < 3.16 (10dB)
      if (s.crestFactor < 3.5) {
        score += (3.5 - s.crestFactor) * 2;
      }
      
      // 4. Overly wide (stereo width > 0.8 is unnatural)
      if (s.stereoWidth > 0.8) {
        score += (s.stereoWidth - 0.8) * 10;
      }
      
      // 5. Artificial harshness / Swish (high flatness)
      if (s.flatness > 0.2) {
        score += (s.flatness - 0.2) * 10;
      }

      return Math.max(0, Math.min(10, score));
    };`;

content = content.replace(regex, replace);
fs.writeFileSync('src/lib/audio.ts', content);
