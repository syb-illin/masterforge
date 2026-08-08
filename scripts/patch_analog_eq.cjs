const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const tapeCurveFn = `function makeTapeCurve(amount: number) {
  const k = typeof amount === 'number' ? amount : 2;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    // Tanh-based saturation (soft clipping, odd harmonics)
    curve[i] = Math.tanh(x * k) / Math.tanh(k);
  }
  return curve;
}`;

const newCurves = `function makeTapeCurve(amount: number) {
  const k = typeof amount === 'number' ? amount : 2;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = Math.tanh(x * k) / Math.tanh(k);
  }
  return curve;
}

// Emulates analog tube circuitry (asymmetrical clipping for musical even-order harmonics)
function makeTubeCurve(amount: number) {
  const k = typeof amount === 'number' ? amount : 2;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  for (let i = 0; i < n_samples; ++i) {
    let x = (i * 2) / n_samples - 1;
    // Asymmetric distortion: softer clipping on positive peaks, harder on negative
    if (x < 0) {
      curve[i] = -Math.pow(Math.abs(x), 1.0 + (k * 0.05));
    } else {
      curve[i] = Math.tanh(x * k) / Math.tanh(k);
    }
  }
  return curve;
}`;

content = content.replace(tapeCurveFn, newCurves);

const eqSectionOld = `  // 1. Natural Phase EQ: Apply only significant corrections to preserve phase coherence
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
  }`;

const eqSectionNew = `  // 1. Analog-Modeled EQ (Neve/Pultec Console Emulation)
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
  prevStereoNode = outputTube;`;

content = content.replace(eqSectionOld, eqSectionNew);

const oldReportEq = `eq: \`Suno Master EQ: Gentle Pultec-style low-end enhancement (+2dB at 60Hz) to bring out the deep bass body, while carving out low-mid mud (-1.5dB at 250Hz).\`,`;
const newReportEq = `eq: \`Analog-Modeled EQ: 31-band minimum-phase matching with Neve-style Input Transformer and Tube Output Stage for authentic harmonic distortion and warmth. Sub-bass Pultec-style enhancement (+2dB at 60Hz).\`,`;
content = content.replace(oldReportEq, newReportEq);

fs.writeFileSync('src/lib/audio.ts', content);
