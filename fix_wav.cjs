const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regex = /async function bufferToWav24Bit\([\s\S]*$/;

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
    }
  }

  return new Blob([buffer], { type: 'audio/wav' });
}
`;

content = content.replace(regex, newWavFunc);
fs.writeFileSync('src/lib/audio.ts', content);
