const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const profilesOld = `const PROFILES = [
  { id: 'music', name: 'Music Platforms', desc: '{t("profile_default_desc")}' },
  { id: 'youtube', name: 'YouTube', desc: '{t("profile_youtube_desc")} & music balance' },
  { id: 'tiktok', name: 'TikTok', desc: '{t("profile_tiktok_desc")}, punchy presence' }
];`;

const profilesNew = `const PROFILES = [
  { id: 'music', name: 'Music Platforms', descKey: 'profile_default_desc' },
  { id: 'youtube', name: 'YouTube', descKey: 'profile_youtube_desc' },
  { id: 'tiktok', name: 'TikTok', descKey: 'profile_tiktok_desc' }
];`;
content = content.replace(profilesOld, profilesNew);
// Fallback if the previous sed didn't replace as expected
content = content.replace(
  /const PROFILES = \[\n  \{ id: 'music', name: 'Music Platforms', desc: '[^']*' \},\n  \{ id: 'youtube', name: 'YouTube', desc: '[^']*' \},\n  \{ id: 'tiktok', name: 'TikTok', desc: '[^']*' \}\n\];/g,
  profilesNew
);

content = content.replace(/{profile.desc}/g, '{t(profile.descKey)}');

fs.writeFileSync('src/App.tsx', content);
