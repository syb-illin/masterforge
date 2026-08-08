const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// Replace Pass 1 context setup
const pass1Old = `  const sampleRate = targets.exportSampleRate || 48000;
  const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    Math.ceil(audioBuffer.duration * sampleRate),
    sampleRate
  );`;

const pass1New = `  const targetSampleRate = targets.exportSampleRate || 48000;
  // 2x Internal Oversampling for Top-Notch Professional DSP (anti-aliasing and no EQ cramping)
  const sampleRate = targetSampleRate * 2; 
  const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    Math.ceil(audioBuffer.duration * sampleRate),
    sampleRate
  );`;

content = content.replace(pass1Old, pass1New);

// Replace Pass 2 context setup
const pass2Old = `  const pass2Ctx = new OfflineCtx2(pass1Buffer.numberOfChannels, pass1Buffer.length, pass1Buffer.sampleRate);`;

const pass2New = `  const pass2Ctx = new OfflineCtx2(pass1Buffer.numberOfChannels, pass1Buffer.length, pass1Buffer.sampleRate);`; // Pass 2 runs at the oversampled rate inherently because pass1Buffer is 96k

// After Pass 2 rendering, add downsampling Pass 3
const postPass2Old = `  onProgress('Post-Processing Analysis', 85);
  await yieldToMain();
  
  let finalStats = await analyzeAudio(renderedBuffer);`;

const postPass2New = `  onProgress('Anti-Aliasing Downsample (Pass 3)', 82);
  await yieldToMain();
  
  // Downsample back to target sample rate using Web Audio's native high-quality resampler
  const downsampleCtx = new OfflineCtx2(renderedBuffer.numberOfChannels, Math.ceil(renderedBuffer.duration * targetSampleRate), targetSampleRate);
  const downsampleSource = downsampleCtx.createBufferSource();
  downsampleSource.buffer = renderedBuffer;
  downsampleSource.connect(downsampleCtx.destination);
  downsampleSource.start();
  
  renderedBuffer = await downsampleCtx.startRendering();

  onProgress('Post-Processing Analysis', 85);
  await yieldToMain();
  
  let finalStats = await analyzeAudio(renderedBuffer);`;

content = content.replace(postPass2Old, postPass2New);

fs.writeFileSync('src/lib/audio.ts', content);
