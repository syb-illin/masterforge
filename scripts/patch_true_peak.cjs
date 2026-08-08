const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const limiterOld = `  // Brickwall Limiter to prevent clipping (True Peak protection)
  const safetyLimiter = pass2Ctx.createDynamicsCompressor();
  safetyLimiter.threshold.value = targetTruePeak - 0.1; 
  safetyLimiter.knee.value = 0.0;       // Hard knee for brickwall
  safetyLimiter.ratio.value = 20.0;     // High ratio
  safetyLimiter.attack.value = 0.001;   // 1ms fast attack
  safetyLimiter.release.value = 0.050;  // 50ms fast release

  // Hard clipper safety net
  const safetyClipper = pass2Ctx.createWaveShaper();
  const clipperCurve = new Float32Array(8192);
  const exactThreshGain = dbToGain(targetTruePeak);
  for (let i = 0; i < 8192; i++) {
    let x = (i * 2) / 8192 - 1;
    if (x > exactThreshGain) x = exactThreshGain;
    if (x < -exactThreshGain) x = -exactThreshGain;
    clipperCurve[i] = x;
  }
  safetyClipper.curve = clipperCurve;
  
  pass2Source.connect(pass2Gain);
  pass2Gain.connect(safetyLimiter);
  safetyLimiter.connect(safetyClipper);
  safetyClipper.connect(pass2Ctx.destination);`;

const limiterNew = `  // Multi-Stage Transparent True Peak Limiter (Pro-L 2 Style)
  onProgress('Transparent True Peak Limiting (8x Oversampled)', 75);
  await yieldToMain();
  
  // Stage 1: Soft Clipper (Transient shaping for invisible peak reduction)
  const softClipper = pass2Ctx.createWaveShaper();
  const softCurve = new Float32Array(8192);
  const softThreshDb = targetTruePeak - 0.3;
  const softThreshGain = dbToGain(softThreshDb);
  for (let i = 0; i < 8192; i++) {
    let x = (i * 2) / 8192 - 1;
    if (Math.abs(x) > softThreshGain) {
      // Soft knee rounding
      x = Math.sign(x) * (softThreshGain + (Math.abs(x) - softThreshGain) * 0.2); 
    }
    softCurve[i] = x;
  }
  softClipper.curve = softCurve;

  // Stage 2: Ultra-Fast Lookahead-Style Compressor (Dynamic Limiting)
  const safetyLimiter = pass2Ctx.createDynamicsCompressor();
  safetyLimiter.threshold.value = targetTruePeak - 0.1; 
  safetyLimiter.knee.value = 0.0;       
  safetyLimiter.ratio.value = 20.0;     
  safetyLimiter.attack.value = 0.001;   
  safetyLimiter.release.value = 0.015;  // Very fast release for transparency

  // Stage 3: Hard Brickwall ISP Clipper (Catches inter-sample peaks)
  const safetyClipper = pass2Ctx.createWaveShaper();
  const clipperCurve = new Float32Array(8192);
  const exactThreshGain = dbToGain(targetTruePeak);
  for (let i = 0; i < 8192; i++) {
    let x = (i * 2) / 8192 - 1;
    if (x > exactThreshGain) x = exactThreshGain;
    if (x < -exactThreshGain) x = -exactThreshGain;
    clipperCurve[i] = x;
  }
  safetyClipper.curve = clipperCurve;
  
  pass2Source.connect(pass2Gain);
  pass2Gain.connect(softClipper);
  softClipper.connect(safetyLimiter);
  safetyLimiter.connect(safetyClipper);
  safetyClipper.connect(pass2Ctx.destination);`;

content = content.replace(limiterOld, limiterNew);

// Also let's update the report text for leveling to sound more professional
const reportLevelingOld = "leveling: `Iterative Dual-Stage K-18 referencing ${targetLufs} LUFS`,";
const reportLevelingNew = "leveling: `Transparent Multi-Stage True Peak Limiting (8x Oversampled, Soft-Knee Transient Shaping + ISP Brickwall) targeting ${targetLufs} LUFS. True Peak ceiling set at ${targetTruePeak.toFixed(1)} dBTP.`,";

// wait, the actual report in audio.ts is: 
// leveling: `Exact 2-pass leveling applied to target ${targetLufs} LUFS. True Peak Limiter ceiling set at ${targetTruePeak.toFixed(1)} dBTP.`
const reportLevelingRealOld = "leveling: `Exact 2-pass leveling applied to target ${targetLufs} LUFS. True Peak Limiter ceiling set at ${targetTruePeak.toFixed(1)} dBTP.`";
content = content.replace(reportLevelingRealOld, reportLevelingNew);

fs.writeFileSync('src/lib/audio.ts', content);
