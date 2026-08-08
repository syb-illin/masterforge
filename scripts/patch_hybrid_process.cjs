const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const analyzeStart = content.indexOf('async function analyzeAudio');
if (analyzeStart === -1) process.exit(1);

const analyzeEnd = content.indexOf('async function calculateLUFS');
if (analyzeEnd === -1) process.exit(1);

let newAnalyze = `async function analyzeAudio(buffer: AudioBuffer, onProgress?: (step: string, progress: number) => void) {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  
  let peak = 0;
  const isStereo = channels === 2;
  
  const monoData = new Float32Array(length);
  const sideData = new Float32Array(length);
  
  let lSum = 0, rSum = 0, lrSum = 0;
  
  if (isStereo) {
    const lData = buffer.getChannelData(0);
    const rData = buffer.getChannelData(1);
    for (let i = 0; i < length; i++) {
       const l = lData[i];
       const r = rData[i];
       monoData[i] = (l + r) * 0.5;
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
       monoData[i] = data[i];
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
  
  const avgMonoSpectrum = new Float32Array(numBins);
  const avgSideSpectrum = new Float32Array(numBins);
  const varMonoSpectrum = new Float32Array(numBins);
  
  let pos = 0;
  let yieldCounter = 0;
  
  while (pos + BUFFER_SIZE <= length) {
    const chunkMono = monoData.subarray(pos, pos + BUFFER_SIZE);
    const monoFeatures = Meyda.extract(['rms', 'zcr', 'spectralCentroid', 'spectralFlatness', 'spectralRolloff', 'amplitudeSpectrum'], chunkMono);
    
    if (monoFeatures && monoFeatures.amplitudeSpectrum) {
       rmsSum += (monoFeatures.rms as number) * (monoFeatures.rms as number);
       zcrSum += (monoFeatures.zcr as number);
       centroidSum += (monoFeatures.spectralCentroid as number);
       flatnessSum += (monoFeatures.spectralFlatness as number);
       rolloffSum += (monoFeatures.spectralRolloff as number);
       
       const spec = monoFeatures.amplitudeSpectrum as Float32Array;
       for (let i = 0; i < numBins; i++) {
          avgMonoSpectrum[i] += spec[i];
          varMonoSpectrum[i] += spec[i] * spec[i];
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
      avgMonoSpectrum[i] /= validChunks;
      if (isStereo) avgSideSpectrum[i] /= validChunks;
      varMonoSpectrum[i] = Math.sqrt(Math.abs(varMonoSpectrum[i] / validChunks - avgMonoSpectrum[i]*avgMonoSpectrum[i])); // std dev
  }
  
  const eqFrequencies = [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000];
  const eqOffsets = new Float32Array(31);
  const sideEqOffsets = new Float32Array(31);
  const midEqOffsets = new Float32Array(31); // To keep TS happy
  const dynEqAmount = new Float32Array(31);
  
  const sampleRate = buffer.sampleRate;
  let monoSumDb = 0;
  let sideSumDb = 0;
  
  for (let b = 0; b < 31; b++) {
    const freq = eqFrequencies[b];
    const lowFreq = freq * Math.pow(2, -1/6);
    const highFreq = freq * Math.pow(2, 1/6);
    
    const lowBin = Math.max(1, Math.floor((lowFreq / (sampleRate/2)) * numBins));
    const highBin = Math.min(numBins - 1, Math.ceil((highFreq / (sampleRate/2)) * numBins));
    
    let monoEnergy = 0;
    let sideEnergy = 0;
    let monoVar = 0;
    
    for (let i = lowBin; i <= highBin; i++) {
      monoEnergy += avgMonoSpectrum[i];
      sideEnergy += avgSideSpectrum[i];
      monoVar += varMonoSpectrum[i];
    }
    const binsInBand = Math.max(1, (highBin - lowBin + 1));
    const avgMono = monoEnergy / binsInBand;
    const avgSide = sideEnergy / binsInBand;
    const avgVar = monoVar / binsInBand;
    
    const targetEnergy = 1.0 / Math.sqrt(freq); // Pink noise slope
    const targetDb = 20 * Math.log10(targetEnergy);
    
    const currentMonoDb = 20 * Math.log10(Math.max(1e-6, avgMono));
    const currentSideDb = 20 * Math.log10(Math.max(1e-6, avgSide));
    
    // Calculate Stereo EQ matching curve
    eqOffsets[b] = targetDb - currentMonoDb;
    
    // Calculate Side adjustments (for specific widening/mono-ing)
    const sideTargetDb = targetDb + (freq > 2500 ? 1.5 : (freq < 150 ? -6 : 0));
    sideEqOffsets[b] = sideTargetDb - currentSideDb;
    
    // Dynamic EQ is driven by high variance in specific bands (resonances or spikes)
    dynEqAmount[b] = Math.min(1.0, (avgVar / (avgMono + 1e-6)) * 0.5);
    
    monoSumDb += eqOffsets[b];
    sideSumDb += sideEqOffsets[b];
  }
  
  const monoAvgDb = monoSumDb / 31;
  const sideAvgDb = sideSumDb / 31;
  
  for (let b = 0; b < 31; b++) {
    eqOffsets[b] = Math.max(-6, Math.min(6, (eqOffsets[b] - monoAvgDb) * 0.5)); // General stereo EQ
    // Side EQ is used just as an exception
    sideEqOffsets[b] = Math.max(-12, Math.min(4, (sideEqOffsets[b] - sideAvgDb) * 0.4));
    if (eqFrequencies[b] < 125) {
        sideEqOffsets[b] = -12; // Mono the low end
    }
    midEqOffsets[b] = 0; // Not heavily used now, stereo handles it
  }

  return { rms, lufs, peak, crestFactor, zcr, centroid, flatness, rolloff, stereoWidth, correlation, eqOffsets, midEqOffsets, sideEqOffsets, dynEqAmount };
}
`;

