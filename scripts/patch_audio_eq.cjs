const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const oldWarmth = `  const userWarmth = options?.warmth || 0;
  const userBrightness = options?.brightness || 0;`;

const newWarmth = `  let userWarmth = options?.warmth || 0;
  let userBrightness = options?.brightness || 0;
  
  if (targets.referenceStats) {
    const ref = targets.referenceStats;
    // Calculate difference in energy ratios
    const lowDiff = ref.lowEnergyPct - stats.lowEnergyPct;
    const highDiff = ref.highEnergyPct - stats.highEnergyPct;
    
    // Scale differences to dB (-6 to +6 approx)
    const warmthMatch = Math.max(-6, Math.min(6, lowDiff * 0.2));
    const brightMatch = Math.max(-6, Math.min(6, highDiff * 0.2));
    
    userWarmth += warmthMatch;
    userBrightness += brightMatch;
    log.debug(\`Applied Reference EQ Matching: Lows \${warmthMatch.toFixed(1)}dB, Highs \${brightMatch.toFixed(1)}dB\`);
  }`;

content = content.replace(oldWarmth, newWarmth);

fs.writeFileSync('src/lib/audio.ts', content);
