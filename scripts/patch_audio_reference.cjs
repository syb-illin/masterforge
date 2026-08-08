const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const analyzeFn = `export async function getReferenceTargets(file: File) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const buffer = await ctx.decodeAudioData(arrayBuffer);
  const stats = await analyzeAudio(buffer);
  return stats;
}

async function analyzeAudio(`;

content = content.replace("async function analyzeAudio(", analyzeFn);

fs.writeFileSync('src/lib/audio.ts', content);
