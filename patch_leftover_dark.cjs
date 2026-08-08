const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const replacements = {
  'hover:border-gray-700 hover:bg-white dark:bg-gray-900/50': 'hover:border-gray-700 hover:bg-gray-900',
  'bg-gray-100 dark:bg-gray-800/30': 'bg-gray-800/30',
  'bg-white dark:bg-gray-900/50': 'bg-gray-900/50',
  'border-gray-200 dark:border-gray-800/80': 'border-gray-800/80',
  'bg-gray-100 dark:bg-gray-800/50': 'bg-gray-800/50'
};

for (const [from, to] of Object.entries(replacements)) {
  const regex = new RegExp(from.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
  content = content.replace(regex, to);
}

fs.writeFileSync('src/App.tsx', content);
