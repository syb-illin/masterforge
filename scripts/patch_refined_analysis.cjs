const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// Update AudioReport interface
const interfaceSearch = `  analysis: {
    lufs: number;
    peak: number;
    crestFactor: number;
    centroid: number;
    zcr: number;
    flatness: number;
    stereoWidth: number;
    correlation: number;
    eqOffsets: Float32Array;
    midEqOffsets: Float32Array;
    sideEqOffsets: Float32Array;
    dynEqAmount: Float32Array;
    characteristics: string[];
    aiArtifactScore: number;
  };
  processing: {`;

const interfaceReplace = `  analysis: {
    lufs: number;
    peak: number;
    crestFactor: number;
    centroid: number;
    zcr: number;
    flatness: number;
    stereoWidth: number;
    correlation: number;
    eqOffsets: Float32Array;
    midEqOffsets: Float32Array;
    sideEqOffsets: Float32Array;
    dynEqAmount: Float32Array;
    characteristics: string[];
    aiArtifactScore: number;
  };
  refinedAnalysis?: {
    lufs: number;
    peak: number;
    crestFactor: number;
    centroid: number;
    zcr: number;
    flatness: number;
    stereoWidth: number;
    correlation: number;
  };
  processing: {`;
  
content = content.replace(interfaceSearch, interfaceReplace);

const analyzeSearch = `  log.debug('Offline rendering complete');
  
  onProgress('Exporting 24-bit 48kHz WAV', 95);
  await yieldToMain();
  
  const wavBlob = audioBufferToWav(renderedBuffer);`;

const analyzeReplace = `  log.debug('Offline rendering complete');
  
  onProgress('Post-Processing Analysis', 90);
  await yieldToMain();
  const refinedStats = await analyzeAudio(renderedBuffer);
  
  onProgress('Exporting 24-bit 48kHz WAV', 95);
  await yieldToMain();
  
  const wavBlob = audioBufferToWav(renderedBuffer);`;

content = content.replace(analyzeSearch, analyzeReplace);

const reportSearch = `    const report: AudioReport = {
      analysis: {
        lufs: stats.lufs,
        peak: stats.peak,
        crestFactor: stats.crestFactor,
        centroid: stats.centroid,
        zcr: stats.zcr,
        flatness: stats.flatness,
        stereoWidth: stats.stereoWidth,
        correlation: stats.correlation,
        eqOffsets: stats.eqOffsets,
        midEqOffsets: stats.midEqOffsets,
        sideEqOffsets: stats.sideEqOffsets,
        dynEqAmount: stats.dynEqAmount,
        characteristics,
        aiArtifactScore,
      },
      processing: {`;
      
const reportReplace = `    const report: AudioReport = {
      analysis: {
        lufs: stats.lufs,
        peak: stats.peak,
        crestFactor: stats.crestFactor,
        centroid: stats.centroid,
        zcr: stats.zcr,
        flatness: stats.flatness,
        stereoWidth: stats.stereoWidth,
        correlation: stats.correlation,
        eqOffsets: stats.eqOffsets,
        midEqOffsets: stats.midEqOffsets,
        sideEqOffsets: stats.sideEqOffsets,
        dynEqAmount: stats.dynEqAmount,
        characteristics,
        aiArtifactScore,
      },
      refinedAnalysis: {
        lufs: refinedStats.lufs,
        peak: refinedStats.peak,
        crestFactor: refinedStats.crestFactor,
        centroid: refinedStats.centroid,
        zcr: refinedStats.zcr,
        flatness: refinedStats.flatness,
        stereoWidth: refinedStats.stereoWidth,
        correlation: refinedStats.correlation,
      },
      processing: {`;

content = content.replace(reportSearch, reportReplace);

fs.writeFileSync('src/lib/audio.ts', content);
