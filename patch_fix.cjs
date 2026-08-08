const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// 1. Fix Stereo Width
const stereoSearch = `    // Widen highs on side channel
    const sideHighShelf = offlineCtx.createBiquadFilter();
    sideHighShelf.type = 'highshelf';
    sideHighShelf.frequency.value = 4000;
    sideHighShelf.gain.value = 2.0; // Fixed gentle widening for that modern sheen`;
    
const stereoReplace = `    // Widen highs on side channel
    const sideHighShelf = offlineCtx.createBiquadFilter();
    sideHighShelf.type = 'highshelf';
    sideHighShelf.frequency.value = 4000;
    sideHighShelf.gain.value = 3.0; // Fixed gentle widening for that modern sheen
    
    // Overall side channel boost
    sideGain.gain.value = 0.8; // Boost side signal to increase stereo width`;
    
content = content.replace(stereoSearch, stereoReplace);

// 2. Fix Limiter and Clipper
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
  
  safetyLimiter.connect(wetGain);
  source.connect(dryGain);
  
  wetGain.connect(offlineCtx.destination);
  dryGain.connect(offlineCtx.destination);`;
  
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
  safetyLimiter.connect(safetyClipper);
  
  // Dry / Wet Mix
  const wetGain = offlineCtx.createGain();
  wetGain.gain.value = userIntensity / 100;
  
  const dryGain = offlineCtx.createGain();
  dryGain.gain.value = 1.0 - (userIntensity / 100);
  
  safetyClipper.connect(wetGain);
  source.connect(dryGain);
  
  wetGain.connect(offlineCtx.destination);
  dryGain.connect(offlineCtx.destination);`;

content = content.replace(limiterSearch, limiterReplace);

fs.writeFileSync('src/lib/audio.ts', content);
