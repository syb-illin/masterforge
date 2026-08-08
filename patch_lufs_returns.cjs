const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// Replace { lufs: pass1Lufs } 
content = content.replace("const { lufs: pass1Lufs } = await calculateLUFS(pass1Buffer);", 
                          "const lufsDataPass1 = await calculateLUFS(pass1Buffer);\n  const pass1Lufs = lufsDataPass1.lufs;");

// Replace { lufs: refinedStatsLufs }
content = content.replace("const { lufs: refinedLufs } = await calculateLUFS(renderedBuffer);", 
                          "const refinedLufsData = await calculateLUFS(renderedBuffer);\n  const refinedLufs = refinedLufsData.lufs;");
content = content.replace("refinedStats.lufs = refinedLufs;", "refinedStats.lufs = refinedLufs;\n  refinedStats.lra = refinedLufsData.lra;");

// Update the initial call
content = content.replace("stats.lufs = await calculateLUFS(buffer);", 
                          "const initialLufsData = await calculateLUFS(buffer);\n  stats.lufs = initialLufsData.lufs;\n  stats.lra = initialLufsData.lra;");

content = content.replace("highEnergyPct: stats.highEnergyPct,", "highEnergyPct: stats.highEnergyPct,\n        lra: stats.lra,\n        sunoArtifactProb: stats.sunoArtifactProb,");

fs.writeFileSync('src/lib/audio.ts', content);
