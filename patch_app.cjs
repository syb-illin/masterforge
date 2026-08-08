const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace dark colors with responsive variants
const colorMap = {
  'bg-gray-950': 'bg-gray-50 dark:bg-gray-950',
  'bg-gray-900': 'bg-white dark:bg-gray-900',
  'bg-gray-800': 'bg-gray-100 dark:bg-gray-800',
  'text-gray-100': 'text-gray-900 dark:text-gray-100',
  'text-gray-300': 'text-gray-700 dark:text-gray-300',
  'text-gray-400': 'text-gray-600 dark:text-gray-400',
  'border-gray-800': 'border-gray-200 dark:border-gray-800',
  'border-gray-700': 'border-gray-300 dark:border-gray-700',
  'bg-gray-800/50': 'bg-gray-100/50 dark:bg-gray-800/50',
  'bg-gray-800/30': 'bg-gray-100/30 dark:bg-gray-800/30',
  'bg-gray-900/50': 'bg-white/50 dark:bg-gray-900/50',
  'border-gray-800/50': 'border-gray-200/50 dark:border-gray-800/50',
  'border-gray-800/80': 'border-gray-200/80 dark:border-gray-800/80'
};

for (const [dark, responsive] of Object.entries(colorMap)) {
  const regex = new RegExp(dark.replace(/\//g, '\\/'), 'g');
  // Avoid replacing if already replaced (simple hack)
  content = content.replace(regex, responsive);
}
// Clean up double applications if any
for (const [dark, responsive] of Object.entries(colorMap)) {
  const double = responsive.replace(dark, responsive);
  content = content.replace(new RegExp(double.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), responsive);
}

// Add imports
if (!content.includes('useTranslation')) {
  content = content.replace(
    "import { useState, useRef, useEffect, useMemo } from 'react';", 
    "import { useState, useRef, useEffect, useMemo } from 'react';\\nimport { useTranslation } from 'react-i18next';"
  );
}
if (!content.includes('Moon, Sun')) {
  content = content.replace(
    "UploadCloud, Settings, ", 
    "UploadCloud, Settings, Moon, Sun, Globe, "
  );
}

fs.writeFileSync('src/App.tsx', content);
