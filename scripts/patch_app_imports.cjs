const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Replace everything from type AudioFile = { to PROFILES array with imports
const regex = /type AudioFile = \{[\s\S]*?const PROFILES = \[[^\]]*\];/;

const imports = `import { AudioFile } from './types';
import { getWavSpecs, formatDuration } from './utils/audioHelpers';
import { PROFILES } from './constants/profiles';`;

content = content.replace(regex, imports);

fs.writeFileSync('src/App.tsx', content);
