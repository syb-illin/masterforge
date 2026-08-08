const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

if (!content.includes("import * as Tone")) {
  content = "import * as Tone from 'tone';\n" + content;
}

const offlineRegex = /const offlineCtx = new OfflineAudioContext\([\s\S]*?sampleRate\n\s*\);/m;
content = content.replace(offlineRegex, `const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    Math.ceil(audioBuffer.duration * sampleRate),
    sampleRate
  );
  Tone.setContext(new Tone.OfflineContext(offlineCtx));`);
  
fs.writeFileSync('src/lib/audio.ts', content);
