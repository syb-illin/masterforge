const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regex = /processing: \{\n    profile: string;/g;
const replacement = `refinedAnalysis?: {
    lufs: number;
    peak: number;
    crestFactor: number;
    centroid: number;
    zcr: number;
    flatness: number;
    stereoWidth: number;
    correlation: number;
    rolloff: number;
    lowEnergyPct: number;
    midEnergyPct: number;
    highEnergyPct: number;
    aiArtifactScore: number;
  };
  processing: {
    profile: string;`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/lib/audio.ts', content);
