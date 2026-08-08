const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const searchStr = "  } finally {\n    audioContext.close();\n  }";
const replaceStr = searchStr + `\n  
  let targetLufs = -14;
  let targetTruePeak = -1.0;
  if (profile === 'youtube') {
     targetLufs = -14;
     targetTruePeak = -1.0;
  } else if (profile === 'tiktok') {
     targetLufs = -11;
     targetTruePeak = -2.0; // Extra headroom for transcoders
  }`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync('src/lib/audio.ts', content);
