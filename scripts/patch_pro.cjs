const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// 1. DC Offset
const sourceOld = `  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  // 1. Gain Staging (K-Weighted LUFS)
  onProgress(\`Gain staging (offset: \${stagingGainDb.toFixed(1)}dB)\`, 15);
  await yieldToMain();
  const gainNode = offlineCtx.createGain();
  gainNode.gain.value = stagingGain; 

  // 2. Detailed 31-Band Stereo Parametric EQ & M/S Exceptions
  onProgress('Applying FabFilter-style Hybrid Stereo & M/S EQ', 30);
  await yieldToMain();`;

const sourceNew = `  const source = offlineCtx.createBufferSource();
  source.buffer = audioBuffer;

  // 0. Pro Mastering Pre-Process: DC Offset Removal (High-pass at 15Hz)
  const dcBlocker = offlineCtx.createBiquadFilter();
  dcBlocker.type = 'highpass';
  dcBlocker.frequency.value = 15;
  dcBlocker.Q.value = 0.5; // Gentle Buttersworth
  
  source.connect(dcBlocker);

  // 1. Gain Staging (K-Weighted LUFS)
  onProgress(\`Gain staging (offset: \${stagingGainDb.toFixed(1)}dB)\`, 15);
  await yieldToMain();
  const gainNode = offlineCtx.createGain();
  gainNode.gain.value = stagingGain; 
  dcBlocker.connect(gainNode);

  // 2. Detailed 31-Band Stereo Parametric EQ & M/S Exceptions
  onProgress('Applying FabFilter-style Hybrid Stereo & M/S EQ', 30);
  await yieldToMain();`;

content = content.replace(sourceOld, sourceNew);

// 2. SSL Glue Compressor
const pass2Old = `  pass2Source.connect(pass2Gain);
  pass2Gain.connect(softClipper);
  softClipper.connect(safetyLimiter);
  safetyLimiter.connect(safetyClipper);
  safetyClipper.connect(pass2Ctx.destination);`;

const pass2New = `  // SSL-Style VCA Bus Compressor (Gentle Mix Glue)
  const busComp = pass2Ctx.createDynamicsCompressor();
  busComp.threshold.value = -24; 
  busComp.knee.value = 12; 
  busComp.ratio.value = 1.5; // Very gentle ratio
  busComp.attack.value = 0.03; // 30ms slow attack to let transients through
  busComp.release.value = 0.25; // 250ms release for glue
  
  pass2Source.connect(busComp);
  busComp.connect(pass2Gain);
  pass2Gain.connect(softClipper);
  softClipper.connect(safetyLimiter);
  safetyLimiter.connect(safetyClipper);
  safetyClipper.connect(pass2Ctx.destination);`;
  
content = content.replace(pass2Old, pass2New);

// 3. TPDF Dither
const ditherOld = `    for (let j = 0; j < numOfChan; j++) {
      sample = Math.max(-1, Math.min(1, channels[j][i]));
      
      if (bitDepth === 32) {
        view.setFloat32(pos, sample, true);
        pos += 4;
      } else if (bitDepth === 24) {
        sample = sample < 0 ? sample * 8388608 : sample * 8388607;
        // Little-endian 24-bit requires writing 3 bytes manually
        view.setUint8(pos, sample & 0xff);
        view.setUint8(pos + 1, (sample >> 8) & 0xff);
        view.setUint8(pos + 2, (sample >> 16) & 0xff);
        pos += 3;
      } else {
        sample = sample < 0 ? sample * 32768 : sample * 32767;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
    }`;

const ditherNew = `    for (let j = 0; j < numOfChan; j++) {
      let sample = channels[j][i];
      
      // Professional TPDF (Triangular Probability Density Function) Dither for Quantization
      if (bitDepth < 32) {
         // LSB for targeted bit depth
         const ditherAmount = Math.pow(2, -(bitDepth - 1));
         const rand1 = (Math.random() * 2 - 1) * ditherAmount;
         const rand2 = (Math.random() * 2 - 1) * ditherAmount;
         sample += (rand1 - rand2); // Triangular distribution
      }
      
      sample = Math.max(-1, Math.min(1, sample));
      
      if (bitDepth === 32) {
        view.setFloat32(pos, sample, true);
        pos += 4;
      } else if (bitDepth === 24) {
        sample = sample < 0 ? sample * 8388608 : sample * 8388607;
        sample = Math.round(sample); // Quantize after dither
        // Little-endian 24-bit requires writing 3 bytes manually
        view.setUint8(pos, sample & 0xff);
        view.setUint8(pos + 1, (sample >> 8) & 0xff);
        view.setUint8(pos + 2, (sample >> 16) & 0xff);
        pos += 3;
      } else {
        sample = sample < 0 ? sample * 32768 : sample * 32767;
        sample = Math.round(sample); // Quantize after dither
        view.setInt16(pos, sample, true);
        pos += 2;
      }
    }`;
content = content.replace(ditherOld, ditherNew);

fs.writeFileSync('src/lib/audio.ts', content);
