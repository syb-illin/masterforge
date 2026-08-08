import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

export function AudioPlayer({ rawFile, processedBlob }: { rawFile: File, processedBlob?: Blob }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mode, setMode] = useState<'raw' | 'processed'>(processedBlob ? 'processed' : 'raw');
  const modeRef = useRef(mode);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const masterGainRef = useRef<GainNode | null>(null);
  
  // Audio context and nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rawNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const processedNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRawRef = useRef<AnalyserNode | null>(null);
  const analyserProcRef = useRef<AnalyserNode | null>(null);
  const aRawLRef = useRef<AnalyserNode | null>(null);
  const aRawRRef = useRef<AnalyserNode | null>(null);
  const aProcLRef = useRef<AnalyserNode | null>(null);
  const aProcRRef = useRef<AnalyserNode | null>(null);
  const gainRawRef = useRef<GainNode | null>(null);
  const gainProcessedRef = useRef<GainNode | null>(null);
  
  // Buffers
  const rawBufferRef = useRef<AudioBuffer | null>(null);
  const processedBufferRef = useRef<AudioBuffer | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  
  // Draw Loop
  const requestRef = useRef<number>();
  const timeUpdateRef = useRef<number>();

  useEffect(() => {
    let active = true;
    const initAudio = async () => {
      setIsLoading(true);
      // @ts-ignore
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      
      const aRaw = ctx.createAnalyser();
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
      
      const masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      masterGainRef.current = masterGain;
      gRaw.connect(masterGain);
      gProc.connect(masterGain);
      masterGain.connect(ctx.destination);
      
      gainRawRef.current = gRaw;
      gainProcessedRef.current = gProc;
      
      gRaw.gain.value = mode === 'raw' ? 1 : 0;
      gProc.gain.value = mode === 'processed' ? 1 : 0;

      try {
        const rawArrayBuffer = await rawFile.arrayBuffer();
        if (active) {
          const buf = await ctx.decodeAudioData(rawArrayBuffer);
          rawBufferRef.current = buf;
          setDuration(buf.duration);
        }
        
        if (processedBlob) {
          const procArrayBuffer = await processedBlob.arrayBuffer();
          if (active) {
            processedBufferRef.current = await ctx.decodeAudioData(procArrayBuffer);
          }
        }
      } catch (err) {
        console.error("Failed to decode audio for player", err);
      }
      
      if (active) setIsLoading(false);
    };
    
    initAudio();
    return () => {
      active = false;
      audioCtxRef.current?.close();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (timeUpdateRef.current) cancelAnimationFrame(timeUpdateRef.current);
    };
  }, [rawFile, processedBlob]); 
  
  useEffect(() => {
    if (!gainRawRef.current || !gainProcessedRef.current) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    const t = ctx.currentTime;
    gainRawRef.current.gain.setTargetAtTime(mode === 'raw' ? 1 : 0, t, 0.05);
    gainProcessedRef.current.gain.setTargetAtTime(mode === 'processed' ? 1 : 0, t, 0.05);
  }, [mode]);

  const updateTime = () => {
    if (audioCtxRef.current && isPlaying) {
      const elapsed = audioCtxRef.current.currentTime - startTimeRef.current + pauseTimeRef.current;
      setCurrentTime(elapsed);
      timeUpdateRef.current = requestAnimationFrame(updateTime);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      timeUpdateRef.current = requestAnimationFrame(updateTime);
    } else {
      if (timeUpdateRef.current) cancelAnimationFrame(timeUpdateRef.current);
    }
    return () => {
      if (timeUpdateRef.current) cancelAnimationFrame(timeUpdateRef.current);
    };
  }, [isPlaying]);

  useEffect(() => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
  }, [volume]);

  const stopPlayback = () => {
    rawNodeRef.current?.stop();
    processedNodeRef.current?.stop();
    rawNodeRef.current = null;
    processedNodeRef.current = null;
  };

  const startPlayback = (offset: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx || !rawBufferRef.current) return;
    
    const rawNode = ctx.createBufferSource();
    rawNode.buffer = rawBufferRef.current;
    rawNode.connect(analyserRawRef.current!);
    
    const procNode = ctx.createBufferSource();
    if (processedBufferRef.current) {
      procNode.buffer = processedBufferRef.current;
      procNode.connect(analyserProcRef.current!);
    }
    
    rawNode.start(0, offset);
    if (processedBufferRef.current) {
      procNode.start(0, offset);
    }
    
    rawNodeRef.current = rawNode;
    processedNodeRef.current = procNode;
    startTimeRef.current = ctx.currentTime;
    
    rawNode.onended = () => {
      if (rawNodeRef.current === rawNode) {
        setIsPlaying(false);
        pauseTimeRef.current = 0;
        setCurrentTime(0);
      }
    };
  };

  const togglePlay = () => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    if (isPlaying) {
      stopPlayback();
      pauseTimeRef.current += ctx.currentTime - startTimeRef.current;
      setIsPlaying(false);
    } else {
      const offset = pauseTimeRef.current % (rawBufferRef.current?.duration || 1);
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => startPlayback(offset));
      } else {
        startPlayback(offset);
      }
      setIsPlaying(true);
    }
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioCtxRef.current || !rawBufferRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(pos * duration, duration));
    
    setCurrentTime(newTime);
    pauseTimeRef.current = newTime;
    
    if (isPlaying) {
      stopPlayback();
      startPlayback(newTime);
    }
  };

  // Drawing Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const aRaw = analyserRawRef.current;
    const aProc = analyserProcRef.current;
    if (!canvas || !aRaw) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const bufferLength = aRaw.frequencyBinCount;
    const dataRaw = new Uint8Array(bufferLength);
    const dataProc = new Uint8Array(bufferLength);
    
    const draw = () => {
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

      // Draw Raw Spectrum (Background outline / subtle fill)
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
      const gX = width - gSize - 40;
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
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isLoading, processedBlob]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-4 bg-gray-900 rounded-lg border border-gray-800 overflow-hidden" ref={containerRef}>
      <div className="h-32 w-full relative">
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={128} 
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Legend */}
        {processedBlob && !isLoading && (
          <div className="absolute top-2 left-2 flex gap-4 text-[10px] uppercase font-bold tracking-wider z-10 bg-black/40 px-3 py-1.5 rounded-md backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-gray-400 opacity-80 rounded"></div>
              <span className="text-gray-400">Raw Analyzer</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-indigo-300 rounded shadow-[0_0_8px_rgba(129,140,248,0.8)]"></div>
              <span className="text-indigo-300">Refined Analyzer</span>
            </div>
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <span className="text-sm text-gray-400">Loading Audio...</span>
          </div>
        )}
      </div>
      
      {/* Scrub Bar */}
      <div className="w-full h-1 bg-gray-800 relative">
        <div 
          className="h-full bg-indigo-500 absolute top-0 left-0" 
          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
        ></div>
      </div>
      
      <div className="p-3 flex items-center justify-between bg-gray-900">
        <div className="flex items-center gap-3">
          <button 
            onClick={togglePlay} 
            disabled={isLoading}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-white"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
          </button>
          <div className="text-xs text-gray-400 font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        
        {processedBlob && (
          <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.657 6.343a8 8 0 010 11.314M11 5L6 9H2v6h4l5 4V5z" /></svg>
            <input 
              type="range" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-indigo-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="flex bg-gray-800 p-1 rounded-full">
            <button
              onClick={() => setMode('raw')}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                mode === 'raw' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Bypass (Raw)
            </button>
            <button
              onClick={() => setMode('processed')}
              className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all ${
                mode === 'processed' ? 'bg-indigo-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Active (Mastered)
            </button>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
