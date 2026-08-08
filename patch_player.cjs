const fs = require('fs');
let content = fs.readFileSync('src/components/AudioPlayer.tsx', 'utf8');

// We need to add the new refs.
const refStart = content.indexOf('const analyserRawRef = useRef');
const refEnd = content.indexOf('// Buffers');

let newRefs = `const analyserRawRef = useRef<AnalyserNode | null>(null);
  const analyserProcRef = useRef<AnalyserNode | null>(null);
  const aRawLRef = useRef<AnalyserNode | null>(null);
  const aRawRRef = useRef<AnalyserNode | null>(null);
  const aProcLRef = useRef<AnalyserNode | null>(null);
  const aProcRRef = useRef<AnalyserNode | null>(null);
  const gainRawRef = useRef<GainNode | null>(null);
  const gainProcessedRef = useRef<GainNode | null>(null);
  
  `;

content = content.substring(0, refStart) + newRefs + content.substring(refEnd);

// We need to modify initAudio
const initStart = content.indexOf('const aRaw = ctx.createAnalyser();');
const initEnd = content.indexOf('try {');

let newInit = `const aRaw = ctx.createAnalyser();
      aRaw.fftSize = 2048;
      analyserRawRef.current = aRaw;
      
      const aProc = ctx.createAnalyser();
      aProc.fftSize = 2048;
      analyserProcRef.current = aProc;
      
      const aRawL = ctx.createAnalyser();
      const aRawR = ctx.createAnalyser();
      aRawL.fftSize = 1024;
      aRawR.fftSize = 1024;
      aRawLRef.current = aRawL;
      aRawRRef.current = aRawR;

      const aProcL = ctx.createAnalyser();
      const aProcR = ctx.createAnalyser();
      aProcL.fftSize = 1024;
      aProcR.fftSize = 1024;
      aProcLRef.current = aProcL;
      aProcRRef.current = aProcR;
      
      const gRaw = ctx.createGain();
      const gProc = ctx.createGain();
      
      aRaw.connect(gRaw);
      aProc.connect(gProc);
      
      const splitRaw = ctx.createChannelSplitter(2);
      const splitProc = ctx.createChannelSplitter(2);
      
      gRaw.connect(splitRaw);
      splitRaw.connect(aRawL, 0);
      splitRaw.connect(aRawR, 1);
      // fallback if mono
      splitRaw.connect(aRawR, 0); 
      
      gProc.connect(splitProc);
      splitProc.connect(aProcL, 0);
      splitProc.connect(aProcR, 1);
      splitProc.connect(aProcR, 0);
      
      gRaw.connect(ctx.destination);
      gProc.connect(ctx.destination);
      
      gainRawRef.current = gRaw;
      gainProcessedRef.current = gProc;
      
      gRaw.gain.value = mode === 'raw' ? 1 : 0;
      gProc.gain.value = mode === 'processed' ? 1 : 0;

      `;
content = content.substring(0, initStart) + newInit + content.substring(initEnd);


// We need to modify draw
const drawStart = content.indexOf('const draw = () => {');
const drawEnd = content.indexOf('draw();', drawStart);

