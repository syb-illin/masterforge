const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const connectStart = content.indexOf('msOutputNode.connect(bandLowFilter);');
const connectEnd = content.indexOf('multiBandSum.connect(makeupGain);');

if (connectStart !== -1 && connectEnd !== -1) {
    let newConnect = `processingOutput.connect(makeupGain);\n  `;
    content = content.substring(0, connectStart) + newConnect + content.substring(connectEnd + 'multiBandSum.connect(makeupGain);'.length);
}
fs.writeFileSync('src/lib/audio.ts', content);
