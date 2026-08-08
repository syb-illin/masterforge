const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const analyzeStart = content.indexOf('async function analyzeAudio');
if (analyzeStart === -1) {
    console.error("Could not find analyzeAudio");
    process.exit(1);
}
const analyzeEnd = content.indexOf('async function calculateLUFS');

let newAnalyze = `async function analyzeAudio(buffer: AudioBuffer, onProgress?: (step: string, progress: number) => void) {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  
  let peak = 0;
  const isStereo = channels === 2;
  
  const midData = new Float32Array(length);
  const sideData = new Float32Array(length);
  
  let lSum = 0, rSum = 0, lrSum = 0;
  
  if (isStereo) {
    const lData = buffer.getChannelData(0);
    const rData = buffer.getChannelData(1);
    for (let i = 0; i < length; i++) {
       const l = lData[i];
       const r = rData[i];
       midData[i] = (l + r) * 0.5;
       sideData[i] = (l - r) * 0.5;
       
       lSum += l * l;
       rSum += r * r;
       lrSum += l * r;
       
       const absL = Math.abs(l);
       const absR = Math.abs(r);
       if (absL > peak) peak = absL;
       if (absR > peak) peak = absR;
    }
  } else {
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
       midData[i] = data[i];
       sideData[i] = 0;
       
       const absVal = Math.abs(data[i]);
       if (absVal > peak) peak = absVal;
    }
  }

  const BUFFER_SIZE = 8192;
  Meyda.bufferSize = BUFFER_SIZE;
  Meyda.windowingFunction = 'hanning';
  const numBins = BUFFER_SIZE / 2;
  
  let rmsSum = 0, zcrSum = 0, centroidSum = 0, flatnessSum = 0, rolloffSum = 0;
  let validChunks = 0;
  
  const avgMidSpectrum = new Float32Array(numBins);
  const avgSideSpectrum = new Float32Array(numBins);
  const varMidSpectrum = new Float32Array(numBins);
  
  let pos = 0;
  let yieldCounter = 0;
  
  while (pos + BUFFER_SIZE <= length) {
    const chunkMid = midData.subarray(pos, pos + BUFFER_SIZE);
    const midFeatures = Meyda.extract(['rms', 'zcr', 'spectralCentroid', 'spectralFlatness', 'spectralRolloff', 'amplitudeSpectrum'], chunkMid);
    
    if (midFeatures && midFeatures.amplitudeSpectrum) {
       rmsSum += (midFeatures.rms as number) * (midFeatures.rms as number);
       zcrSum += (midFeatures.zcr as number);
       centroidSum += (midFeatures.spectralCentroid as number);
       flatnessSum += (midFeatures.spectralFlatness as number);
       rolloffSum += (midFeatures.spectralRolloff as number);
       
       const spec = midFeatures.amplitudeSpectrum as Float32Array;
       for (let i = 0; i < numBins; i++) {
          avgMidSpectrum[i] += spec[i];
          varMidSpectrum[i] += spec[i] * spec[i];
       }
       validChunks++;
    }
    
    if (isStereo) {
       const chunkSide = sideData.subarray(pos, pos + BUFFER_SIZE);
       const sideFeatures = Meyda.extract(['amplitudeSpectrum'], chunkSide);
       if (sideFeatures && sideFeatures.amplitudeSpectrum) {
          const spec = sideFeatures.amplitudeSpectrum as Float32Array;
          for (let i = 0; i < numBins; i++) {
             avgSideSpectrum[i] += spec[i];
          }
       }
    }
    
    pos += BUFFER_SIZE;
    yieldCounter++;
    if (yieldCounter % 15 === 0) {
      if (onProgress) onProgress('Deep Spectral & Phase Analysis', 10 + (pos / length) * 15);
      await yieldThread();
    }
  }

  const rms = Math.sqrt(rmsSum / validChunks) || 0.0001;
  const lufs = await calculateLUFS(buffer);
  const crestFactor = peak / rms;
  const zcr = zcrSum / validChunks / (BUFFER_SIZE / 2); 
  const centroid = centroidSum / validChunks;
  const flatness = flatnessSum / validChunks;
  const rolloff = rolloffSum / validChunks;
  
  const correlation = isStereo ? (lrSum / (Math.sqrt(lSum * rSum) || 1)) : 1;
  const stereoWidth = isStereo ? 1 - correlation : 0;
  
  for (let i = 0; i < numBins; i++) {
      avgMidSpectrum[i] /= validChunks;
      if (isStereo) avgSideSpectrum[i] /= validChunks;
      varMidSpectrum[i] = Math.sqrt(Math.abs(varMidSpectrum[i] / validChunks - avgMidSpectrum[i]*avgMidSpectrum[i])); // std dev
  }
  
  const eqFrequencies = [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000];
  const midEqOffsets = new Float32Array(31);
  const sideEqOffsets = new Float32Array(31);
  const dynEqAmount = new Float32Array(31);
  
  const sampleRate = buffer.sampleRate;
  let midSumDb = 0;
  let sideSumDb = 0;
  
  for (let b = 0; b < 31; b++) {
    const freq = eqFrequencies[b];
    const lowFreq = freq * Math.pow(2, -1/6);
    const highFreq = freq * Math.pow(2, 1/6);
    
    const lowBin = Math.max(1, Math.floor((lowFreq / (sampleRate/2)) * numBins));
    const highBin = Math.min(numBins - 1, Math.ceil((highFreq / (sampleRate/2)) * numBins));
    
    let midEnergy = 0;
    let sideEnergy = 0;
    let midVar = 0;
    
    for (let i = lowBin; i <= highBin; i++) {
      midEnergy += avgMidSpectrum[i];
      sideEnergy += avgSideSpectrum[i];
      midVar += varMidSpectrum[i];
    }
    const binsInBand = Math.max(1, (highBin - lowBin + 1));
    const avgMid = midEnergy / binsInBand;
    const avgSide = sideEnergy / binsInBand;
    const avgVar = midVar / binsInBand;
    
    const targetEnergy = 1.0 / Math.sqrt(freq); // Pink noise slope
    const targetDb = 20 * Math.log10(targetEnergy);
    
    const currentMidDb = 20 * Math.log10(Math.max(1e-6, avgMid));
    const currentSideDb = 20 * Math.log10(Math.max(1e-6, avgSide));
    
    midEqOffsets[b] = targetDb - currentMidDb;
    const sideTargetDb = targetDb + (freq > 2000 ? 1.5 : (freq < 200 ? -4 : 0));
    sideEqOffsets[b] = sideTargetDb - currentSideDb;
    
    dynEqAmount[b] = Math.min(1.0, (avgVar / (avgMid + 1e-6)) * 0.5);
    
    midSumDb += midEqOffsets[b];
    sideSumDb += sideEqOffsets[b];
  }
  
  const midAvgDb = midSumDb / 31;
  const sideAvgDb = sideSumDb / 31;
  
  for (let b = 0; b < 31; b++) {
    midEqOffsets[b] = Math.max(-8, Math.min(6, (midEqOffsets[b] - midAvgDb) * 0.6));
    sideEqOffsets[b] = Math.max(-10, Math.min(6, (sideEqOffsets[b] - sideAvgDb) * 0.5));
    if (eqFrequencies[b] < 100) sideEqOffsets[b] = Math.max(-12, sideEqOffsets[b] - 6);
  }

  // To keep compatibility with AudioReport interface
  const eqOffsets = midEqOffsets;

  return { rms, lufs, peak, crestFactor, zcr, centroid, flatness, rolloff, stereoWidth, correlation, eqOffsets, midEqOffsets, sideEqOffsets, dynEqAmount };
}
`;

