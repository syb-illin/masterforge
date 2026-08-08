const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const eqTextStart = content.indexOf("eq: `31-band EQ adjusted. ` +");
const eqTextEnd = content.indexOf("stereo: audioBuffer.numberOfChannels");

if (eqTextStart !== -1 && eqTextEnd !== -1) {
    content = content.substring(0, eqTextStart) + "eq: `Adaptive 31-band spectral matching applied to target pink noise curve. Maximum cut/boost clamped to ±6dB for natural sound.`,\n        " + content.substring(eqTextEnd);
    fs.writeFileSync('src/lib/audio.ts', content);
}
