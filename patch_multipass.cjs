const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// 1. Genre aware presets
const oldGenre = `  // Reduce drive if already harmonically dense/harsh or noisy
  if (stats.zcr > 0.15) tapeDrive *= 0.8;
  if (stats.flatness > 0.4) tapeDrive *= 0.7;`;

const newGenre = `  // Reduce drive if already harmonically dense/harsh or noisy
  if (stats.zcr > 0.15) tapeDrive *= 0.8;
  if (stats.flatness > 0.4) tapeDrive *= 0.7;
  
  const genre = targets.genre || "Unknown";
  if (genre.includes("Electronic") || genre.includes("Hip-Hop")) {
    tapeDrive *= 1.15;
  } else if (genre.includes("Acoustic") || genre.includes("Classical")) {
    tapeDrive *= 0.7;
  }`;
content = content.replace(oldGenre, newGenre);

// 2. Multi-pass QC
const oldQc = `  const renderedBuffer = await pass2Ctx.startRendering();
  
  onProgress('Post-Processing Analysis', 90);
  await yieldToMain();
  
  // Normalize and apply True Peak Limiting via scalar if needed (failsafe for minor overshoots)
  const dataL = renderedBuffer.getChannelData(0);`;

const newQc = `  let renderedBuffer = await pass2Ctx.startRendering();
  
  onProgress('Post-Processing Analysis', 85);
  await yieldToMain();
  
  let finalStats = await analyzeAudio(renderedBuffer);
  
  let qcPasses = 0;
  while (Math.abs(finalStats.lufs - targetLufs) > 0.3 && qcPasses < 2) {
    onProgress(\`Iterative QC Correction (Pass \${qcPasses + 1})\`, 85 + qcPasses * 3);
    await yieldToMain();
    
    const correctionDb = targetLufs - finalStats.lufs;
    const qcCtx = new OfflineCtx2(renderedBuffer.numberOfChannels, renderedBuffer.length, renderedBuffer.sampleRate);
    const qcSource = qcCtx.createBufferSource();
    qcSource.buffer = renderedBuffer;
    
    const qcGain = qcCtx.createGain();
    qcGain.gain.value = dbToGain(correctionDb);
    
    const qcLimiter = qcCtx.createDynamicsCompressor();
    qcLimiter.threshold.value = targetTruePeak - 0.5;
    qcLimiter.ratio.value = 20.0;
    qcLimiter.attack.value = 0.001;
    qcLimiter.release.value = 0.050;
    
    qcSource.connect(qcGain);
    qcGain.connect(qcLimiter);
    qcLimiter.connect(qcCtx.destination);
    qcSource.start();
    
    renderedBuffer = await qcCtx.startRendering();
    finalStats = await analyzeAudio(renderedBuffer);
    qcPasses++;
  }
  
  onProgress('Final Output Validation', 90);
  await yieldToMain();
  
  // Normalize and apply True Peak Limiting via scalar if needed (failsafe for minor overshoots)
  const dataL = renderedBuffer.getChannelData(0);`;
content = content.replace(oldQc, newQc);

// 3. Update AudioReport output in processAudio
const oldReportOutput = `  const report: AudioReport = {
    analysis: {
      lufs: refinedStats.lufs,
      peak: refinedStats.peak,
      crestFactor: refinedStats.crestFactor,
      centroid: refinedStats.centroid,
      zcr: refinedStats.zcr,
      flatness: refinedStats.flatness,
      stereoWidth: refinedStats.stereoWidth,
      correlation: refinedStats.correlation,
      eqOffsets: refinedStats.eqOffsets,
      midEqOffsets: refinedStats.midEqOffsets,
      sideEqOffsets: refinedStats.sideEqOffsets,
      dynEqAmount: refinedStats.dynEqAmount,
      rolloff: refinedStats.rolloff,
      lowEnergyPct: refinedStats.lowEnergyPct,
      midEnergyPct: refinedStats.midEnergyPct,
      highEnergyPct: refinedStats.highEnergyPct,

      characteristics,
      aiArtifactScore: aiScore
    },
    processing: {
      profile: targets.profile,
      targetLufs,
      targetTruePeak,
      saturation: tapeDrive > 1.8 ? 'Heavy (Analog Tape + Tube)' : (tapeDrive > 1.4 ? 'Moderate (Analog Tape)' : 'Subtle (Clean Transformer)'),
      leveling: 'Dual-Stage K-18 internally referenced to ' + targetLufs + ' LUFS'
    }
  };`;

const newReportOutput = `  const report: AudioReport = {
    analysis: {
      lufs: refinedStats.lufs,
      peak: refinedStats.peak,
      crestFactor: refinedStats.crestFactor,
      centroid: refinedStats.centroid,
      zcr: refinedStats.zcr,
      flatness: refinedStats.flatness,
      stereoWidth: refinedStats.stereoWidth,
      correlation: refinedStats.correlation,
      eqOffsets: refinedStats.eqOffsets,
      midEqOffsets: refinedStats.midEqOffsets,
      sideEqOffsets: refinedStats.sideEqOffsets,
      dynEqAmount: refinedStats.dynEqAmount,
      rolloff: refinedStats.rolloff,
      lowEnergyPct: refinedStats.lowEnergyPct,
      midEnergyPct: refinedStats.midEnergyPct,
      highEnergyPct: refinedStats.highEnergyPct,
      lra: refinedStats.lra,

      characteristics,
      aiArtifactScore: aiScore,
      sunoArtifactProb: refinedStats.sunoArtifactProb
    },
    processing: {
      profile: targets.profile,
      targetLufs,
      targetTruePeak,
      saturation: tapeDrive > 1.8 ? 'Heavy (Analog Tape + Tube)' : (tapeDrive > 1.4 ? 'Moderate (Analog Tape)' : 'Subtle (Clean Transformer)'),
      leveling: 'Iterative Dual-Stage K-18 referencing ' + targetLufs + ' LUFS',
      presetVersion: '1.4.0'
    }
  };`;

content = content.replace(oldReportOutput, newReportOutput);

fs.writeFileSync('src/lib/audio.ts', content);
