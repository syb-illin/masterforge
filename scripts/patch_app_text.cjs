const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace("desc: '1/3 Octave dynamic EQ, Adaptive MS Matrix'", "desc: 'Natural Phase mode (zero pre-ringing), 1/3 Octave dynamic EQ, Adaptive MS Matrix'");
fs.writeFileSync('src/App.tsx', content);
