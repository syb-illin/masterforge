const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// Fix genre
content = content.replace("targets: { profile: string, targetLufs?: number, targetTruePeak?: number, referenceStats?: any, exportSampleRate?: number, exportBitDepth?: number }",
  "targets: { profile: string, targetLufs?: number, targetTruePeak?: number, referenceStats?: any, exportSampleRate?: number, exportBitDepth?: number, genre?: string }");
  
// If it didn't replace, try a regex
content = content.replace(/targets: \{ profile: string, targetLufs\?: number, targetTruePeak\?: number, referenceStats\?: any, exportSampleRate\?: number, exportBitDepth\?: number \}/,
  "targets: { profile: string, targetLufs?: number, targetTruePeak?: number, referenceStats?: any, exportSampleRate?: number, exportBitDepth?: number, genre?: string }");

// Fix processing types
const oldInterface = `  processing: {
    profile: string;
    targetLufs: number;
    targetTruePeak: number;
    saturation: string;
    leveling: string;
    presetVersion: string;
  };`;
const newInterface = `  processing: {
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
content = content.replace(oldInterface, newInterface);

fs.writeFileSync('src/lib/audio.ts', content);
