const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regex = /const calculateArtifactScore = \(s\) => \{[\s\S]*?return Math.max\(0, Math.min\(10, score\)\);\n    \};/m;

const replace = `    const calculateArtifactScore = (s) => {
      let score = 0;
      // Spectral indicators of AI generation
      
      // 1. Mud / lack of clarity (Centroid)
      if (s.centroid < 1500) {
        score += (1500 - s.centroid) / 150;
      }
      
      // 2. High frequency harshness / Swish (Flatness)
      if (s.flatness > 0.05) {
        score += (s.flatness - 0.05) * 40;
      }
      
      // 3. Squashed dynamics (Crest Factor linear)
      if (s.crestFactor < 6.0) {
        score += (6.0 - s.crestFactor) * 1.5;
      }
      
      // 4. Strange phase correlation
      if (s.correlation < 0.6) {
        score += (0.6 - s.correlation) * 10;
      } else if (s.correlation > 0.85) {
        score += (s.correlation - 0.85) * 10;
      }
      
      // 5. Very low rolloff
      if (s.rolloff < 16000) {
        score += (16000 - s.rolloff) / 1000;
      }
      
      // Baseline minimum to indicate "AI artifact detection algorithm confidence"
      score += 1.5;

      return Math.max(0, Math.min(10, score));
    };`;

content = content.replace(regex, replace);
fs.writeFileSync('src/lib/audio.ts', content);
