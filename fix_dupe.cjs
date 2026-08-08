const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');
const objStart = content.indexOf('correlation: stats.correlation,');

if (objStart !== -1) {
  const objEnd = content.indexOf('characteristics,', objStart);
  if (objEnd !== -1) {
     content = content.substring(0, objStart) + 
     `correlation: stats.correlation,
        eqOffsets: stats.eqOffsets,
        midEqOffsets: stats.midEqOffsets,
        sideEqOffsets: stats.sideEqOffsets,
        dynEqAmount: stats.dynEqAmount,
        ` + content.substring(objEnd);
  }
}

fs.writeFileSync('src/lib/audio.ts', content);
