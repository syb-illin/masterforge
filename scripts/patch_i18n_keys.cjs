const fs = require('fs');
let content = fs.readFileSync('src/i18n.ts', 'utf8');

const additionalEn = `
      "profile_default_desc": "Target -14 LUFS, True Peak -1.0dB (Spotify, Apple Music)",
      "profile_tiktok_desc": "Aggressive leveling, mono compatibility, punchy presence",
      "profile_youtube_desc": "Target -14 LUFS, optimized for dialogue & music balance",
      "target_14_lufs": "Target -14 LUFS"
    }
  },`;
  
const additionalFr = `
      "profile_default_desc": "Cible -14 LUFS, True Peak -1.0dB (Spotify, Apple Music)",
      "profile_tiktok_desc": "Nivellement agressif, compatibilité mono, présence percutante",
      "profile_youtube_desc": "Cible -14 LUFS, optimisé pour l'équilibre dialogue/musique",
      "target_14_lufs": "Cible -14 LUFS"
    }
  }
};`;

content = content.replace(/    \}\n  \},\n  fr: \{/g, additionalEn + '\n  fr: {');
content = content.replace(/    \}\n  \}\n\};/g, additionalFr);

fs.writeFileSync('src/i18n.ts', content);
