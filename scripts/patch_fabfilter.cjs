const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const analogEqOld = `  // 1. Analog-Modeled EQ (Neve/Pultec Console Emulation)
  onProgress('Analog-Modeled EQ (Transformer + Tube Output)', 35);
  await yieldToMain();
  
  // Console Input Transformer (adds subtle even-order harmonics and warmth)
  const inputTransformer = offlineCtx.createWaveShaper();
  inputTransformer.curve = makeTubeCurve(1.2);
  inputTransformer.oversample = '4x';
  gainNode.connect(inputTransformer);

  let prevStereoNode: AudioNode = inputTransformer;
  
  // Minimum-phase Biquads mirror analog EQ filter topologies perfectly
  for (let i = 0; i < eqFrequencies.length; i++) {
     if (Math.abs(stats.eqOffsets[i]) > 0.5) {
         const band = offlineCtx.createBiquadFilter();
         band.type = 'peaking';
         band.frequency.value = eqFrequencies[i];
         band.Q.value = 1.414; 
         band.gain.value = stats.eqOffsets[i];
         prevStereoNode.connect(band);
         prevStereoNode = band;
     }
  }
  
  // Console Output Tube Stage (make-up gain saturation)
  const outputTube = offlineCtx.createWaveShaper();
  outputTube.curve = makeTubeCurve(1.1);
  outputTube.oversample = '4x';
  prevStereoNode.connect(outputTube);
  prevStereoNode = outputTube;

  // Suno Enhancement: Clean up mud, boost sub-bass, and widen highs (MS)
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
  midScoop.gain.value = -1.5; // Clear the typical Suno mud`;

const proQNew = `  // 1. Ultra-Precise Digital Parametric EQ (Pro-Q Style)
  onProgress('Ultra-Precise Linear-Style Parametric EQ', 35);
  await yieldToMain();

  let prevStereoNode: AudioNode = gainNode;
  
  // Transparent, surgical digital EQ bands without harmonic distortion
  for (let i = 0; i < eqFrequencies.length; i++) {
     if (Math.abs(stats.eqOffsets[i]) > 0.1) {
         const band = offlineCtx.createBiquadFilter();
         band.type = 'peaking';
         band.frequency.value = eqFrequencies[i];
         // Variable Q: surgical Q for high gain corrections, wider for subtle
         const qAdjust = Math.min(4.0, Math.max(1.0, Math.abs(stats.eqOffsets[i]) * 0.8));
         band.Q.value = qAdjust; 
         band.gain.value = stats.eqOffsets[i];
         prevStereoNode.connect(band);
         prevStereoNode = band;
     }
  }

  // Precision enhancements
  onProgress('Surgical Sub-Bass Focus & Mud Removal', 45);
  await yieldToMain();
  
  const subBoost = offlineCtx.createBiquadFilter();
  subBoost.type = 'lowshelf';
  subBoost.frequency.value = 60;
  subBoost.gain.value = 1.5; 
  
  const midScoop = offlineCtx.createBiquadFilter();
  midScoop.type = 'peaking';
  midScoop.frequency.value = 250;
  midScoop.Q.value = 2.0; // Tighter Q for surgical mud removal
  midScoop.gain.value = -1.5;`;

content = content.replace(analogEqOld, proQNew);

const reportEqOld = `eq: \`Analog-Modeled EQ: 31-band minimum-phase matching with Neve-style Input Transformer and Tube Output Stage for authentic harmonic distortion and warmth. Sub-bass Pultec-style enhancement (+2dB at 60Hz).\`,`;
const reportEqNew = `eq: \`Precision Digital EQ: 31-band surgical parametric matching (FabFilter Pro-Q style) with variable Q-factor for maximum transparency and phase coherence. Precise low-end focus shelf (+1.5dB at 60Hz) and surgical mud removal (-1.5dB at 250Hz, Q=2.0).\`,`;
content = content.replace(reportEqOld, reportEqNew);

fs.writeFileSync('src/lib/audio.ts', content);
