const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const startChain = content.indexOf('// First, apply Stereo EQ gently');
const endChain = content.indexOf('const processingOutput =');

if (startChain === -1 || endChain === -1) {
    console.error("Boundaries not found");
    process.exit(1);
}

let newChain = `// 1. Natural Phase EQ: Apply only significant corrections to preserve phase coherence
  let prevStereoNode: AudioNode = gainNode;
  for (let i = 0; i < eqFrequencies.length; i++) {
     // Very gentle application. We only apply EQ if it's a significant fix
     if (Math.abs(stats.eqOffsets[i]) > 0.5) {
         const band = offlineCtx.createBiquadFilter();
         band.type = 'peaking';
         band.frequency.value = eqFrequencies[i];
         // Lower Q for more "natural" broad strokes, less resonant phase shift
         band.Q.value = 1.414; 
         band.gain.value = stats.eqOffsets[i];
         prevStereoNode.connect(band);
         prevStereoNode = band;
     }
  }

  // 2. Transparent Saturation (No pre/de-emphasis filters to guarantee zero phase distortion)
  onProgress('Transparent Harmonic Excitation', 50);
  await yieldToMain();
  
  const tapeShaper = offlineCtx.createWaveShaper();
  // Very minimal drive to keep the body intact, just adding slight harmonics
  tapeShaper.curve = makeTapeCurve(1.05 + (tapeDrive * 0.05)); 
  tapeShaper.oversample = '4x';
  
  prevStereoNode.connect(tapeShaper);

  const processingOutput = tapeShaper;
  
  `;

content = content.substring(0, startChain) + newChain + content.substring(endChain + 'const processingOutput = lowPostBoost;\n  \n  '.length);

fs.writeFileSync('src/lib/audio.ts', content);
