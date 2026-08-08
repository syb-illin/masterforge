const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

content = content.replace(
  'eqOffsets[b] = Math.max(-3, Math.min(3, (eqOffsets[b] - monoAvgDb) * 0.3)); // Gentle EQ to preserve character',
  `// Natural Phase: Extremely gentle EQ, prioritizing preservation of the original track's body
    let offset = (eqOffsets[b] - monoAvgDb) * 0.25;
    // Do not kill the bass! If it's trying to cut lows, reduce the cut severely.
    if (eqFrequencies[b] < 150 && offset < 0) {
        offset *= 0.1; 
    }
    eqOffsets[b] = Math.max(-2, Math.min(2.5, offset));`
);

fs.writeFileSync('src/lib/audio.ts', content);
