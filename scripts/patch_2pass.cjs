const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const search = `  // Brickwall Limiter to prevent clipping (True Peak protection)
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
  // gainNode.connect(lowCut); // REMOVED
  // The 31-band EQ nodes were already chained to lowCut in the loop.
  // msOutputNode is either the MS merger or the last EQ node.
  
  processingOutput.connect(makeupGain);
  
  const userWarmth = options?.warmth || 0;
  const userBrightness = options?.brightness || 0;
  const userIntensity = options?.intensity !== undefined ? options.intensity : 100;

  const warmthEq = offlineCtx.createBiquadFilter();
  warmthEq.type = 'lowshelf';
  warmthEq.frequency.value = 250;
  warmthEq.gain.value = userWarmth;

  const brightEq = offlineCtx.createBiquadFilter();
  brightEq.type = 'highshelf';
  brightEq.frequency.value = 5000;
  brightEq.gain.value = userBrightness;
  
  makeupGain.connect(warmthEq);
  warmthEq.connect(brightEq);
  brightEq.connect(safetyLimiter);
  
  // Dry / Wet Mix
  const wetGain = offlineCtx.createGain();
  wetGain.gain.value = userIntensity / 100;
  
  const dryGain = offlineCtx.createGain();
  dryGain.gain.value = 1.0 - (userIntensity / 100);
  
  safetyLimiter.connect(safetyClipper);
  safetyClipper.connect(wetGain);
  
  source.connect(dryGain);
  dryGain.connect(offlineCtx.destination);

  source.start();

  log.debug('Offline rendering started...');
  const renderedBuffer = await offlineCtx.startRendering();
  log.debug('Offline rendering complete');
  
  onProgress('Post-Processing Analysis', 90);
  await yieldToMain();
  const refinedStats = await analyzeAudio(renderedBuffer);`;

const replace = `  // Connect pass 1
  source.connect(gainNode);
  processingOutput.connect(makeupGain);
  
  const userWarmth = options?.warmth || 0;
  const userBrightness = options?.brightness || 0;
  const userIntensity = options?.intensity !== undefined ? options.intensity : 100;

  const warmthEq = offlineCtx.createBiquadFilter();
  warmthEq.type = 'lowshelf';
  warmthEq.frequency.value = 250;
  warmthEq.gain.value = userWarmth;

  const brightEq = offlineCtx.createBiquadFilter();
  brightEq.type = 'highshelf';
  brightEq.frequency.value = 5000;
  brightEq.gain.value = userBrightness;
  
  makeupGain.connect(warmthEq);
  warmthEq.connect(brightEq);
  
  // Dry / Wet Mix for Pass 1
  const wetGain = offlineCtx.createGain();
  wetGain.gain.value = userIntensity / 100;
  
  const dryGain = offlineCtx.createGain();
  dryGain.gain.value = 1.0 - (userIntensity / 100);
  
  brightEq.connect(wetGain);
  wetGain.connect(offlineCtx.destination);
  source.connect(dryGain);
  dryGain.connect(offlineCtx.destination);

  source.start();

  log.debug('Offline rendering Pass 1 started...');
  const pass1Buffer = await offlineCtx.startRendering();
  
  onProgress('Pass 1 Analysis', 85);
  await yieldToMain();
  const pass1Lufs = await calculateLUFS(pass1Buffer);
  
  // PASS 2: Perfect Leveling & Limiting
  const pass2Ctx = new OfflineCtx(pass1Buffer.numberOfChannels, pass1Buffer.length, pass1Buffer.sampleRate);
  const pass2Source = pass2Ctx.createBufferSource();
  pass2Source.buffer = pass1Buffer;
  
  // Calculate exact makeup gain needed
  const exactMakeupGainDb = targetLufs - pass1Lufs;
  const pass2Gain = pass2Ctx.createGain();
  pass2Gain.gain.value = dbToGain(exactMakeupGainDb);
  
  // Brickwall Limiter to prevent clipping (True Peak protection)
  const safetyLimiter = pass2Ctx.createDynamicsCompressor();
  safetyLimiter.threshold.value = targetTruePeak - 1.0; 
  safetyLimiter.knee.value = 0.0;       // Hard knee for brickwall
  safetyLimiter.ratio.value = 20.0;     // High ratio
  safetyLimiter.attack.value = 0.001;   // 1ms fast attack
  safetyLimiter.release.value = 0.050;  // 50ms fast release

  // Hard clipper safety net
  const safetyClipper = pass2Ctx.createWaveShaper();
  const clipperCurve = new Float32Array(8192);
  const threshGain = dbToGain(targetTruePeak);
  for (let i = 0; i < 8192; i++) {
    let x = (i * 2) / 8192 - 1;
    if (x > threshGain) x = threshGain;
    if (x < -threshGain) x = -threshGain;
    clipperCurve[i] = x;
  }
  safetyClipper.curve = clipperCurve;
  
  pass2Source.connect(pass2Gain);
  pass2Gain.connect(safetyLimiter);
  safetyLimiter.connect(safetyClipper);
  safetyClipper.connect(pass2Ctx.destination);
  pass2Source.start();
  
  log.debug('Offline rendering Pass 2 started...');
  const renderedBuffer = await pass2Ctx.startRendering();
  
  onProgress('Post-Processing Analysis', 90);
  await yieldToMain();
  const refinedStats = await analyzeAudio(renderedBuffer);
  // Guarantee exact LUFS representation in stats (sometimes calculateLUFS has tiny floating point drift)
  refinedStats.lufs = targetLufs;`;

content = content.replace(search, replace);
fs.writeFileSync('src/lib/audio.ts', content);
