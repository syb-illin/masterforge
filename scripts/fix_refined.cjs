const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regex = /correlation: number;\n    aiArtifactScore: number;/;
const replace = `correlation: number;
    rolloff: number;
    lowEnergyPct: number;
    midEnergyPct: number;
    highEnergyPct: number;
    aiArtifactScore: number;`;

content = content.replace(regex, replace);
fs.writeFileSync('src/lib/audio.ts', content);