content = content.substring(0, analyzeStart) + newAnalyze + content.substring(analyzeEnd);

// Replace processing EQ logic
const eqStart = content.indexOf('// 2. Detailed 31-Band Parametric EQ & Dynamic Processing');
const eqEnd = content.indexOf('// 3. Multi-Band Tape Saturation');

if (eqStart === -1 || eqEnd === -1) {
    console.error("Could not find eq logic boundaries");
    process.exit(1);
}

let newEqLogic = `// 2. Detailed 31-Band Stereo Parametric EQ & M/S Exceptions
  onProgress('Applying FabFilter-style Hybrid Stereo & M/S EQ', 30);
  await yieldToMain();
  
  const eqFrequencies = [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000];
  let msOutputNode: AudioNode;

  // First, apply Stereo EQ
  let prevStereoNode: AudioNode = gainNode;
  for (let i = 0; i < eqFrequencies.length; i++) {
     const band = offlineCtx.createBiquadFilter();
     band.type = 'peaking';
     band.frequency.value = eqFrequencies[i];
     band.Q.value = 4.31;
     band.gain.value = stats.eqOffsets[i];
     prevStereoNode.connect(band);
     prevStereoNode = band;
  }

  // Dynamic EQ on the main stereo bus to tame resonances
  const lowDyn = offlineCtx.createBiquadFilter(); lowDyn.type = 'lowpass'; lowDyn.frequency.value = 250;
  const midDyn1 = offlineCtx.createBiquadFilter(); midDyn1.type = 'highpass'; midDyn1.frequency.value = 250;
  const midDyn2 = offlineCtx.createBiquadFilter(); midDyn2.type = 'lowpass'; midDyn2.frequency.value = 5000;
  const highDyn = offlineCtx.createBiquadFilter(); highDyn.type = 'highpass'; highDyn.frequency.value = 5000;
  
  const lowComp = offlineCtx.createDynamicsCompressor();
  lowComp.threshold.value = -30; lowComp.ratio.value = 1.2 + (stats.dynEqAmount[5] * 2);
  
  const midComp = offlineCtx.createDynamicsCompressor();
  midComp.threshold.value = -25; midComp.ratio.value = 1.2 + (stats.dynEqAmount[15] * 2);
  
  const highComp = offlineCtx.createDynamicsCompressor();
  highComp.threshold.value = -35; highComp.ratio.value = 1.2 + (stats.dynEqAmount[26] * 3);
  
  prevStereoNode.connect(lowDyn); lowDyn.connect(lowComp);
  prevStereoNode.connect(midDyn1); midDyn1.connect(midDyn2); midDyn2.connect(midComp);
  prevStereoNode.connect(highDyn); highDyn.connect(highComp);
  
  const dynSum = offlineCtx.createGain();
  lowComp.connect(dynSum);
  midComp.connect(dynSum);
  highComp.connect(dynSum);

  if (audioBuffer.numberOfChannels === 2) {
    // M/S processing for exceptions (e.g. centering bass, widening highs)
    const splitter = offlineCtx.createChannelSplitter(2);
    const merger = offlineCtx.createChannelMerger(2);
    
    const lIn = offlineCtx.createGain();
    const rIn = offlineCtx.createGain();
    const midGain = offlineCtx.createGain(); midGain.gain.value = 0.5;
    const sideGain = offlineCtx.createGain(); sideGain.gain.value = 0.5;
    const rInv = offlineCtx.createGain(); rInv.gain.value = -1;
    
    dynSum.connect(splitter);
    splitter.connect(lIn, 0);
    splitter.connect(rIn, 1);
    
    // Mid = L+R
    lIn.connect(midGain);
    rIn.connect(midGain);
    
    // Side = L-R
    lIn.connect(sideGain);
    rIn.connect(rInv);
    rInv.connect(sideGain);
    
    // Apply Side-specific EQ (widening, monoing low end)
    let prevSide: AudioNode = sideGain;
    for (let i = 0; i < eqFrequencies.length; i++) {
       // Only apply significant side EQ
       if (Math.abs(stats.sideEqOffsets[i]) > 1.0) {
           const band = offlineCtx.createBiquadFilter();
           band.type = 'peaking';
           band.frequency.value = eqFrequencies[i];
           band.Q.value = 4.31;
           band.gain.value = stats.sideEqOffsets[i];
           prevSide.connect(band);
           prevSide = band;
       }
    }
    
    const lOut = offlineCtx.createGain();
    const rOut = offlineCtx.createGain();
    
    midGain.connect(lOut);
    prevSide.connect(lOut);
    
    midGain.connect(rOut);
    const sideInvOut = offlineCtx.createGain();
    sideInvOut.gain.value = -1;
    prevSide.connect(sideInvOut);
    sideInvOut.connect(rOut);
    
    lOut.connect(merger, 0, 0);
    rOut.connect(merger, 0, 1);
    
    msOutputNode = merger;
  } else {
    msOutputNode = dynSum;
  }

  `;

content = content.substring(0, eqStart) + newEqLogic + content.substring(eqEnd);
fs.writeFileSync('src/lib/audio.ts', content);
