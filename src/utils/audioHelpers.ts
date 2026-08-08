export async function getWavSpecs(file: File) {
  if (!file.name.toLowerCase().endsWith('.wav')) return null;
  try {
    const buffer = await file.slice(0, 8192).arrayBuffer();
    const view = new DataView(buffer);
    if (view.byteLength < 12) return null;
    if (view.getUint32(0, false) !== 0x52494646) return null; // 'RIFF'
    if (view.getUint32(8, false) !== 0x57415645) return null; // 'WAVE'

    let offset = 12;
    let format = null;
    let dataSize = 0;
    while (offset < view.byteLength - 8) {
      const chunkId = view.getUint32(offset, false);
      const chunkSize = view.getUint32(offset + 4, true);
      if (chunkId === 0x666d7420) { // 'fmt '
        if (offset + 24 > view.byteLength) return null;
        const channels = view.getUint16(offset + 10, true);
        const sampleRate = view.getUint32(offset + 12, true);
        const bitDepth = view.getUint16(offset + 22, true);
        format = { channels, sampleRate, bitDepth };
      } else if (chunkId === 0x64617461) { // 'data'
        dataSize = chunkSize;
        break;
      }
      offset += 8 + chunkSize;
    }
    if (format) {
      let duration = undefined;
      if (dataSize > 0) {
         duration = dataSize / (format.sampleRate * format.channels * (format.bitDepth / 8));
      }
      return { ...format, duration };
    }
    return null;
  } catch (e) {
    console.error("Failed to read WAV specs", e);
    return null;
  }
}

export function formatDuration(seconds?: number) {
  if (seconds === undefined) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