let newDraw = `const draw = () => {
      requestRef.current = requestAnimationFrame(draw);
      
      aRaw.getByteFrequencyData(dataRaw);
      if (aProc) aProc.getByteFrequencyData(dataProc);
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.fillStyle = '#111827'; // gray-900 base
      ctx.fillRect(0, 0, width, height);
      
      // Use logarithmic scale for X
      const minLog = Math.log10(20); 
      const maxLog = Math.log10(22050); 
      const logRange = maxLog - minLog;
      
      const getX = (index: number) => {
         const freq = Math.max(20, (index * 22050) / bufferLength);
         const log = Math.log10(freq);
         return ((log - minLog) / logRange) * width;
      };

      // Draw Processed (Brighter/Foreground/Bars)
      if (aProc && processedBlob) {
        ctx.globalCompositeOperation = 'source-over';
        for (let i = 1; i < bufferLength; i++) {
          const x1 = getX(i - 1);
          const x2 = getX(i);
          const barWidth = Math.max(1, (x2 - x1) * 0.9);
          const barHeight = (dataProc[i] / 255) * height;
          const hue = i / bufferLength * 260 + 190; 
          ctx.fillStyle = \`hsla(\${hue}, 80%, 60%, 0.8)\`;
          ctx.fillRect(x1, height - barHeight, barWidth, barHeight);
        }
      }

      // Draw Raw (Thin line over top)
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.9)'; // gray-400
      ctx.lineWidth = 1.5;
      for (let i = 0; i < bufferLength; i++) {
        const x = getX(i);
        const y = height - ((dataRaw[i] / 255) * height);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      
      // Draw Band thresholds
      ctx.globalCompositeOperation = 'source-over';
      const drawThreshold = (freq: number, label: string) => {
        const log = Math.log10(freq);
        const x = ((log - minLog) / logRange) * width;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '9px monospace';
        ctx.fillText(label, x + 4, 12);
        ctx.setLineDash([]);
      };
      drawThreshold(200, "200Hz (Low Crossover)");
      drawThreshold(5000, "5kHz (High Crossover)");
      
      // --- Draw Goniometer & Correlation ---
      // We draw them in the top right corner
      const gSize = 100;
      const gX = width - gSize - 20;
      const gY = 20;
      
      // Box for goniometer
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(gX, gY, gSize, gSize);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.strokeRect(gX, gY, gSize, gSize);
      
      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(gX + gSize/2, gY); ctx.lineTo(gX + gSize/2, gY + gSize);
      ctx.moveTo(gX, gY + gSize/2); ctx.lineTo(gX + gSize, gY + gSize/2);
      ctx.stroke();
      
      // L and R labels
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText("L", gX - 10, gY + 10);
      ctx.fillText("R", gX + gSize + 4, gY + 10);
      
      const drawGonio = (aL: AnalyserNode, aR: AnalyserNode, color: string) => {
         const dataL = new Float32Array(aL.fftSize);
         const dataR = new Float32Array(aR.fftSize);
         aL.getFloatTimeDomainData(dataL);
         aR.getFloatTimeDomainData(dataR);
         
         ctx.beginPath();
         ctx.strokeStyle = color;
         ctx.lineWidth = 1;
         let lrSum = 0, lSum = 0, rSum = 0;
         for(let i=0; i<dataL.length; i++) {
            const l = dataL[i];
            const r = dataR[i];
            lrSum += l * r;
            lSum += l * l;
            rSum += r * r;
            
            // 45 degree rotation
            // M = (L+R)/sqrt(2), S = (L-R)/sqrt(2)
            const s2 = Math.SQRT2;
            const x = (r - l) / s2; 
            const y = (l + r) / s2;
            
            const px = gX + gSize/2 + x * (gSize/2);
            const py = gY + gSize/2 - y * (gSize/2);
            
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
         }
         ctx.stroke();
         return lrSum / (Math.sqrt(lSum * rSum) || 1);
      };
      
      let corrRaw = 0;
      let corrProc = 0;
      
      if (aRawLRef.current && aRawRRef.current) {
        corrRaw = drawGonio(aRawLRef.current, aRawRRef.current, 'rgba(156, 163, 175, 0.4)');
      }
      if (aProcLRef.current && aProcRRef.current && processedBlob) {
        corrProc = drawGonio(aProcLRef.current, aProcRRef.current, 'rgba(129, 140, 248, 0.8)');
      }
      
      // Draw correlation meter
      const cY = gY + gSize + 15;
      const cHeight = 8;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(gX, cY, gSize, cHeight);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.strokeRect(gX, cY, gSize, cHeight);
      
      // Center line
      ctx.beginPath();
      ctx.moveTo(gX + gSize/2, cY);
      ctx.lineTo(gX + gSize/2, cY + cHeight);
      ctx.stroke();
      
      ctx.fillText("-1", gX - 15, cY + 8);
      ctx.fillText("+1", gX + gSize + 4, cY + 8);
      
      // Draw raw correlation marker
      ctx.fillStyle = 'rgba(156, 163, 175, 0.8)';
      const rawX = gX + gSize/2 + (corrRaw * gSize/2);
      ctx.fillRect(rawX - 2, cY - 2, 4, cHeight + 4);
      
      // Draw proc correlation marker
      if (processedBlob) {
        ctx.fillStyle = 'rgba(129, 140, 248, 1)';
        const procX = gX + gSize/2 + (corrProc * gSize/2);
        ctx.fillRect(procX - 2, cY - 2, 4, cHeight + 4);
      }
    };
    
    `;

content = content.substring(0, drawStart) + newDraw + content.substring(drawEnd);

fs.writeFileSync('src/components/AudioPlayer.tsx', content);
