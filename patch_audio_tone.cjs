const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// Import tone
content = "import * as Tone from 'tone';\n" + content;

// In processAudio, before creating offlineCtx
const offlineRegex = /const offlineCtx = new OfflineAudioContext\(\n\s*audioBuffer\.numberOfChannels,\n\s*Math\.ceil\(audioBuffer\.duration \* sampleRate\),\n\s*sampleRate\n\s*\);/m;

const offlineReplace = `const offlineCtx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    Math.ceil(audioBuffer.duration * sampleRate),
    sampleRate
  );
  
  // Set Tone.js to use this offline context for pro-grade DSP
  Tone.setContext(new Tone.OfflineContext(offlineCtx));`;

content = content.replace(offlineRegex, offlineReplace);

// At the end of the chain, replace simple gain limit with Tone.Limiter
const limitRegex = /\/\/ 3\. Final Gain & Limiting[\s\S]*?const finalMerger = offlineCtx\.createChannelMerger\(2\);[\s\S]*?finalGainNode\.connect\(offlineCtx\.destination\);/m;

const limitReplace = `// 3. Final Gain & Tone.js Pro Limiting
  onProgress('Applying Tone.js Lookahead Limiter (WASM-Optimized)', 75);
  await yieldToMain();
  
  // Connect previous chain to Tone.js Limiter
  const toneLimiter = new Tone.Limiter(targetTruePeak);
  const toneGain = new Tone.Gain();
  toneGain.gain.value = dbToGain(isMuddy ? 1.0 : (isHarsh ? 0.0 : 0.5));
  
  // Bridge native AudioNode to Tone.js AudioNode
  Tone.connect(tapeShaper, toneGain);
  toneGain.connect(toneLimiter);
  Tone.connect(toneLimiter, offlineCtx.destination);`;

content = content.replace(limitRegex, limitReplace);

fs.writeFileSync('src/lib/audio.ts', content);
