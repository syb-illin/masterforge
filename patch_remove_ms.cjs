const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const msStart = content.indexOf('if (audioBuffer.numberOfChannels === 2) {');
const msEnd = content.indexOf('msOutputNode = mainComp;\n  }') + 'msOutputNode = mainComp;\n  }'.length;

if (msStart !== -1 && msEnd !== -1) {
    content = content.substring(0, msStart) + 'msOutputNode = mainComp;' + content.substring(msEnd);
} else {
    console.error("Could not find MS block");
    process.exit(1);
}

fs.writeFileSync('src/lib/audio.ts', content);
