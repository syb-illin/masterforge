const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regexReport = /export interface AudioReport \{[\s\S]*?leveling: string;\n  \};\n\}/m;

const newReport = `export interface AudioReport {
  analysis: {
    lufs: number;
    peak: number;
    crestFactor: number;
    centroid: number;
    zcr: number;
    flatness: number;
    stereoWidth: number;
    correlation: number;
    eqOffsets: Float32Array;
    midEqOffsets: Float32Array;
    sideEqOffsets: Float32Array;
    dynEqAmount: Float32Array;
    rolloff: number;
    lowEnergyPct: number;
    midEnergyPct: number;
    highEnergyPct: number;
    lra: number;

    characteristics: string[];
    aiArtifactScore: number;
    sunoArtifactProb: number;
  };
  processing: {
    profile: string;
    targetLufs: number;
    targetTruePeak: number;
    saturation: string;
    leveling: string;
    presetVersion: string;
  };
}`;

content = content.replace(regexReport, newReport);
fs.writeFileSync('src/lib/audio.ts', content);
