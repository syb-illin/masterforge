const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

content = content.replace(/const \{ lufs: pass1Lufs \} = await calculateLUFS\(pass1Buffer\);/g, 
  "const lufsDataPass1 = await calculateLUFS(pass1Buffer);\n  const pass1Lufs = lufsDataPass1.lufs;");

content = content.replace(/const \{ lufs: refinedLufs \} = await calculateLUFS\(renderedBuffer\);/g,
  "const refinedLufsData = await calculateLUFS(renderedBuffer);\n  const refinedLufs = refinedLufsData.lufs;");

content = content.replace(/refinedStats\.lufs = refinedLufs;/g,
  "refinedStats.lufs = refinedLufs;\n  refinedStats.lra = refinedLufsData.lra;");

// find "const { lufs, lra } = await calculateLUFS(buffer);" and replace it to set to stats
content = content.replace(/const \{ lufs, lra \} = await calculateLUFS\(buffer\);/g,
  "const initialLufsData = await calculateLUFS(buffer);\n  const lufs = initialLufsData.lufs;\n  const lra = initialLufsData.lra;");
  
fs.writeFileSync('src/lib/audio.ts', content);
