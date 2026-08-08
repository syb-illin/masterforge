const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const oldLUFS = `  for (let c = 0; c < rendered.numberOfChannels; c++) {
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
  
  const lufs = totalPower === 0 ? -70 : -0.691 + 10 * Math.log10(totalPower);`;

const newLUFS = `  for (let c = 0; c < rendered.numberOfChannels; c++) {
    channelPowers.push(rendered.getChannelData(c));
  }
  
  // BS.1770-4 Gated Measurement (400ms blocks, 75% overlap)
  const gateBlockLength = Math.floor(buffer.sampleRate * 0.4);
  const gateHopSize = Math.floor(buffer.sampleRate * 0.1);
  const blockPowers = [];
  
  for (let pos = 0; pos < buffer.length - gateBlockLength; pos += gateHopSize) {
    let blockPower = 0;
    for (let c = 0; c < rendered.numberOfChannels; c++) {
      let sum = 0;
      for (let i = pos; i < pos + gateBlockLength; i++) {
        sum += channelPowers[c][i] * channelPowers[c][i];
      }
      blockPower += sum / gateBlockLength;
    }
    if (blockPower > 0) {
      const lufsBlock = -0.691 + 10 * Math.log10(blockPower);
      // Absolute gate: -70 LUFS
      if (lufsBlock >= -70) {
        blockPowers.push(blockPower);
      }
    }
  }
  
  let gatedTotalPower = 0;
  if (blockPowers.length > 0) {
    const avgPower = blockPowers.reduce((a, b) => a + b, 0) / blockPowers.length;
    const relativeThreshold = -0.691 + 10 * Math.log10(avgPower) - 10; // -10 LU relative gate
    
    const gatedBlocks = blockPowers.filter(p => (-0.691 + 10 * Math.log10(p)) >= relativeThreshold);
    gatedTotalPower = gatedBlocks.length > 0 ? gatedBlocks.reduce((a, b) => a + b, 0) / gatedBlocks.length : 0;
  }
  
  const lufs = gatedTotalPower === 0 ? -70 : -0.691 + 10 * Math.log10(gatedTotalPower);

  // Calculate LRA (3s blocks, 66% overlap)
  for (let pos = 0; pos < buffer.length - blockLength; pos += hopSize) {
    let blockPower = 0;
    for (let c = 0; c < rendered.numberOfChannels; c++) {
      let sum = 0;
      for (let i = pos; i < pos + blockLength; i++) {
        sum += channelPowers[c][i] * channelPowers[c][i];
      }
      blockPower += sum / blockLength;
    }
    if (blockPower > 0) {
      const lufsBlock = -0.691 + 10 * Math.log10(blockPower);
      if (lufsBlock >= -70) shortTermPowers.push(lufsBlock);
    }
  }
  
  let lra = 0;
  if (shortTermPowers.length > 5) {
     shortTermPowers.sort((a,b) => a-b);
     const low = shortTermPowers[Math.floor(shortTermPowers.length * 0.10)];
     const high = shortTermPowers[Math.floor(shortTermPowers.length * 0.95)];
     lra = high - low;
  }`;

content = content.replace(oldLUFS, newLUFS);
fs.writeFileSync('src/lib/audio.ts', content);
