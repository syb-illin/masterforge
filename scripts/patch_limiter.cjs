const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regex = /brightEq\.connect\(wetGain\);\n\s*wetGain\.connect\(offlineCtx\.destination\);\n\s*source\.connect\(dryGain\);\n\s*dryGain\.connect\(offlineCtx\.destination\);/m;

const replace = `brightEq.connect(wetGain);
  source.connect(dryGain);
  
  // Mix bus
  const mixBus = offlineCtx.createGain();
  wetGain.connect(mixBus);
  dryGain.connect(mixBus);
  
  onProgress('Applying Tone.js Lookahead Limiter (WASM-Ready)', 75);
  await yieldToMain();
  
  // Tone.js True Peak Limiter for professional headroom control
  const toneLimiter = new Tone.Limiter(targetTruePeak);
  Tone.connect(mixBus, toneLimiter);
  Tone.connect(toneLimiter, offlineCtx.destination);`;

content = content.replace(regex, replace);
fs.writeFileSync('src/lib/audio.ts', content);
