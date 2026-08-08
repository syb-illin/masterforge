const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regex1 = /const dynEqAmount = new Float32Array\(31\);\s*const sampleRate = buffer.sampleRate;/m;
const replace1 = `const dynEqAmount = new Float32Array(31);
  
  // Calculate band energies
  let lowEnergy = 0;
  let midEnergy = 0;
  let highEnergy = 0;
  let totalEnergy = 0;
  
  for (let i = 0; i < numBins; i++) {
     const freq = i * (buffer.sampleRate / 2) / numBins;
     const energy = avgMonoSpectrum[i];
     totalEnergy += energy;
     if (freq < 250) lowEnergy += energy;
     else if (freq < 4000) midEnergy += energy;
     else highEnergy += energy;
  }
  
  const lowEnergyPct = totalEnergy > 0 ? (lowEnergy / totalEnergy) * 100 : 0;
  const midEnergyPct = totalEnergy > 0 ? (midEnergy / totalEnergy) * 100 : 0;
  const highEnergyPct = totalEnergy > 0 ? (highEnergy / totalEnergy) * 100 : 0;

  const sampleRate = buffer.sampleRate;`;

content = content.replace(regex1, replace1);

const regex2 = /return \{ rms, lufs, peak, crestFactor, zcr, centroid, flatness, rolloff, stereoWidth, correlation, eqOffsets, midEqOffsets, sideEqOffsets, dynEqAmount \};/m;
const replace2 = `return { rms, lufs, peak, crestFactor, zcr, centroid, flatness, rolloff, stereoWidth, correlation, eqOffsets, midEqOffsets, sideEqOffsets, dynEqAmount, lowEnergyPct, midEnergyPct, highEnergyPct };`;

content = content.replace(regex2, replace2);
fs.writeFileSync('src/lib/audio.ts', content);
