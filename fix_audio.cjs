const fs = require('fs');
let content = fs.readFileSync('src/components/AudioPlayer.tsx', 'utf8');

content = content.replace(/<\/button>\n\s*<\/div>\n\s*\)\}\n\s*<\/div>\n\s*<\/div>/, `</button>\n          </div>\n          </div>\n        )}\n      </div>\n    </div>`);

fs.writeFileSync('src/components/AudioPlayer.tsx', content);
