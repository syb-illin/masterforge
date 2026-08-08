const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const searchStr = `  // 2. Transparent Saturation (No pre/de-emphasis filters to guarantee zero phase distortion)
  onProgress('Transparent Harmonic Excitation', 50);`;

const replaceStr = `  // Suno Enhancement: Clean up mud, boost sub-bass, and widen highs (MS)
  onProgress('Enhancing Low-End Body and Stereo Width', 45);
  await yieldToMain();
  
  // Safe low-end boost (Pultec-style curve)
  const subBoost = offlineCtx.createBiquadFilter();
  subBoost.type = 'lowshelf';
  subBoost.frequency.value = 60;
  subBoost.gain.value = 2.0; // Bring back the deep bass body
  
  const midScoop = offlineCtx.createBiquadFilter();
  midScoop.type = 'peaking';
  midScoop.frequency.value = 250;
  midScoop.Q.value = 1.0;
  midScoop.gain.value = -1.5; // Clear the typical Suno mud

  prevStereoNode.connect(subBoost);
  subBoost.connect(midScoop);
  prevStereoNode = midScoop;

  // MS Matrix for Safe Stereo Widening
  let msOutputNode;
  if (audioBuffer.numberOfChannels === 2) {
    const splitter = offlineCtx.createChannelSplitter(2);
    const merger = offlineCtx.createChannelMerger(2);
    
    const lIn = offlineCtx.createGain();
    const rIn = offlineCtx.createGain();
    const midGain = offlineCtx.createGain(); midGain.gain.value = 0.5;
    const sideGain = offlineCtx.createGain(); sideGain.gain.value = 0.5;
    const rInv = offlineCtx.createGain(); rInv.gain.value = -1;
    
    prevStereoNode.connect(splitter);
    splitter.connect(lIn, 0);
    splitter.connect(rIn, 1);
    
    // Mid = L+R
    lIn.connect(midGain);
    rIn.connect(midGain);
    
    // Side = L-R
    lIn.connect(sideGain);
    rIn.connect(rInv);
    rInv.connect(sideGain);
    
    // Widen highs on side channel
    const sideHighShelf = offlineCtx.createBiquadFilter();
    sideHighShelf.type = 'highshelf';
    sideHighShelf.frequency.value = 4000;
    sideHighShelf.gain.value = 2.0; // Fixed gentle widening for that modern sheen
    
    // Keep sub-bass strictly mono
    const sideHighPass = offlineCtx.createBiquadFilter();
    sideHighPass.type = 'highpass';
    sideHighPass.frequency.value = 120;
    
    sideGain.connect(sideHighPass);
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
    msOutputNode = prevStereoNode;
  }

  // 2. Transparent Saturation
  onProgress('Transparent Harmonic Excitation', 50);`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync('src/lib/audio.ts', content);
