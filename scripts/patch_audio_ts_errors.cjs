const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// 1. Fix targets signature
content = content.replace("targets: { profile: string, targetLufs?: number, targetTruePeak?: number, referenceStats?: any, exportSampleRate?: number, exportBitDepth?: number }", 
                          "targets: { profile: string, targetLufs?: number, targetTruePeak?: number, referenceStats?: any, exportSampleRate?: number, exportBitDepth?: number, genre?: string }");

// 2. Fix calculateLUFS signature
content = content.replace("async function calculateLUFS(buffer: AudioBuffer): Promise<number> {", 
                          "async function calculateLUFS(buffer: AudioBuffer): Promise<{lufs: number, lra: number}> {");

// 3. Fix AudioReport interface processing
const oldProcessing = `  processing: {
    profile: string;
    targetLufs: number;
    targetTruePeak: number;
    saturation: string;
    leveling: string;
    presetVersion: string;
  };`;
const newProcessing = `  processing: {
    profile: string;
    targetLufs: number;
    targetTruePeak: number;
    saturation: string;
    leveling: string;
    presetVersion: string;
    gainStaging?: string;
    eq?: string;
    stereo?: string;
  };`;
content = content.replace(oldProcessing, newProcessing);

// 4. Fix report assignment in processAudio
// Right now it's around line 566:
// const report: AudioReport = { ... }
// We need to make sure lra and sunoArtifactProb are there.
// If it's returning finalStats, finalStats already has lra and sunoArtifactProb.
// Let's replace the whole report object construction if possible.
