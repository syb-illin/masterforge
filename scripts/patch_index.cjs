const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Add dark class to html to enable default dark mode
if (!content.includes('class="dark"')) {
  content = content.replace('<html lang="en">', '<html lang="en" class="dark">');
}

// Add aria labels to some key sections if they don't exist
content = content.replace('<div id="root">', '<div id="root" aria-label="Main Application">');

fs.writeFileSync('index.html', content);
