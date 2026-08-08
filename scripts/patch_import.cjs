const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "import { processAudio } from './lib/audio';",
  "import { processAudio, getReferenceTargets } from './lib/audio';"
);

fs.writeFileSync('src/App.tsx', content);