content = content.substring(0, analyzeStart) + newAnalyze + content.substring(analyzeEnd);


// Now replace the EQ section in processAudio
const eqStart = content.indexOf('// 2. Detailed 31-Band Parametric EQ');
const eqEnd = content.indexOf('// 3. Multi-Band Tape Saturation (Analog Warmth)');

if (eqStart === -1 || eqEnd === -1) {
    console.error("Could not find eq logic boundaries");
    process.exit(1);
}

let newEqLogic = `// 2. Detailed 31-Band Parametric EQ & Dynamic Processing
  onProgress('Applying FabFilter-style Mid/Side Dynamic EQ', 30);
  await yieldToMain();
  
  const eqFrequencies = [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000];
  let msOutputNode: AudioNode;

  if (audioBuffer.numberOfChannels === 2) {
    const splitter = offlineCtx.createChannelSplitter(2);
    const merger = offlineCtx.createChannelMerger(2);
    
    const lIn = offlineCtx.createGain();
    const rIn = offlineCtx.createGain();
    const midGain = offlineCtx.createGain(); midGain.gain.value = 0.5;
    const sideGain = offlineCtx.createGain(); sideGain.gain.value = 0.5;
    const rInv = offlineCtx.createGain(); rInv.gain.value = -1;
    
    gainNode.connect(splitter);
    splitter.connect(lIn, 0);
    splitter.connect(rIn, 1);
    
    // Mid = L+R
    lIn.connect(midGain);
    rIn.connect(midGain);
    
    // Side = L-R
    lIn.connect(sideGain);
    rIn.connect(rInv);
    rInv.connect(sideGain);
    
    let prevMid: AudioNode = midGain;
    for (let i = 0; i < eqFrequencies.length; i++) {
       const band = offlineCtx.createBiquadFilter();
       band.type = 'peaking';
       band.frequency.value = eqFrequencies[i];
       band.Q.value = 4.31;
       band.gain.value = stats.midEqOffsets[i];
       prevMid.connect(band);
       prevMid = band;
    }
    
    let prevSide: AudioNode = sideGain;
    for (let i = 0; i < eqFrequencies.length; i++) {
       const band = offlineCtx.createBiquadFilter();
       band.type = 'peaking';
       band.frequency.value = eqFrequencies[i];
       band.Q.value = 4.31;
       band.gain.value = stats.sideEqOffsets[i];
       prevSide.connect(band);
       prevSide = band;
    }
    
    // Multi-band Dynamic EQ on Mid
    const lowDyn = offlineCtx.createBiquadFilter(); lowDyn.type = 'lowpass'; lowDyn.frequency.value = 200;
    const midDyn1 = offlineCtx.createBiquadFilter(); midDyn1.type = 'highpass'; midDyn1.frequency.value = 200;
    const midDyn2 = offlineCtx.createBiquadFilter(); midDyn2.type = 'lowpass'; midDyn2.frequency.value = 4000;
    const highDyn = offlineCtx.createBiquadFilter(); highDyn.type = 'highpass'; highDyn.frequency.value = 4000;
    
    const lowComp = offlineCtx.createDynamicsCompressor();
    lowComp.threshold.value = -30; lowComp.ratio.value = 1.2 + (stats.dynEqAmount[5] * 2);
    
    const midComp = offlineCtx.createDynamicsCompressor();
    midComp.threshold.value = -25; midComp.ratio.value = 1.2 + (stats.dynEqAmount[15] * 2);
    
    const highComp = offlineCtx.createDynamicsCompressor();
    highComp.threshold.value = -35; highComp.ratio.value = 1.2 + (stats.dynEqAmount[25] * 3);
    
    prevMid.connect(lowDyn); lowDyn.connect(lowComp);
    prevMid.connect(midDyn1); midDyn1.connect(midDyn2); midDyn2.connect(midComp);
    prevMid.connect(highDyn); highDyn.connect(highComp);
    
    const midSum = offlineCtx.createGain();
    lowComp.connect(midSum);
    midComp.connect(midSum);
    highComp.connect(midSum);
    
    const lOut = offlineCtx.createGain();
    const rOut = offlineCtx.createGain();
    
    midSum.connect(lOut);
    prevSide.connect(lOut);
    
    midSum.connect(rOut);
    const sideInvOut = offlineCtx.createGain();
    sideInvOut.gain.value = -1;
    prevSide.connect(sideInvOut);
    sideInvOut.connect(rOut);
    
    lOut.connect(merger, 0, 0);
    rOut.connect(merger, 0, 1);
    
    msOutputNode = merger;
  } else {
    // Mono track fallback
    let prevEqNode: AudioNode = gainNode;
    for (let i = 0; i < eqFrequencies.length; i++) {
      const band = offlineCtx.createBiquadFilter();
      band.type = 'peaking';
      band.frequency.value = eqFrequencies[i];
      band.Q.value = 4.31;
      band.gain.value = stats.midEqOffsets[i];
      prevEqNode.connect(band);
      prevEqNode = band;
    }
    msOutputNode = prevEqNode;
  }

  `;

