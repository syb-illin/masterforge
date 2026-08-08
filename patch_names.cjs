const fs = require('fs');
let content = fs.readFileSync('src/components/AudioPlayer.tsx', 'utf8');

content = content.replace(/>\n\s*Listen: Raw\n\s*<\/button>/g, `>\n              Bypass (Raw)\n            </button>`);
content = content.replace(/>\n\s*Listen: Refined\n\s*<\/button>/g, `>\n              Active (Mastered)\n            </button>`);

fs.writeFileSync('src/components/AudioPlayer.tsx', content);
