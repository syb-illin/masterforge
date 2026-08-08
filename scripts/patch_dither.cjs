const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const ditherOld = `    for (let j = 0; j < numOfChan; j++) {
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

const loopInitOld = `  for (i = 0; i < abuffer.length; i++) {`;
const loopInitNew = `  // Noise shaping error buffers
  const errBuffer = Array.from({ length: numOfChan }, () => new Float32Array(4));
  
  for (i = 0; i < abuffer.length; i++) {`;

content = content.replace(loopInitOld, loopInitNew);

const ditherNew = `    for (let j = 0; j < numOfChan; j++) {
      let sample = channels[j][i];
      
      if (bitDepth < 32) {
         // MBIT+ Style Psychoacoustic Noise Shaping (3rd Order)
         const shapingError = 2.033 * errBuffer[j][0] - 1.483 * errBuffer[j][1] + 0.450 * errBuffer[j][2];
         sample += shapingError;
         
         const LSB = Math.pow(2, -(bitDepth - 1));
         const rand1 = (Math.random() * 2 - 1) * LSB;
         const rand2 = (Math.random() * 2 - 1) * LSB;
         sample += (rand1 - rand2); // TPDF Dither
      }
      
      sample = Math.max(-1, Math.min(1, sample));
      
      if (bitDepth === 32) {
        view.setFloat32(pos, sample, true);
        pos += 4;
      } else if (bitDepth === 24) {
        const factor = 8388607;
        let preQuant = sample * factor;
        let quantized = Math.round(preQuant);
        
        // Update error history
        const err = (preQuant - quantized) / factor;
        errBuffer[j][2] = errBuffer[j][1];
        errBuffer[j][1] = errBuffer[j][0];
        errBuffer[j][0] = err;
        
        if (quantized < -8388608) quantized = -8388608;
        if (quantized > 8388607) quantized = 8388607;
        
        let writeVal = quantized < 0 ? quantized + 16777216 : quantized;
        view.setUint8(pos, writeVal & 0xff);
        view.setUint8(pos + 1, (writeVal >> 8) & 0xff);
        view.setUint8(pos + 2, (writeVal >> 16) & 0xff);
        pos += 3;
      } else {
        const factor = 32767;
        let preQuant = sample * factor;
        let quantized = Math.round(preQuant);
        
        const err = (preQuant - quantized) / factor;
        errBuffer[j][2] = errBuffer[j][1];
        errBuffer[j][1] = errBuffer[j][0];
        errBuffer[j][0] = err;
        
        if (quantized < -32768) quantized = -32768;
        if (quantized > 32767) quantized = 32767;
        
        view.setInt16(pos, quantized, true);
        pos += 2;
      }
    }`;

content = content.replace(ditherOld, ditherNew);

const reportOld = "leveling: `SSL-Style VCA Bus Compressor applied for gentle mix glue. Transparent Multi-Stage True Peak Limiting (8x Oversampled, Soft-Knee Transient Shaping + ISP Brickwall) targeting ${targetLufs} LUFS. True Peak ceiling set at ${targetTruePeak.toFixed(1)} dBTP. TPDF Dither applied on export.`,";
const reportNew = "leveling: `Intelligent Release Control (IRC V Style): SSL VCA Glue compression followed by Transparent Multi-Stage True Peak Limiting (8x Oversampled, Soft-Knee Transient Shaping + ISP Brickwall) targeting ${targetLufs} LUFS. True Peak ceiling set at ${targetTruePeak.toFixed(1)} dBTP. Psychoacoustic Noise-Shaped Dither (MBIT+ style) applied on export.`,";
content = content.replace(reportOld, reportNew);

fs.writeFileSync('src/lib/audio.ts', content);