content = content.substring(0, eqStart) + newEqLogic + content.substring(eqEnd);


// Fix report text for EQ
const reportEqStart = content.indexOf('eq: `Adaptive 31-band spectral matching');
if (reportEqStart !== -1) {
  const reportEqEnd = content.indexOf('stereo: audioBuffer', reportEqStart);
  content = content.substring(0, reportEqStart) + "eq: `Pro-Q style exhaustive 31-band Mid/Side processing with target curve matching. Dynamic EQ (MB Comp) applied to tame transient spikes and resonances based on variance analysis.`,\n        " + content.substring(reportEqEnd);
}

// Add mid/side arrays to interface if not there
const ifaceStart = content.indexOf('eqOffsets: Float32Array;');
if (ifaceStart !== -1) {
  content = content.replace('eqOffsets: Float32Array;', 'eqOffsets: Float32Array;\n    midEqOffsets: Float32Array;\n    sideEqOffsets: Float32Array;\n    dynEqAmount: Float32Array;');
}

const objStart = content.indexOf('eqOffsets: stats.eqOffsets,');
if (objStart !== -1) {
  content = content.replace('eqOffsets: stats.eqOffsets,', 'eqOffsets: stats.eqOffsets,\n        midEqOffsets: stats.midEqOffsets,\n        sideEqOffsets: stats.sideEqOffsets,\n        dynEqAmount: stats.dynEqAmount,');
}

fs.writeFileSync('src/lib/audio.ts', content);
