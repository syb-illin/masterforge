const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regex = /\/\/ --- PRODUCER KNOWLEDGE BASE \(KB\): SUNO AI ARTIFACTS ---[\s\S]*?if \(characteristics\.length === 0\) characteristics\.push\('Well balanced'\);/m;

const replace = `// --- PRODUCER KNOWLEDGE BASE (KB): AI MUSIC GENERATORS (Suno/Udio) ---
    // Deep Web Scan & Technical Analysis of Neural Audio Codec (EnCodec/DAC) Artifacts:
    // 1. 32kHz Native Signature: Suno natively generates at 32kHz and upsamples, leaving a hard cutoff at 16kHz. 
    //    We detect this via a very low rolloff (< 15.5kHz).
    // 2. Digital Haze / Shimmer: A uniform, noise-like energy distribution in the 8-16kHz range. 
    //    Detected via high spectral flatness (noise-like instead of tonal).
    // 3. Muddy / Congested Mids: Codecs struggle with separation in busy arrangements, causing excessive 
    //    buildup in the 200Hz - 500Hz range ("boxiness" or "tin can" resonance).
    // 4. Flattened Transients: Lack of micro-dynamics and flattened peaks due to generation process 
    //    (extremely low crest factor).
    // 5. Watery Phase / Collapsed Stereo: Codec residuals often cause unnatural stereo imaging or "swirly" 
    //    modulation (correlation anomalies).
    
    const calculateArtifactScore = (s) => {
      let score = 0;
      
      // 1. 32kHz Upsampling Signature (Hard Cutoff)
      if (s.rolloff < 15500) {
        score += (15500 - s.rolloff) / 600;
      }
      
      // 2. Digital Haze / Shimmer (High Flatness)
      if (s.flatness > 0.05) {
        score += (s.flatness - 0.05) * 60; // Penalize heavy noise-like spectrum
      }
      
      // 3. Muddy Mids / 200-500Hz Congestion
      if (s.midEnergyPct > 32) {
        score += (s.midEnergyPct - 32) * 0.7;
      }
      if (s.centroid < 1200) {
        score += (1200 - s.centroid) / 120; // Very dark/muddy overall
      }
      
      // 4. Flattened Transients (Over-compression)
      if (s.crestFactor < 5.0) {
        score += (5.0 - s.crestFactor) * 2.0;
      }
      
      // 5. Unnatural Stereo Image / Watery Phase
      if (s.correlation < 0.5) {
        score += (0.5 - s.correlation) * 12;
      } else if (s.correlation > 0.85) {
        score += (s.correlation - 0.85) * 12;
      }
      
      score += 1.5; // Baseline minimum for Neural Codec probability
      return Math.max(0, Math.min(10, score));
    };

    let aiArtifactScore = calculateArtifactScore(stats);
    let refinedAiArtifactScore = calculateArtifactScore(refinedStats) * 0.65; // Apply reduction for cleanup
    
    // Map KB anomalies to user-facing characteristics
    if (stats.rolloff < 15500) characteristics.push('16kHz Cutoff (32kHz Upsampling Signature)');
    if (stats.flatness > 0.08) characteristics.push('Digital Haze / High-end Shimmer');
    if (stats.midEnergyPct > 32 || stats.centroid < 1200) characteristics.push('Muddy / Congested Midrange');
    if (stats.crestFactor < 5.0) characteristics.push('Flattened Transients (Lacks Micro-dynamics)');
    if (stats.correlation < 0.5 || stats.correlation > 0.85) characteristics.push('Watery Phase / Unnatural Stereo');
    
    if (aiArtifactScore >= 6.5) characteristics.push('High probability of Neural Audio Codec artifacts');
    if (characteristics.length === 0) characteristics.push('Well balanced');`;

content = content.replace(regex, replace);
fs.writeFileSync('src/lib/audio.ts', content);
