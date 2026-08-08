const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const reverseColorMap = {
  'bg-gray-50 dark:bg-gray-950': 'bg-gray-950',
  'bg-white dark:bg-gray-900': 'bg-gray-900',
  'bg-gray-100 dark:bg-gray-800': 'bg-gray-800',
  'text-gray-900 dark:text-gray-100': 'text-gray-100',
  'text-gray-700 dark:text-gray-300': 'text-gray-300',
  'text-gray-600 dark:text-gray-400': 'text-gray-400',
  'border-gray-200 dark:border-gray-800': 'border-gray-800',
  'border-gray-300 dark:border-gray-700': 'border-gray-700',
  'bg-gray-100/50 dark:bg-gray-800/50': 'bg-gray-800/50',
  'bg-gray-100/30 dark:bg-gray-800/30': 'bg-gray-800/30',
  'bg-white/50 dark:bg-gray-900/50': 'bg-gray-900/50',
  'border-gray-200/50 dark:border-gray-800/50': 'border-gray-800/50',
  'border-gray-200/80 dark:border-gray-800/80': 'border-gray-800/80',
  // Specific fixes for ones that might have slightly mismatched spaces
  'text-gray-900 dark:text-gray-100': 'text-gray-100',
  'dark:text-gray-100': 'text-gray-100' // just in case
};

for (const [responsive, dark] of Object.entries(reverseColorMap)) {
  const regex = new RegExp(responsive.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
  content = content.replace(regex, dark);
}

// Ensure min-h-screen has the original bg
content = content.replace('min-h-screen bg-[#0C0C0E] text-gray-100 p-6 font-sans', 'min-h-screen bg-[#0C0C0E] text-gray-100 p-6 font-sans');

fs.writeFileSync('src/App.tsx', content);
