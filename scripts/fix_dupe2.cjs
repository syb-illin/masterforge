const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

content = content.replace(`    eqOffsets: Float32Array;
    midEqOffsets: Float32Array;
    sideEqOffsets: Float32Array;
    dynEqAmount: Float32Array;
    midEqOffsets: Float32Array;
    sideEqOffsets: Float32Array;
    dynEqAmount: Float32Array;`, `    eqOffsets: Float32Array;
    midEqOffsets: Float32Array;
    sideEqOffsets: Float32Array;
    dynEqAmount: Float32Array;`);

fs.writeFileSync('src/lib/audio.ts', content);
