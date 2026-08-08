const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const oldSig = /export async function processAudio\(\n\s*file: File,\n\s*profile: string,\n\s*onProgress: \(step: string, progress: number\) => void,\n\s*options\?: \{ warmth\?: number; brightness\?: number; intensity\?: number \}\n\): Promise<\{ blob: Blob; report: AudioReport \}> \{/m;

const newSig = `export async function processAudio(
  file: File,
  targets: { profile: string, targetLufs?: number, targetTruePeak?: number },
  onProgress: (step: string, progress: number) => void,
  options?: { warmth?: number; brightness?: number; intensity?: number }
): Promise<{ blob: Blob; report: AudioReport }> {`;

content = content.replace(oldSig, newSig);

const lufsRegex = /let targetLufs = -14;\n\s*let targetTruePeak = -1\.0;\n\s*if \(profile === 'youtube'\) \{\n\s*targetLufs = -14;\n\s*targetTruePeak = -1\.0;\n\s*\} else if \(profile === 'tiktok'\) \{\n\s*targetLufs = -11;\n\s*targetTruePeak = -2\.0;\s*\/\/\s*Extra headroom for transcoders\n\s*\}/m;

const lufsReplace = `let targetLufs = targets.targetLufs !== undefined ? targets.targetLufs : -14;
  let targetTruePeak = targets.targetTruePeak !== undefined ? targets.targetTruePeak : -1.0;`;

content = content.replace(lufsRegex, lufsReplace);

fs.writeFileSync('src/lib/audio.ts', content);
