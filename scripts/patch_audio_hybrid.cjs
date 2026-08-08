const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const reportEqStart = content.indexOf("eq: `Pro-Q style exhaustive 31-band");
if (reportEqStart !== -1) {
  const reportEqEnd = content.indexOf("stereo: audioBuffer", reportEqStart);
  content = content.substring(0, reportEqStart) + "eq: `Pro-Q 4 style exhaustive Hybrid Stereo/Mid-Side 31-band processing with target curve matching. Dynamic EQ applied to tame transient spikes and resonances based on variance analysis.`,\n        " + content.substring(reportEqEnd);
}

fs.writeFileSync('src/lib/audio.ts', content);
