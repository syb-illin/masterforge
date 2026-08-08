const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const calculateLufsOld = `async function calculateLUFS(buffer: AudioBuffer): Promise<number> {
  // @ts-ignore
  const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new OfflineCtx(buffer.numberOfChannels, buffer.length, buffer.sampleRate);
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  
  // BS.1770-4 Pre-filter 1: High shelf
  const highShelf = ctx.createBiquadFilter();
  highShelf.type = 'highshelf';
  highShelf.frequency.value = 1500;
  highShelf.gain.value = 4;
  highShelf.Q.value = 0.7071;

  // BS.1770-4 Pre-filter 2: High pass
  const highPass = ctx.createBiquadFilter();
  highPass.type = 'highpass';
  highPass.frequency.value = 38;
  highPass.Q.value = 0.5;
  
  source.connect(highShelf);
  highShelf.connect(highPass);
  highPass.connect(ctx.destination);
  source.start();
  
  const rendered = await ctx.startRendering();
  let totalPower = 0;
  
  const CHUNK_SIZE = 48000 * 2;
  
  // To estimate LRA, we calculate short-term blocks (3s blocks, 2s overlap -> 1s hop)
  const hopSize = buffer.sampleRate;
  const blockLength = buffer.sampleRate * 3;
  const shortTermPowers = [];
  
  const channelPowers = [];

  for (let c = 0; c < rendered.numberOfChannels; c++) {
    const data = rendered.getChannelData(c);
    let channelPowerSum = 0;
    channelPowers.push(data);
    
    for (let pos = 0; pos < data.length; pos += CHUNK_SIZE) {
      const end = Math.min(pos + CHUNK_SIZE, data.length);
      for (let i = pos; i < end; i++) {
        channelPowerSum += data[i] * data[i];
      }
      await yieldThread();
    }
    
    const meanPower = channelPowerSum / data.length;
    totalPower += meanPower;
  }
  
  // Calculate LRA
  for (let pos = 0; pos < buffer.length - blockLength; pos += hopSize) {
    let blockPower = 0;
    for (let c = 0; c < rendered.numberOfChannels; c++) {
      let sum = 0;
      for (let i = pos; i < pos + blockLength; i++) {
        sum += channelPowers[c][i] * channelPowers[c][i];
      }
      blockPower += sum / blockLength;
    }
    if (blockPower > 0) shortTermPowers.push(-0.691 + 10 * Math.log10(blockPower));
  }
  
  let lra = 0;
  if (shortTermPowers.length > 5) {
     shortTermPowers.sort((a,b) => a-b);
     const low = shortTermPowers[Math.floor(shortTermPowers.length * 0.10)];
     const high = shortTermPowers[Math.floor(shortTermPowers.length * 0.95)];
     lra = high - low;
  }
  
  const lufs = totalPower === 0 ? -70 : -0.691 + 10 * Math.log10(totalPower);
  return { lufs, lra };
}`;

// need to replace calculateLUFS signature
// Since we don't know exact lines easily we'll use regex to replace the whole function
const regex = /async function calculateLUFS[\s\S]*?return -0\.691 \+ 10 \* Math\.log10\(totalPower\);\n\}/m;

content = content.replace(regex, calculateLufsOld);

// And update the callers
content = content.replace(/const pass1Lufs = await calculateLUFS\(pass1Buffer\);/g, "const { lufs: pass1Lufs } = await calculateLUFS(pass1Buffer);");

content = content.replace(/const lufs = await calculateLUFS\(buffer\);/g, "const { lufs, lra } = await calculateLUFS(buffer);");

// we need to return lra from analyzeAudio
content = content.replace(/return \{ rms, lufs, peak, crestFactor, zcr, centroid, flatness, rolloff, stereoWidth, correlation, eqOffsets, midEqOffsets, sideEqOffsets, dynEqAmount, lowEnergyPct, midEnergyPct, highEnergyPct \};/g, 
  "return { rms, lufs, peak, crestFactor, zcr, centroid, flatness, rolloff, stereoWidth, correlation, eqOffsets, midEqOffsets, sideEqOffsets, dynEqAmount, lowEnergyPct, midEnergyPct, highEnergyPct, lra };");

fs.writeFileSync('src/lib/audio.ts', content);
