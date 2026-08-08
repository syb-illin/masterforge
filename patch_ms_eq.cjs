const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const eqOld = `  // Transparent, surgical digital EQ bands (Pro-Q 4 pure EQ)
  for (let i = 0; i < eqFrequencies.length; i++) {
     // We bake the variance into a slight static gain reduction instead of using dynamic compression
     const staticGain = stats.eqOffsets[i] - (stats.dynEqAmount[i] * 1.5);
     
     if (Math.abs(staticGain) > 0.1) {
         const qAdjust = Math.min(6.0, Math.max(1.0, Math.abs(staticGain) * 1.2)); // Surgical Q
         
         const band = offlineCtx.createBiquadFilter();
         band.type = 'peaking';
         band.frequency.value = eqFrequencies[i];
         band.Q.value = qAdjust; 
         band.gain.value = staticGain;
         prevStereoNode.connect(band);
         prevStereoNode = band;
     }
  }`;

const eqNew = `  // Transparent, surgical digital EQ bands (Pro-Q 4 pure EQ) - 100% Independent M/S Processing
  onProgress('Encoding Mid/Side Matrix', 36);
  await yieldToMain();
  
  // Mid/Side Encoder
  const msSplitter = offlineCtx.createChannelSplitter(2);
  prevStereoNode.connect(msSplitter);
  
  const midSum = offlineCtx.createGain();
  midSum.gain.value = 0.5;
  msSplitter.connect(midSum, 0); // L -> Mid
  msSplitter.connect(midSum, 1); // R -> Mid
  
  const sideSum = offlineCtx.createGain();
  sideSum.gain.value = 0.5;
  const sideInvert = offlineCtx.createGain();
  sideInvert.gain.value = -0.5;
  msSplitter.connect(sideSum, 0); // L -> Side
  msSplitter.connect(sideInvert, 1); // R -> -R
  sideInvert.connect(sideSum); // L - R -> Side

  let prevMidNode = midSum;
  let prevSideNode = sideSum;
  
  onProgress('Applying Surgical Mid/Side EQ', 38);
  await yieldToMain();

  for (let i = 0; i < eqFrequencies.length; i++) {
     // Mid Channel EQ
     const midGain = stats.eqOffsets[i] - (stats.dynEqAmount[i] * 1.5);
     if (Math.abs(midGain) > 0.1) {
         const qAdjust = Math.min(6.0, Math.max(1.0, Math.abs(midGain) * 1.2));
         const band = offlineCtx.createBiquadFilter();
         band.type = 'peaking';
         band.frequency.value = eqFrequencies[i];
         band.Q.value = qAdjust; 
         band.gain.value = midGain;
         prevMidNode.connect(band);
         prevMidNode = band;
     }
     
     // Side Channel EQ
     const sideGain = stats.sideEqOffsets[i] - (stats.dynEqAmount[i] * 1.0);
     if (Math.abs(sideGain) > 0.1) {
         const qAdjust = Math.min(6.0, Math.max(1.0, Math.abs(sideGain) * 1.2));
         const band = offlineCtx.createBiquadFilter();
         band.type = 'peaking';
         band.frequency.value = eqFrequencies[i];
         band.Q.value = qAdjust; 
         band.gain.value = sideGain;
         prevSideNode.connect(band);
         prevSideNode = band;
     }
  }

  // Mid/Side Decoder
  const outSplitterMid = offlineCtx.createGain();
  const outSplitterSide = offlineCtx.createGain();
  prevMidNode.connect(outSplitterMid);
  prevSideNode.connect(outSplitterSide);
  
  const leftOut = offlineCtx.createGain();
  outSplitterMid.connect(leftOut); // Mid -> L
  outSplitterSide.connect(leftOut); // Side -> L
  
  const rightOut = offlineCtx.createGain();
  const rightSideInvert = offlineCtx.createGain();
  rightSideInvert.gain.value = -1.0;
  outSplitterSide.connect(rightSideInvert); // -Side -> R
  outSplitterMid.connect(rightOut); // Mid -> R
  rightSideInvert.connect(rightOut); // -Side -> R
  
  const msMerger = offlineCtx.createChannelMerger(2);
  leftOut.connect(msMerger, 0, 0);
  rightOut.connect(msMerger, 0, 1);
  
  prevStereoNode = msMerger;`;

content = content.replace(eqOld, eqNew);

const reportEqOld = "eq: `Precision Digital EQ (Pro-Q 4 Style): 31-band surgical parametric matching with 8x oversampling. Pure surgical EQ filters (no compression) engaged for high-variance resonant frequencies. Maximum transparency and phase coherence. Precise low-end focus shelf (+1.5dB at 60Hz).`,";
const reportEqNew = "eq: `Precision Digital EQ (Pro-Q 4 Style): Independent 31-band Mid/Side surgical parametric matching with 8x oversampling. Pure surgical EQ filters (no compression) engaged for high-variance resonant frequencies. Maximum transparency and phase coherence. Precise M/S low-end focus (+1.5dB at 60Hz).`,";
content = content.replace(reportEqOld, reportEqNew);

fs.writeFileSync('src/lib/audio.ts', content);
