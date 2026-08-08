const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

content = content.replace("  gainNode.connect(lowCut);\\n  // The 31-band EQ nodes were already chained to lowCut in the loop.\\n", "");
// let's try replacing them without assuming exact spacing just in case
content = content.replace('gainNode.connect(lowCut);', '// gainNode.connect(lowCut); // REMOVED');
fs.writeFileSync('src/lib/audio.ts', content);
