const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const search = `    let aiArtifactScore = 0;
    if (audioBuffer.numberOfChannels === 2 && stats.correlation < 0.5) {
      aiArtifactScore += (0.5 - stats.correlation) * 10;
    }
    if (stats.zcr > 100 && stats.centroid < 1500) {
      aiArtifactScore += 2;
    }
    if (stats.flatness > 0.1) aiArtifactScore += 1;
    if (stats.crestFactor < 6) {
      aiArtifactScore += (6 - stats.crestFactor) * 1.5;
    } else if (stats.crestFactor > 18) {
      aiArtifactScore += 1;
    }
    aiArtifactScore = Math.max(0, Math.min(10, aiArtifactScore));
    
    let refinedAiArtifactScore = 0;
    if (audioBuffer.numberOfChannels === 2 && refinedStats.correlation < 0.5) {
      refinedAiArtifactScore += (0.5 - refinedStats.correlation) * 10;
    }
    if (refinedStats.zcr > 100 && refinedStats.centroid < 1500) {
      refinedAiArtifactScore += 2;
    }
    if (refinedStats.flatness > 0.1) refinedAiArtifactScore += 1;
    if (refinedStats.crestFactor < 6) {
      refinedAiArtifactScore += (6 - refinedStats.crestFactor) * 1.5;
    } else if (refinedStats.crestFactor > 18) {
      refinedAiArtifactScore += 1;
    }
    refinedAiArtifactScore = Math.max(0, Math.min(10, refinedAiArtifactScore));`;

const replace = `    const calculateArtifactScore = (s) => {
      let score = 0;
      // 1. Phase issues (Suno often has correlation < 0.8)
      if (audioBuffer.numberOfChannels === 2 && s.correlation < 0.8) {
        score += (0.8 - s.correlation) * 10;
      }
      // 2. Mud (centroid < 800)
      if (s.centroid < 800) {
        score += (800 - s.centroid) / 100;
      }
      // 3. Harshness / Swish (high flatness, noise-like)
      if (s.flatness > 0.05) {
        score += (s.flatness - 0.05) * 20;
      }
      return Math.max(0, Math.min(10, score));
    };

    let aiArtifactScore = calculateArtifactScore(stats);
    let refinedAiArtifactScore = calculateArtifactScore(refinedStats);`;

content = content.replace(search, replace);
fs.writeFileSync('src/lib/audio.ts', content);
