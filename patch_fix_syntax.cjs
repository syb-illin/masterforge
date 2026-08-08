const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const searchStr = "saturation: `Broadband Tape Saturation: Smooth harmonic excitation (drive x${tapeDrive.toFixed(1)}) with Pre/De-Emphasis to preserve highs and phase coherence.`, 100);";

const replaceStr = `saturation: \`Broadband Tape Saturation: Smooth harmonic excitation (drive x\${tapeDrive.toFixed(1)}) with Pre/De-Emphasis to preserve highs and phase coherence.\`,
        leveling: \`Applied \${makeupGainDb.toFixed(1)} dB makeup gain targeting \${targetLufs} LUFS. True Peak Limiter applied at \${targetTruePeak.toFixed(1)} dBTP ceiling.\`
      }
    };
    
    onProgress('Complete', 100);`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync('src/lib/audio.ts', content);
