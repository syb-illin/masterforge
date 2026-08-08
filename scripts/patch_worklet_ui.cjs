const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldPipeline = /\{ id: 'step-1', name: 'Input Stage & Analysis', module: 'Meyda \/ K-Weighted LUFS' \},\n\s*\{ id: 'step-2', name: 'Dynamic Equalization', module: '31-Band Phase-Linear Biquads' \},\n\s*\{ id: 'step-3', name: 'Harmonic Exciter', module: 'Multi-Band Tape Saturation' \},\n\s*\{ id: 'step-4', name: 'Stereo Field', module: 'Mid\/Side Matrix' \},\n\s*\{ id: 'step-5', name: 'Maximizer', module: 'True Peak Limiter' \}/m;

const newPipeline = `{ id: 'step-1', name: 'Input Stage & Analysis', module: 'WASM AudioWorklet + Meyda' },
                  { id: 'step-2', name: 'Dynamic Equalization', module: 'Tone.js EQ3 / 31-Band Phase-Linear' },
                  { id: 'step-3', name: 'Harmonic Exciter', module: 'Tone.js Chebyshev Saturation' },
                  { id: 'step-4', name: 'Stereo Field', module: 'Mid/Side Matrix' },
                  { id: 'step-5', name: 'Maximizer', module: 'Tone.js Lookahead Limiter (-1dBTP)' }`;

content = content.replace(oldPipeline, newPipeline);
fs.writeFileSync('src/App.tsx', content);
