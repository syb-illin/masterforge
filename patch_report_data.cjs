const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regex1 = /aiArtifactScore,\n      \},/m;
const replace1 = `aiArtifactScore,
        rolloff: stats.rolloff,
        lowEnergyPct: stats.lowEnergyPct,
        midEnergyPct: stats.midEnergyPct,
        highEnergyPct: stats.highEnergyPct,
      },`;
content = content.replace(regex1, replace1);

const regex2 = /aiArtifactScore: refinedAiArtifactScore,\n      \},/m;
const replace2 = `aiArtifactScore: refinedAiArtifactScore,
        rolloff: refinedStats.rolloff,
        lowEnergyPct: refinedStats.lowEnergyPct,
        midEnergyPct: refinedStats.midEnergyPct,
        highEnergyPct: refinedStats.highEnergyPct,
      },`;
content = content.replace(regex2, replace2);

fs.writeFileSync('src/lib/audio.ts', content);
