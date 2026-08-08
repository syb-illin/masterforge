const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const search = `  processing: {
    gainStaging: string;`;

const replace = `  refinedAnalysis?: {
    lufs: number;
    peak: number;
    crestFactor: number;
    centroid: number;
    zcr: number;
    flatness: number;
    stereoWidth: number;
    correlation: number;
    aiArtifactScore: number;
  };
  processing: {
    gainStaging: string;`;

content = content.replace(search, replace);
fs.writeFileSync('src/lib/audio.ts', content);
