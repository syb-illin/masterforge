const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\/\* Header \*\/\}[\s\S]*?<\/header>/;

content = content.replace(regex, '<Header />');

// Add import
content = content.replace(
  "import { AudioFile } from './types';",
  "import { AudioFile } from './types';\nimport { Header } from './components/layout/Header';"
);

fs.writeFileSync('src/App.tsx', content);
