const fs = require('fs');
let content = fs.readFileSync('src/components/AudioPlayer.tsx', 'utf8');

const modeRegex = /const \[mode, setMode\] = useState\<'raw' \| 'processed'\>\(processedBlob \? 'processed' : 'raw'\);/m;
content = content.replace(modeRegex, `const [mode, setMode] = useState<'raw' | 'processed'>(processedBlob ? 'processed' : 'raw');\n  const modeRef = useRef(mode);\n  useEffect(() => { modeRef.current = mode; }, [mode]);`);

const gXRegex = /const gX = width - gSize - 20;/m;
content = content.replace(gXRegex, `const gX = width - gSize - 40;`); // Move goniometer left slightly to make room for meter

const drawBottomRegex = /draw\(\);\n\s*return \(\) => \{/m;

const drawPatch = `
      // --- Level Meter ---
      const activeAnalyser = modeRef.current === 'raw' ? aRaw : (aProc || aRaw);
      const tData = new Float32Array(activeAnalyser.fftSize);
      activeAnalyser.getFloatTimeDomainData(tData);
      
      let sumSq = 0;
      let peak = 0;
      for (let i = 0; i < tData.length; i++) {
        const val = tData[i];
        sumSq += val * val;
        if (Math.abs(val) > peak) peak = Math.abs(val);
      }
      const rmsDb = 20 * Math.log10(Math.sqrt(sumSq / tData.length) || 1e-6);
      const peakDb = 20 * Math.log10(peak || 1e-6);

      const mWidth = 14;
      const mHeight = height - 20;
      const mX = width - 20;
      const mY = 10;
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(mX, mY, mWidth, mHeight);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.strokeRect(mX, mY, mWidth, mHeight);
      
      const getDbY = (db) => {
         const dbRange = 60;
         const val = Math.max(0, db + dbRange);
         return mHeight - (val / dbRange) * mHeight;
      };
      
      const rmsY = getDbY(rmsDb);
      const peakY = getDbY(peakDb);
      
      const gradient = ctx.createLinearGradient(0, mY, 0, mY + mHeight);
      gradient.addColorStop(0, '#f87171'); // red-400
      gradient.addColorStop(0.2, '#facc15'); // yellow-400
      gradient.addColorStop(0.4, '#4ade80'); // green-400
      gradient.addColorStop(1, '#818cf8'); // indigo-400

      ctx.fillStyle = gradient;
      ctx.fillRect(mX + 1, mY + rmsY, mWidth - 2, mHeight - rmsY);
      
      ctx.fillStyle = peakDb > -0.1 ? '#ef4444' : '#fff';
      ctx.fillRect(mX + 1, mY + peakY, mWidth - 2, 2);
      
      // DB labels for meter
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '8px monospace';
      ctx.fillText("0", mX - 10, mY + getDbY(0) + 3);
      ctx.fillText("18", mX - 14, mY + getDbY(-18) + 3);
      ctx.fillText("36", mX - 14, mY + getDbY(-36) + 3);

    };
    
    draw();
    
    return () => {`;

content = content.replace(/\};\n\s*draw\(\);\n\s*return \(\) => \{/m, drawPatch);

fs.writeFileSync('src/components/AudioPlayer.tsx', content);
