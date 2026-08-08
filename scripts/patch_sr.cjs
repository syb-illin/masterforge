const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

content = content.replace(
  "const sampleRate = 48000;",
  "const sampleRate = targets.exportSampleRate || 48000;"
);

// We should also check for pass2 context:
content = content.replace(
  "const sampleRate2 = 48000;",
  "const sampleRate2 = targets.exportSampleRate || 48000;"
);

fs.writeFileSync('src/lib/audio.ts', content);
