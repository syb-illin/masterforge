const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const analyzeStart = content.indexOf('async function analyzeAudio');
if (analyzeStart === -1) process.exit(1);

const analyzeEnd = content.indexOf('async function calculateLUFS');
if (analyzeEnd === -1) process.exit(1);

let newAnalyze = `async function analyzeAudio(buffer: AudioBuffer, onProgress?: (step: string, progress: number) => void) {
  let peak = 0;
  let rmsSum = 0;
  let zcrSum = 0;
  let centroidSum = 0;
  let flatnessSum = 0;
  let rolloffSum = 0;
  let validChunks = 0;
  
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  let lSum = 0, rSum = 0, lrSum = 0;
  
  const BUFFER_SIZE = 8192;
  Meyda.bufferSize = BUFFER_SIZE;
  Meyda.windowingFunction = 'hanning';
  const numBins = BUFFER_SIZE / 2;
  const avgSpectrum = new Float32Array(numBins);
  
  // Mixdown to mono for spectral analysis to save time
  const monoData = new Float32Array(length);
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      monoData[i] += data[i] / channels;
      const absVal = Math.abs(data[i]);
      if (absVal > peak) peak = absVal;
    }
  }
  let pos = 0;
  let yieldCounter = 0;
  while (pos + BUFFER_SIZE <= length) {
    const chunk = monoData.subarray(pos, pos + BUFFER_SIZE);
    const features = Meyda.extract(['rms', 'zcr', 'spectralCentroid', 'spectralFlatness', 'spectralRolloff', 'amplitudeSpectrum'], chunk);
    
    if (features && features.amplitudeSpectrum) {
       rmsSum += (features.rms as number) * (features.rms as number);
       zcrSum += (features.zcr as number);
       centroidSum += (features.spectralCentroid as number);
       flatnessSum += (features.spectralFlatness as number);
       rolloffSum += (features.spectralRolloff as number);
       const spec = features.amplitudeSpectrum as Float32Array;
       for (let i = 0; i < numBins; i++) avgSpectrum[i] += spec[i];
       validChunks++;
    }
    
    pos += BUFFER_SIZE;
    yieldCounter++;
    if (yieldCounter % 20 === 0) {
      await yieldThread();
    }
  }

  if (channels === 2) {
    const lData = buffer.getChannelData(0);
    const rData = buffer.getChannelData(1);
    
    let pos = 0;
    const CHUNK_SIZE = 48000 * 2;
    while (pos < length) {
      const end = Math.min(length, pos + CHUNK_SIZE);
      for (let i = pos; i < end; i++) {
        lSum += lData[i] * lData[i];
        rSum += rData[i] * rData[i];
        lrSum += lData[i] * rData[i];
      }
      pos = end;
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
  
  const correlation = channels === 2 ? (lrSum / (Math.sqrt(lSum * rSum) || 1)) : 1;
  const stereoWidth = channels === 2 ? 1 - correlation : 0;
  
  for (let i = 0; i < numBins; i++) avgSpectrum[i] /= validChunks;
  
  // Calculate 31-band EQ offsets based on Pink Noise target
  const eqOffsets = new Float32Array(31);
  const eqFrequencies = [20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000, 10000, 12500, 16000, 20000];
  const sampleRate = buffer.sampleRate;
  
  for (let b = 0; b < 31; b++) {
    const freq = eqFrequencies[b];
    // band width is roughly 1/3 octave
    const lowFreq = freq * Math.pow(2, -1/6);
    const highFreq = freq * Math.pow(2, 1/6);
    
    const lowBin = Math.max(1, Math.floor((lowFreq / (sampleRate/2)) * numBins));
    const highBin = Math.min(numBins - 1, Math.ceil((highFreq / (sampleRate/2)) * numBins));
    
    let energy = 0;
    for (let i = lowBin; i <= highBin; i++) {
      energy += avgSpectrum[i];
    }
    const avgEnergy = energy / Math.max(1, (highBin - lowBin + 1));
    
    // Pink noise falls off at 3dB per octave.
    // Normalized pink target energy at this freq (very rough approximation):
    // E_target = K / sqrt(freq)
    const targetEnergy = 1.0 / Math.sqrt(freq);
    
    // We compare log energies to get dB diff
    const currentDb = 20 * Math.log10(Math.max(1e-6, avgEnergy));
    const targetDb = 20 * Math.log10(targetEnergy);
    
    eqOffsets[b] = targetDb - currentDb;
  }
  
  // Normalize EQ offsets so average is 0 (we handle overall volume with gain staging)
  let sumDb = 0;
  for (let b = 0; b < 31; b++) sumDb += eqOffsets[b];
  const avgDb = sumDb / 31;
  for (let b = 0; b < 31; b++) {
    // Clamp EQ cuts/boosts to a safe range, e.g. -6dB to +6dB to avoid artifacts.
    // For Music platforms we might allow more dynamic EQ.
    eqOffsets[b] = Math.max(-6, Math.min(6, (eqOffsets[b] - avgDb) * 0.4)); // 0.4 is strength ratio (less aggressive)
  }

  return { rms, lufs, peak, crestFactor, zcr, centroid, flatness, rolloff, stereoWidth, correlation, eqOffsets };
}
`;

content = content.substring(0, analyzeStart) + newAnalyze + content.substring(analyzeEnd);
fs.writeFileSync('src/lib/audio.ts', content);
