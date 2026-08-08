import * as Tone from 'tone';
console.log(Tone.version);
const keys = Object.keys(Tone).filter(k => k.includes('Limiter') || k.includes('Multiband') || k.includes('EQ') || k.includes('Chebyshev') || k.includes('Offline'));
console.log(keys);
