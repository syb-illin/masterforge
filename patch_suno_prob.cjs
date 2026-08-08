const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const analyzeEndStr = `  return { rms, lufs, peak, crestFactor, zcr, centroid, flatness, rolloff, stereoWidth, correlation, eqOffsets, midEqOffsets, sideEqOffsets, dynEqAmount, lowEnergyPct, midEnergyPct, highEnergyPct, lra };`;

const newAnalyzeEndStr = `  let sunoArtifactProb = 0;
  if (rolloff < 16500) sunoArtifactProb += 30;
  if (rolloff < 15500) sunoArtifactProb += 20;
  if (highEnergyPct < 0.1) sunoArtifactProb += 20;
  if (flatness > 0.15) sunoArtifactProb += 30;
  sunoArtifactProb = Math.min(100, sunoArtifactProb);

  return { rms, lufs, peak, crestFactor, zcr, centroid, flatness, rolloff, stereoWidth, correlation, eqOffsets, midEqOffsets, sideEqOffsets, dynEqAmount, lowEnergyPct, midEnergyPct, highEnergyPct, lra, sunoArtifactProb };`;

content = content.replace(analyzeEndStr, newAnalyzeEndStr);
fs.writeFileSync('src/lib/audio.ts', content);
