const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regex = /const calculateArtifactScore = \(s\) => \{[\s\S]*?return Math.max\(0, Math.min\(10, score\)\);\n    \};/m;

const replace = `    const calculateArtifactScore = (s) => {
      let score = 0;
      // Suno characteristics:
      // 1. Mud / lack of clarity (Centroid < 1000)
      if (s.centroid < 1000) {
        score += (1000 - s.centroid) / 100;
      }
      
      // 2. High frequency harshness / Swish (Flatness > 0.1)
      if (s.flatness > 0.1) {
        score += (s.flatness - 0.1) * 30;
      }
      
      // 3. Squashed dynamics (Crest Factor linear < 4.0)
      if (s.crestFactor < 4.0) {
        score += (4.0 - s.crestFactor) * 2.5;
      }
      
      // 4. Strange phase correlation (often < 0.4 or > 0.8)
      if (s.correlation < 0.4) {
        score += (0.4 - s.correlation) * 15;
      } else if (s.correlation > 0.8) {
        score += (s.correlation - 0.8) * 15;
      }
      
      // 5. Very low rolloff
      if (s.rolloff < 15000) {
        score += (15000 - s.rolloff) / 1000;
      }

      return Math.max(0, Math.min(10, score));
    };`;

content = content.replace(regex, replace);
fs.writeFileSync('src/lib/audio.ts', content);
