const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const oldWavFunc = /async function bufferToWav24Bit[\s\S]*?return new Blob\(\[buffer\], \{ type: 'audio\/wav' \}\);\n\}/m;

const newWavFunc = `async function bufferToWav(abuffer: AudioBuffer, bitDepth: number, onProgress?: (step: string, progress: number) => void): Promise<Blob> {
  let numOfChan = abuffer.numberOfChannels,
    bytesPerSample = bitDepth === 32 ? 4 : bitDepth === 24 ? 3 : 2,
    length = abuffer.length * numOfChan * bytesPerSample + 44,
    buffer = new ArrayBuffer(length),
    view = new DataView(buffer),
    channels: Float32Array[] = [],
    i,
    sample,
    offset = 0,
    pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(bitDepth === 32 ? 3 : 1); // 3=IEEE Float, 1=PCM
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * bytesPerSample * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * bytesPerSample); // block-align
  setUint16(bitDepth); // 16-bit, 24-bit or 32-bit

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  // Write interleaved data
  for (i = 0; i < abuffer.length; i++) {
    if (i % 44100 === 0 && onProgress) {
      onProgress('Encoding WAV', 95 + (i / abuffer.length) * 5);
    }
    
    for (let j = 0; j < numOfChan; j++) {
      sample = Math.max(-1, Math.min(1, channels[j][i]));
      
      if (bitDepth === 32) {
        view.setFloat32(pos, sample, true);
        pos += 4;
      } else if (bitDepth === 24) {
        sample = sample < 0 ? sample * 8388608 : sample * 8388607;
        view.setInt32(pos, sample, true);
        // Little-endian 24-bit requires writing 3 bytes manually
        // Since we wrote 32-bit, we just drop the MSB (which is at pos+3 in little endian)
        // Actually it's easier to just write 3 bytes:
        view.setUint8(pos, sample & 0xff);
        view.setUint8(pos + 1, (sample >> 8) & 0xff);
        view.setUint8(pos + 2, (sample >> 16) & 0xff);
        pos += 3;
      } else {
        sample = sample < 0 ? sample * 32768 : sample * 32767;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}`;

content = content.replace(oldWavFunc, newWavFunc);

// Update calls to bufferToWav24Bit
content = content.replace(/bufferToWav24Bit\((\w+), onProgress\)/g, "bufferToWav($1, targets.exportBitDepth || 24, onProgress)");

content = content.replace(/const wavBlob = await bufferToWav24Bit\(renderedBuffer, onProgress\);/g, "const wavBlob = await bufferToWav(renderedBuffer, targets.exportBitDepth || 24, onProgress);");

// Let's make sure it updates the targets interface
content = content.replace(
  "targets: { profile: string, targetLufs?: number, targetTruePeak?: number, referenceStats?: any },",
  "targets: { profile: string, targetLufs?: number, targetTruePeak?: number, referenceStats?: any, exportSampleRate?: number, exportBitDepth?: number },"
);

// We need to use exportSampleRate when creating OfflineAudioContext
content = content.replace(
  "const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);",
  "const targetSampleRate = targets.exportSampleRate || audioBuffer.sampleRate;\n  const targetLength = Math.floor(audioBuffer.duration * targetSampleRate);\n  const offlineCtx = new OfflineAudioContext(audioBuffer.numberOfChannels, targetLength, targetSampleRate);"
);
// Also for pass2
content = content.replace(
  "const offlineCtx2 = new OfflineAudioContext(renderedBuffer.numberOfChannels, renderedBuffer.length, renderedBuffer.sampleRate);",
  "const offlineCtx2 = new OfflineAudioContext(renderedBuffer.numberOfChannels, renderedBuffer.length, renderedBuffer.sampleRate);"
); // Nothing to do here since renderedBuffer already has the correct sample rate

// One issue: if we change sample rate in pass 1, the playback of audioBuffer needs to be resampled? 
// Actually, `createBufferSource()` will automatically resample `audioBuffer` to the context's sampleRate when played! This is native Web Audio API behavior.

fs.writeFileSync('src/lib/audio.ts', content);
