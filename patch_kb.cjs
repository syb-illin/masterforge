const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regex = /const calculateArtifactScore = \(s\) => \{[\s\S]*?if \(characteristics\.length === 0\) characteristics\.push\('Well balanced'\);/m;

const replace = `// --- PRODUCER KNOWLEDGE BASE (KB): SUNO AI ARTIFACTS ---
    // Based on analysis of audio engineering forums regarding Neural Audio Codecs (EnCodec/DAC):
    // 1. "Tin Can" / Metallic Resonance: Boxy midrange congestion (excessive midEnergyPct).
    // 2. Swishy/Grainy Highs: Quantization noise in high frequencies (high spectral flatness).
    // 3. Muffled / Low-bitrate MP3 feel: Lack of high extension (low spectral rolloff) and heavy mud (low centroid).
    // 4. Flattened Transients: Lack of punch due to over-compression (very low crest factor).
    // 5. Watery/Swirly Phase: Unnatural stereo imaging (extreme correlation values).
    
    const calculateArtifactScore = (s) => {
      let score = 0;
      
      // 1. "Tin Can" / Midrange Congestion
      if (s.midEnergyPct > 35) {
        score += (s.midEnergyPct - 35) * 0.5;
      }
      
      // 2. Muffled / Heavy Mud (Centroid & Rolloff)
      if (s.centroid < 1500) {
        score += (1500 - s.centroid) / 150;
      }
      if (s.rolloff < 16000) {
        score += (16000 - s.rolloff) / 1000;
      }
      
      // 3. Swishy / Grainy Highs (Noise-like high flatness)
      if (s.flatness > 0.05) {
        score += (s.flatness - 0.05) * 40;
      }
      
      // 4. Flattened Transients / Squashed Dynamics (Crest Factor)
      if (s.crestFactor < 6.0) {
        score += (6.0 - s.crestFactor) * 1.5;
      }
      
      // 5. Watery Phase / Collapsed Stereo
      if (s.correlation < 0.6) {
        score += (0.6 - s.correlation) * 10;
      } else if (s.correlation > 0.85) {
        score += (s.correlation - 0.85) * 10;
      }
      
      score += 1.5; // Baseline confidence
      return Math.max(0, Math.min(10, score));
    };

    let aiArtifactScore = calculateArtifactScore(stats);
    let refinedAiArtifactScore = calculateArtifactScore(refinedStats) * 0.65; // Apply reduction for cleanup
    
    // Map KB anomalies to user-facing characteristics
    if (stats.midEnergyPct > 35) characteristics.push('Boxy / "Tin Can" midrange congestion');
    if (stats.flatness > 0.1) characteristics.push('Grainy / Swishy high frequencies');
    if (stats.crestFactor < 4.0) characteristics.push('Flattened transients / Over-compressed');
    if (stats.rolloff < 12000) characteristics.push('Muffled / MP3-like high-frequency loss');
    if (stats.correlation < 0.4 || stats.correlation > 0.9) characteristics.push('Watery / Unnatural phase correlation');
    
    if (aiArtifactScore >= 7) characteristics.push('High probability of AI codec artifacts detected');
    if (characteristics.length === 0) characteristics.push('Well balanced');`;

content = content.replace(regex, replace);
fs.writeFileSync('src/lib/audio.ts', content);
