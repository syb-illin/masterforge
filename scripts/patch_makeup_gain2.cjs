const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regex = /  let exactMakeupGainDb = targetLufs - pass1Lufs;\n  const pass1PeakDb = 20 \* Math.log10\(stats.peak \|\| 1e-6\);\n  const expectedPeakDb = pass1PeakDb \+ exactMakeupGainDb;/m;

const replace = `  let pass1Peak = 0;
  for (let c = 0; c < pass1Buffer.numberOfChannels; c++) {
    const data = pass1Buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      if (Math.abs(data[i]) > pass1Peak) pass1Peak = Math.abs(data[i]);
    }
  }
  const pass1PeakDb = 20 * Math.log10(pass1Peak || 1e-6);
  
  let exactMakeupGainDb = targetLufs - pass1Lufs;
  const expectedPeakDb = pass1PeakDb + exactMakeupGainDb;`;

content = content.replace(regex, replace);

// Remove the hardcoded refinedStats.lufs = targetLufs; because it will be wrong if we boosted more!
content = content.replace(
  `// Guarantee exact LUFS representation in stats (sometimes calculateLUFS has tiny floating point drift)\n  refinedStats.lufs = targetLufs;`,
  `// Used to guarantee exact LUFS representation, but now we might boost more to hit True Peak ceiling`
);

fs.writeFileSync('src/lib/audio.ts', content);
