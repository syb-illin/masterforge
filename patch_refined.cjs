const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const interfaceOld = `export interface AudioReport {
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
  processing: {`;

const interfaceNew = `export interface AudioReport {
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
  refinedAnalysis?: {
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
  processing: {`;

content = content.replace(interfaceOld, interfaceNew);
fs.writeFileSync('src/lib/audio.ts', content);
