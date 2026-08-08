const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /className="w-full bg-gray-900 border border-gray-700 rounded-lg px-2 py-2 text-sm text-gray-300"/g,
  'className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 pr-8 text-sm text-gray-300 appearance-none bg-[url(\'data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E\')] bg-[length:1em_1em] bg-no-repeat bg-[position:right_0.5rem_center]"'
);

fs.writeFileSync('src/App.tsx', content);
