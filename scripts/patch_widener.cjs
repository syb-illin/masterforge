const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// Replace the MS Matrix for Safe Stereo Widening with Tone.StereoWidener
const msMatrixRegex = /\/\/ MS Matrix for Safe Stereo Widening[\s\S]*?msOutputNode = prevStereoNode;\n\s*\}/m;

const newWidenerCode = `// Tone.js Dynamic Stereo Expansion
  onProgress('Dynamic Stereo Expansion (Tone.js StereoWidener)', 45);
  await yieldToMain();
  
  // Use Tone.js StereoWidener to add dynamic width
  const stereoWidener = new Tone.StereoWidener(0.65);
  Tone.connect(prevStereoNode, stereoWidener);
  
  // Convert Tone node back to native for the rest of the chain
  msOutputNode = offlineCtx.createGain();
  Tone.connect(stereoWidener, msOutputNode);`;

content = content.replace(msMatrixRegex, newWidenerCode);

fs.writeFileSync('src/lib/audio.ts', content);
