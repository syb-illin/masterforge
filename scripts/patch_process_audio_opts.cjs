const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

content = content.replace(
  "targets: { profile: string, targetLufs?: number, targetTruePeak?: number },",
  "targets: { profile: string, targetLufs?: number, targetTruePeak?: number, referenceStats?: any },"
);

fs.writeFileSync('src/lib/audio.ts', content);
