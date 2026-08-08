const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Add aria labels for checkboxes and sliders
content = content.replace(
  '<input type="range" min="-24" max="-6"', 
  '<input aria-label={t("integrated_lufs")} type="range" min="-24" max="-6"'
);
content = content.replace(
  '<input type="range" min="-3" max="0"', 
  '<input aria-label={t("true_peak")} type="range" min="-3" max="0"'
);

// Add translation to other things we missed
content = content.split('Target -14 LUFS, True Peak -1.0dB').join('{t("profile_default_desc")}');
content = content.split('Aggressive leveling, mono compatibility').join('{t("profile_tiktok_desc")}');
content = content.split('Target -14 LUFS, optimized for dialogue').join('{t("profile_youtube_desc")}');
content = content.split('Target -14 LUFS').join('{t("target_14_lufs")}');

fs.writeFileSync('src/App.tsx', content);
