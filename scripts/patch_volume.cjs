const fs = require('fs');
let content = fs.readFileSync('src/components/AudioPlayer.tsx', 'utf8');

// Replace the useEffect for volume
const oldVolumeEffect = /useEffect\(\(\) => \{\n\s*if \(masterGainRef\.current && audioCtxRef\.current\) \{\n\s*masterGainRef\.current\.gain\.setTargetAtTime\(volume, audioCtxRef\.current\.currentTime, 0\.05\);\n\s*\}\n\s*\}, \[volume\]\);/m;

const newVolumeEffect = `useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  }, [volume]);`;

content = content.replace(oldVolumeEffect, newVolumeEffect);

fs.writeFileSync('src/components/AudioPlayer.tsx', content);
