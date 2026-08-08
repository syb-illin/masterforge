import React, { useEffect, useRef } from 'react';

interface EqVisualizerProps {
  eqOffsets: Float32Array | number[];
  sideEqOffsets?: Float32Array | number[];
}

export function EqVisualizer({ eqOffsets, sideEqOffsets }: EqVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    // Clear background
    ctx.clearRect(0, 0, width, height);
    
    // Draw Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    
    // Horizontal lines (dB)
    const dbRange = 12; // -12dB to +12dB
    for (let i = -dbRange; i <= dbRange; i += 3) {
      const y = height / 2 - (i / dbRange) * (height / 2);
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    
    // Vertical lines (Bands approx)
    for (let i = 0; i < 31; i += 3) {
      const x = (i / 30) * width;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    ctx.stroke();
    
    // Draw Center Line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    const drawCurve = (offsets: Float32Array | number[], color: string, fillBase: string) => {
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      
      for (let i = 0; i < 31; i++) {
        const x = (i / 30) * width;
        const dbVal = offsets[i];
        // clamp dbVal between -dbRange and dbRange
        const clampedDb = Math.max(-dbRange, Math.min(dbRange, dbVal));
        const y = height / 2 - (clampedDb / dbRange) * (height / 2);
        
        // Spline curve effect via bezier (simplified via quadratic)
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          const prevX = ((i - 1) / 30) * width;
          const prevDb = offsets[i-1];
          const prevClamped = Math.max(-dbRange, Math.min(dbRange, prevDb));
          const prevY = height / 2 - (prevClamped / dbRange) * (height / 2);
          
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
        }
      }
      
      // Complete path
      ctx.lineTo(width, height / 2);
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Fill
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, fillBase + '0.2)');
      gradient.addColorStop(0.5, fillBase + '0.05)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fill();
    };

    // Draw Mid
    drawCurve(eqOffsets, '#818cf8', 'rgba(129, 140, 248, ');
    
    // Draw Side if available
    if (sideEqOffsets) {
      drawCurve(sideEqOffsets, '#34d399', 'rgba(52, 211, 153, ');
    }
    
  }, [eqOffsets, sideEqOffsets]);

  return (
    <div className="relative w-full h-32 bg-gray-900/50 rounded-lg overflow-hidden border border-gray-800">
      <canvas 
        ref={canvasRef} 
        width={800} 
        height={200} 
        className="w-full h-full"
      />
      <div className="absolute top-2 left-2 flex gap-3 text-[10px] font-medium text-gray-500">
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-400"></div> Mid / Mono EQ</span>
        {sideEqOffsets && <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Side EQ</span>}
      </div>
    </div>
  );
}
