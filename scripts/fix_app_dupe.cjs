const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/<p className="text-xs text-gray-500 leading-relaxed">\{profile\.desc\}<\/p>\n\s*<\/label>\n\s*\)\)\}\n\s*<\/div>\n\s*<div className="mt-6 pt-6 border-t border-gray-800">/m, `<div className="mt-6 pt-6 border-t border-gray-800">`);

fs.writeFileSync('src/App.tsx', content);
