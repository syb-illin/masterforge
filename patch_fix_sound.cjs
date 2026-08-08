const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const eqStart = content.indexOf('// First, apply Stereo EQ');
const eqEnd = content.indexOf('// 3. Multi-Band Tape Saturation');

if (eqStart === -1 || eqEnd === -1) {
    console.error("Could not find eq logic boundaries");
    process.exit(1);
}

let newEqLogic = `// First, apply Stereo EQ gently (Natural Phase approximation by avoiding aggressive crossovers)
  let prevStereoNode: AudioNode = gainNode;
  for (let i = 0; i < eqFrequencies.length; i++) {
     // Only apply if the change is noticeable to save nodes and phase shift
     if (Math.abs(stats.eqOffsets[i]) > 0.5) {
         const band = offlineCtx.createBiquadFilter();
         band.type = 'peaking';
         band.frequency.value = eqFrequencies[i];
         band.Q.value = 4.31;
         band.gain.value = stats.eqOffsets[i];
         prevStereoNode.connect(band);
         prevStereoNode = band;
     }
  }

  // Smooth broadband compression instead of multi-band in this stage to preserve phase
  const mainComp = offlineCtx.createDynamicsCompressor();
  mainComp.threshold.value = -24;
  mainComp.ratio.value = 1.5;
  mainComp.attack.value = 0.01;
  mainComp.release.value = 0.1;
  prevStereoNode.connect(mainComp);

  if (audioBuffer.numberOfChannels === 2) {
    // M/S processing for exceptions (e.g. centering bass, widening highs)
    const splitter = offlineCtx.createChannelSplitter(2);
    const merger = offlineCtx.createChannelMerger(2);
    
    const lIn = offlineCtx.createGain();
    const rIn = offlineCtx.createGain();
    const midGain = offlineCtx.createGain(); midGain.gain.value = 0.5;
    const sideGain = offlineCtx.createGain(); sideGain.gain.value = 0.5;
    const rInv = offlineCtx.createGain(); rInv.gain.value = -1;
    
    mainComp.connect(splitter);
    splitter.connect(lIn, 0);
    splitter.connect(rIn, 1);
    
    // Mid = L+R
    lIn.connect(midGain);
    rIn.connect(midGain);
    
    // Side = L-R
    lIn.connect(sideGain);
    rIn.connect(rInv);
    rInv.connect(sideGain);
    
    // Apply Side-specific Highpass to mono the low end cleanly (zero phase issues on mid)
    const sideHighPass = offlineCtx.createBiquadFilter();
    sideHighPass.type = 'highpass';
    sideHighPass.frequency.value = 150;
    sideHighPass.Q.value = 0.707;
    sideGain.connect(sideHighPass);

    // Apply a High Shelf to side to widen highs if needed
    const sideHighShelf = offlineCtx.createBiquadFilter();
    sideHighShelf.type = 'highshelf';
    sideHighShelf.frequency.value = 2500;
    sideHighShelf.gain.value = Math.max(-6, Math.min(6, (stats.stereoWidth < 0.2 ? 2.0 : (stats.stereoWidth > 0.8 ? -2.0 : 0))));
    sideHighPass.connect(sideHighShelf);
    
    const lOut = offlineCtx.createGain();
    const rOut = offlineCtx.createGain();
    
    midGain.connect(lOut);
    sideHighShelf.connect(lOut);
    
    midGain.connect(rOut);
    const sideInvOut = offlineCtx.createGain();
    sideInvOut.gain.value = -1;
    sideHighShelf.connect(sideInvOut);
    sideInvOut.connect(rOut);
    
    lOut.connect(merger, 0, 0);
    rOut.connect(merger, 0, 1);
    
    msOutputNode = merger;
  } else {
    msOutputNode = mainComp;
  }

  `;

content = content.substring(0, eqStart) + newEqLogic + content.substring(eqEnd);
fs.writeFileSync('src/lib/audio.ts', content);
