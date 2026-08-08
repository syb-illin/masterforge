const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg py-2 pl-2 pr-8 text-sm text-gray-700 dark:text-gray-300"/g,
  'className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-700 dark:text-gray-300"'
);

fs.writeFileSync('src/App.tsx', content);
