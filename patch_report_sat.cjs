const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const targetStrStart = "saturation: `Multi-Band Tape:";
const targetStrEnd = "',";

const startIdx = content.indexOf(targetStrStart);
if (startIdx !== -1) {
    const endIdx = content.indexOf(targetStrEnd, startIdx) + targetStrEnd.length;
    content = content.substring(0, startIdx) + "saturation: `Broadband Tape Saturation: Smooth harmonic excitation (drive x${tapeDrive.toFixed(1)}) with Pre/De-Emphasis to preserve highs and phase coherence.`," + content.substring(endIdx);
    fs.writeFileSync('src/lib/audio.ts', content);
}
