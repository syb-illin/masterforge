const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /\{ id: 'step-4', name: 'Stereo Field', module: 'Mid\/Side Expansion' \}/,
  "{ id: 'step-4', name: 'Stereo Field', module: 'Dynamic Stereo Width' }"
);

fs.writeFileSync('src/App.tsx', content);
