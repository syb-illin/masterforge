const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div [\s\S]*?onDragOver=\{handleDragOver\}[\s\S]*?<\/p>\s*<\/div>/;

const replacement = `<FileUploader 
              isDragging={isDragging} 
              onDragOver={handleDragOver} 
              onDragLeave={handleDragLeave} 
              onDrop={handleDrop} 
              onFileInput={handleFileInput} 
            />`;

content = content.replace(regex, replacement);

content = content.replace(
  "import { Header } from './components/layout/Header';",
  "import { Header } from './components/layout/Header';\nimport { FileUploader } from './components/audio/FileUploader';"
);

fs.writeFileSync('src/App.tsx', content);
