const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const eqStart = content.indexOf('for (const freq of eqFrequencies) {');
const eqEnd = content.indexOf('// Mid/Side Matrix for Bass Centering');

if (eqStart === -1 || eqEnd === -1) {
  console.log("Could not find eq logic");
  process.exit(1);
}

let newEqLogic = `for (let i = 0; i < eqFrequencies.length; i++) {
    const freq = eqFrequencies[i];
    const band = offlineCtx.createBiquadFilter();
    band.type = 'peaking';
    band.frequency.value = freq;
    band.Q.value = 4.31; // standard 1/3 octave Q factor
    
    // Use the dynamic matching EQ offsets computed from spectral analysis
    band.gain.value = stats.eqOffsets[i];
    
    prevEqNode.connect(band);
    prevEqNode = band;
    eqBands.push(band);
  }

  `;

content = content.substring(0, eqStart) + newEqLogic + content.substring(eqEnd);

// also add eqOffsets to AudioReport interface
const interfaceStart = content.indexOf('correlation: number;');
if (interfaceStart !== -1) {
    content = content.substring(0, interfaceStart) + 'correlation: number;\n    eqOffsets: Float32Array;\n' + content.substring(interfaceStart + 20);
}

// and add it to the report object returned
const reportStart = content.indexOf('correlation: stats.correlation,');
if (reportStart !== -1) {
    content = content.substring(0, reportStart) + 'correlation: stats.correlation,\n        eqOffsets: stats.eqOffsets,' + content.substring(reportStart + 31);
}


fs.writeFileSync('src/lib/audio.ts', content);
