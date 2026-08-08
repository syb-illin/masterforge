const fs = require('fs');
let content = fs.readFileSync('src/components/AudioPlayer.tsx', 'utf8');

const drawStart = content.indexOf('// Draw Processed (Brighter/Foreground/Bars)');
const drawEnd = content.indexOf('// Draw Band thresholds');

if (drawStart === -1 || drawEnd === -1) {
    console.error("Could not find draw section");
    process.exit(1);
}

let newDraw = `// Draw Raw Spectrum (Background outline / subtle fill)
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.moveTo(0, height);
      for (let i = 0; i < bufferLength; i++) {
        const x = getX(i);
        // Smooth data slightly for nicer display (mock smoothing)
        let val = dataRaw[i];
        if (i > 0 && i < bufferLength - 1) val = (dataRaw[i-1] + dataRaw[i] + dataRaw[i+1]) / 3;
        
        const y = height - ((val / 255) * height);
        if (i === 0) {
          ctx.lineTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.lineTo(width, height);
      ctx.closePath();
      
      const rawGradient = ctx.createLinearGradient(0, 0, 0, height);
      rawGradient.addColorStop(0, 'rgba(156, 163, 175, 0.15)'); // gray-400
      rawGradient.addColorStop(1, 'rgba(156, 163, 175, 0.01)');
      ctx.fillStyle = rawGradient;
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw Processed Spectrum (Foreground solid outline & fill)
      if (aProc && processedBlob) {
        ctx.beginPath();
        ctx.moveTo(0, height);
        for (let i = 0; i < bufferLength; i++) {
          const x = getX(i);
          let val = dataProc[i];
          if (i > 0 && i < bufferLength - 1) val = (dataProc[i-1] + dataProc[i] + dataProc[i+1]) / 3;
          
          const y = height - ((val / 255) * height);
          if (i === 0) {
            ctx.lineTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.lineTo(width, height);
        ctx.closePath();
        
        const procGradient = ctx.createLinearGradient(0, 0, 0, height);
        procGradient.addColorStop(0, 'rgba(129, 140, 248, 0.4)'); // indigo-400
        procGradient.addColorStop(1, 'rgba(129, 140, 248, 0.05)');
        ctx.fillStyle = procGradient;
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(165, 180, 252, 0.9)'; // indigo-300
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      `;

content = content.substring(0, drawStart) + newDraw + content.substring(drawEnd);


const legendStart = content.indexOf('<div className="absolute top-2 left-2 flex gap-3');
if (legendStart !== -1) {
    const legendEnd = content.indexOf('</div>', content.indexOf('</div>', legendStart) + 10) + 15;
    
    let newLegend = `<div className="absolute top-2 left-2 flex gap-4 text-[10px] uppercase font-bold tracking-wider z-10 bg-black/40 px-3 py-1.5 rounded-md backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-gray-400 opacity-80 rounded"></div>
              <span className="text-gray-400">Raw Analyzer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-indigo-300 rounded shadow-[0_0_8px_rgba(129,140,248,0.8)]"></div>
              <span className="text-indigo-300">Refined Analyzer</span>
            </div>
          </div>`;
    content = content.substring(0, legendStart) + newLegend + content.substring(legendEnd);
}


fs.writeFileSync('src/components/AudioPlayer.tsx', content);
