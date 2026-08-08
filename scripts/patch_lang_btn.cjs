const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<Globe className="w-5 h-5" />`;
const replacement = `<span className="font-bold text-sm tracking-wide">{i18n.language === 'en' ? 'FR' : 'EN'}</span>`;

content = content.replace(target, replacement);

fs.writeFileSync('src/App.tsx', content);
