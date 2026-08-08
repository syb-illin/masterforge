const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// I already changed threshold to targetTruePeak - 0.1
// Let's make sure it hard clips at targetTruePeak
const hardClipCode = `const threshGain = dbToGain(targetTruePeak);`;
if (content.includes(hardClipCode)) {
  console.log("Hard clipper is present and uses targetTruePeak");
}
