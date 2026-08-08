const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const regex = /const exactMakeupGainDb = targetLufs - pass1Lufs;\n  const pass2Gain = pass2Ctx\.createGain\(\);\n  pass2Gain\.gain\.value = dbToGain\(exactMakeupGainDb\);/m;

const replace = `  let exactMakeupGainDb = targetLufs - pass1Lufs;
  const pass1PeakDb = 20 * Math.log10(stats.peak || 1e-6);
  const expectedPeakDb = pass1PeakDb + exactMakeupGainDb;
  
  // If target true peak is not reached, boost more so we hit the exact ceiling
  if (expectedPeakDb < targetTruePeak) {
    exactMakeupGainDb = targetTruePeak - pass1PeakDb;
  }
  
  const pass2Gain = pass2Ctx.createGain();
  pass2Gain.gain.value = dbToGain(exactMakeupGainDb);`;

content = content.replace(regex, replace);
fs.writeFileSync('src/lib/audio.ts', content);
