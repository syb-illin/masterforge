const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const oldShaper = `  const tapeShaper = offlineCtx.createWaveShaper();
  // Very minimal drive to keep the body intact, just adding slight harmonics
  tapeShaper.curve = makeTapeCurve(1.05 + (tapeDrive * 0.05)); 
  tapeShaper.oversample = '4x';
  
  deHarsh.connect(tapeShaper);

  const processingOutput = tapeShaper;`;

const newMultiband = `  onProgress('Dynamic Multiband Saturation', 65);
  await yieldToMain();
  
  const multiband = new Tone.MultibandSplit({
    lowFrequency: 250,
    highFrequency: 4000
  });
  
  const lowShaper = offlineCtx.createWaveShaper();
  const midShaper = offlineCtx.createWaveShaper();
  const highShaper = offlineCtx.createWaveShaper();
  
  lowShaper.oversample = '4x';
  midShaper.oversample = '4x';
  highShaper.oversample = '4x';
  
  // Dynamic saturation per band based on spectral energy
  // High energy gets slightly less drive to prevent harshness, lows get more body
  const lowDrive = 1.02 + (tapeDrive * 0.08) * (1 - (stats.lowEnergyPct || 0)); 
  const midDrive = 1.05 + (tapeDrive * 0.05); 
  const highDrive = 1.01 + (tapeDrive * 0.04) * (stats.highEnergyPct || 0);

  lowShaper.curve = makeTapeCurve(lowDrive);
  midShaper.curve = makeTapeCurve(midDrive);
  highShaper.curve = makeTapeCurve(highDrive);

  Tone.connect(deHarsh, multiband);
  Tone.connect(multiband.low, lowShaper);
  Tone.connect(multiband.mid, midShaper);
  Tone.connect(multiband.high, highShaper);
  
  const multibandMix = offlineCtx.createGain();
  Tone.connect(lowShaper, multibandMix);
  Tone.connect(midShaper, multibandMix);
  Tone.connect(highShaper, multibandMix);

  const processingOutput = multibandMix;`;

content = content.replace(oldShaper, newMultiband);
fs.writeFileSync('src/lib/audio.ts', content);
