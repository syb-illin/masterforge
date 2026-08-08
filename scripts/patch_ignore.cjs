const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

content = content.replace(
  "  const AudioContext = window.AudioContext || window.webkitAudioContext;",
  "  // @ts-ignore\n  const AudioContext = window.AudioContext || window.webkitAudioContext;"
);

// We might replace the first one which already has it, so let's do it better:
content = content.replace(/\/\/ @ts-ignore\n  \/\/ @ts-ignore/g, "// @ts-ignore");

fs.writeFileSync('src/lib/audio.ts', content);
