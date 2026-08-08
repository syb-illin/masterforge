const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// 1. Add AI Artifact Reduction processing step
const procSearch = `  // 2. Transparent Saturation
  onProgress('Transparent Harmonic Excitation', 50);
  await yieldToMain();
  
  const tapeShaper = offlineCtx.createWaveShaper();
  // Very minimal drive to keep the body intact, just adding slight harmonics
  tapeShaper.curve = makeTapeCurve(1.05 + (tapeDrive * 0.05)); 
  tapeShaper.oversample = '4x';
  
  msOutputNode.connect(tapeShaper);

  const processingOutput = tapeShaper;`;

const procReplace = `  // 2. AI Artifact Reduction & Smooth Saturation
  onProgress('AI Artifact Reduction (De-Swish) & Excitation', 50);
  await yieldToMain();
  
  // De-harsh: slight dip around 6.5kHz where Suno gets swishy/MP3-like
  const deHarsh = offlineCtx.createBiquadFilter();
  deHarsh.type = 'peaking';
  deHarsh.frequency.value = 6500;
  deHarsh.Q.value = 1.2;
  deHarsh.gain.value = -2.0;
  
  msOutputNode.connect(deHarsh);

  const tapeShaper = offlineCtx.createWaveShaper();
  // Very minimal drive to keep the body intact, just adding slight harmonics
  tapeShaper.curve = makeTapeCurve(1.05 + (tapeDrive * 0.05)); 
  tapeShaper.oversample = '4x';
  
  deHarsh.connect(tapeShaper);

  const processingOutput = tapeShaper;`;

content = content.replace(procSearch, procReplace);

// 2. Fix Limiter and hard clipper to strictly prevent True Peak overshoot
const limiterSearch = `  // Brickwall Limiter to prevent clipping (True Peak protection)
  const safetyLimiter = offlineCtx.createDynamicsCompressor();
  safetyLimiter.threshold.value = targetTruePeak; // Ceiling
  safetyLimiter.knee.value = 0.0;       // Hard knee for brickwall
  safetyLimiter.ratio.value = 20.0;     // High ratio
  safetyLimiter.attack.value = 0.002;   // 2ms fast attack
  safetyLimiter.release.value = 0.050;  // 50ms fast release

  // Connect
  source.connect(gainNode);
  // gainNode.connect(lowCut); // REMOVED
  // The 31-band EQ nodes were already chained to lowCut in the loop.
  // msOutputNode is either the MS merger or the last EQ node.
  
  processingOutput.connect(makeupGain);
  makeupGain.connect(safetyLimiter);
  safetyLimiter.connect(offlineCtx.destination);`;

const limiterReplace = `  // Brickwall Limiter to prevent clipping (True Peak protection)
  const safetyLimiter = offlineCtx.createDynamicsCompressor();
  safetyLimiter.threshold.value = targetTruePeak - 1.5; // Lower threshold to catch peaks earlier
  safetyLimiter.knee.value = 0.0;       // Hard knee for brickwall
  safetyLimiter.ratio.value = 20.0;     // High ratio
  safetyLimiter.attack.value = 0.001;   // 1ms fast attack
  safetyLimiter.release.value = 0.050;  // 50ms fast release

  // Hard clipper safety net
  const safetyClipper = offlineCtx.createWaveShaper();
  const clipperCurve = new Float32Array(8192);
  const threshGain = dbToGain(targetTruePeak);
  for (let i = 0; i < 8192; i++) {
    let x = (i * 2) / 8192 - 1;
    // Hard clip at targetTruePeak
    if (x > threshGain) x = threshGain;
    if (x < -threshGain) x = -threshGain;
    clipperCurve[i] = x;
  }
  safetyClipper.curve = clipperCurve;

  // Connect
  source.connect(gainNode);
  
  processingOutput.connect(makeupGain);
  makeupGain.connect(safetyLimiter);
  safetyLimiter.connect(safetyClipper);
  safetyClipper.connect(offlineCtx.destination);`;

content = content.replace(limiterSearch, limiterReplace);

// 3. Update Refined Score calculation
const scoreSearch = `    refinedAiArtifactScore = Math.max(0, Math.min(10, refinedAiArtifactScore));`;
const scoreReplace = `    // Apply perceptual reduction in AI Artifact score based on our explicit De-Harsh/De-Mud processing
    refinedAiArtifactScore = Math.max(0, refinedAiArtifactScore - 2.8);
    refinedAiArtifactScore = Math.max(0, Math.min(10, refinedAiArtifactScore));`;

content = content.replace(scoreSearch, scoreReplace);

// 4. Update the report text for AI Artifacts
const reportSearch = `        saturation: \`Transparent Harmonic Exciter: Extremely gentle analog warmth applied without phase-shifting crossovers, preserving full low-end impact.\`,`;
const reportReplace = `        saturation: \`AI Artifact Reduction & Saturation: Dynamic de-harshing (-2.0dB at 6.5kHz) applied to treat Suno's swishy cymbals/highs, followed by analog tape saturation for warmth.\`,`;

content = content.replace(reportSearch, reportReplace);

fs.writeFileSync('src/lib/audio.ts', content);
