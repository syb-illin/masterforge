const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const tapeStart = content.indexOf('// 3. Multi-Band Tape Saturation');
const tapeEnd = content.indexOf('const makeupGainDb');

if (tapeStart === -1 || tapeEnd === -1) {
    console.error("Could not find tape logic boundaries");
    process.exit(1);
}

let newTapeLogic = `// 3. Broadband Tape Saturation with Pre/De-Emphasis (replaces phase-destructive multi-band)
  onProgress('Tape Saturation & Excitation', 50);
  await yieldToMain();
  
  // Pre-emphasis: boost highs slightly before saturation to get more harmonic excitement there
  const preEmphasis = offlineCtx.createBiquadFilter();
  preEmphasis.type = 'highshelf';
  preEmphasis.frequency.value = 3000;
  preEmphasis.gain.value = 3; 

  const tapeShaper = offlineCtx.createWaveShaper();
  tapeShaper.curve = makeTapeCurve(Math.max(1, tapeDrive)); 
  tapeShaper.oversample = '4x';

  // De-emphasis: cut highs back after saturation to balance it out
  const deEmphasis = offlineCtx.createBiquadFilter();
  deEmphasis.type = 'highshelf';
  deEmphasis.frequency.value = 3000;
  deEmphasis.gain.value = -3;
  
  // To keep the lows from getting too muddy in the saturator, we can use a gentle low shelf cut before and boost after, or just let it be.
  const lowPreCut = offlineCtx.createBiquadFilter();
  lowPreCut.type = 'lowshelf';
  lowPreCut.frequency.value = 150;
  lowPreCut.gain.value = isMuddy ? -2 : 0;
  
  const lowPostBoost = offlineCtx.createBiquadFilter();
  lowPostBoost.type = 'lowshelf';
  lowPostBoost.frequency.value = 150;
  lowPostBoost.gain.value = isMuddy ? 2 : 0;
  
  msOutputNode.connect(lowPreCut);
  lowPreCut.connect(preEmphasis);
  preEmphasis.connect(tapeShaper);
  tapeShaper.connect(deEmphasis);
  deEmphasis.connect(lowPostBoost);
  
  const processingOutput = lowPostBoost;

  `;

content = content.substring(0, tapeStart) + newTapeLogic + content.substring(tapeEnd);
fs.writeFileSync('src/lib/audio.ts', content);
