const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /const profile = PROFILES\.find\(p => p\.id === selectedProfile\)\?\.name \|\| 'Podcast';\n\s*const \{ blob, report \} = await processAudio\(\n\s*fileObj\.file,\n\s*profile,/g,
  `const profileName = PROFILES.find(p => p.id === selectedProfile)?.name || 'Custom';
      const { blob, report } = await processAudio(
        fileObj.file, 
        { profile: profileName, targetLufs, targetTruePeak },`
);

fs.writeFileSync('src/App.tsx', content);
