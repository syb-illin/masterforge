const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regex1 = /dynEqAmount: Float32Array;/;
const replace1 = `dynEqAmount: Float32Array;
    rolloff: number;
    lowEnergyPct: number;
    midEnergyPct: number;
    highEnergyPct: number;`;

content = content.replace(regex1, replace1);

const regex2 = /correlation: number;/;
const replace2 = `correlation: number;
    rolloff: number;
    lowEnergyPct: number;
    midEnergyPct: number;
    highEnergyPct: number;`;

content = content.replace(regex2, replace2);

fs.writeFileSync('src/lib/audio.ts', content);
