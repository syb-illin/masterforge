const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

const genreFn = `export async function guessGenre(file: File): Promise<string> {
  try {
    const stats = await getReferenceTargets(file); 
    
    const { centroid, rolloff, zcr, flatness, crestFactor, lowEnergyPct } = stats;
    
    if (lowEnergyPct > 0.45 && crestFactor < 3) {
      return "Electronic / Bass-heavy";
    }
    if (centroid > 3500 && zcr > 0.1) {
      return "Rock / Metal";
    }
    if (flatness > 0.2 && rolloff > 7000) {
      return "Pop / High-energy";
    }
    if (lowEnergyPct < 0.2 && crestFactor > 4) {
      return "Acoustic / Classical";
    }
    if (lowEnergyPct > 0.3 && centroid < 2500) {
      return "Hip-Hop / R&B";
    }
    
    return "Mixed / General";
  } catch (err) {
    return "Unknown";
  }
}
`;

content = content + "\n" + genreFn;
fs.writeFileSync('src/lib/audio.ts', content);
