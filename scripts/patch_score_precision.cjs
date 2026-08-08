const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

content = content.replace(
  'aiArtifactScore = Math.max(0, Math.min(10, Math.round(aiArtifactScore)));',
  'aiArtifactScore = Math.max(0, Math.min(10, aiArtifactScore));'
);

content = content.replace(
  'refinedAiArtifactScore = Math.max(0, Math.min(10, Math.round(refinedAiArtifactScore)));',
  'refinedAiArtifactScore = Math.max(0, Math.min(10, refinedAiArtifactScore));'
);

fs.writeFileSync('src/lib/audio.ts', content);
