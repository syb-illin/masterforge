const fs = require('fs');
let content = fs.readFileSync('src/components/AudioPlayer.tsx', 'utf8');

const regex = /const togglePlay = \(\) => \{[\s\S]*?\};\n\s*\n\s*\/\/ Drawing Canvas/m;

const replace = `const stopPlayback = () => {
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

  // Drawing Canvas`;

content = content.replace(regex, replace);

const domRegex = /\{\/\* Scrub Bar \*\/\}\n\s*<div className="w-full h-1 bg-gray-800 relative">\n\s*<div \n\s*className="h-full bg-indigo-500 absolute top-0 left-0"\n\s*style=\{\{ width: \`\$\{duration > 0 \? \(currentTime \/ duration\) \* 100 : 0\}%\` \}\}\n\s*><\/div>\n\s*<\/div>/m;

const domReplace = `{/* Scrub Bar */}
      <div 
        className="w-full h-2 bg-gray-800 relative cursor-pointer group"
        onClick={handleScrub}
      >
        <div 
           className="h-full bg-indigo-500 absolute top-0 left-0 transition-all duration-75"
           style={{ width: \`\${duration > 0 ? (currentTime / duration) * 100 : 0}%\` }}
        ></div>
        <div 
          className="absolute top-0 bottom-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ width: '100%', left: 0, pointerEvents: 'none' }}
        ></div>
      </div>`;

content = content.replace(domRegex, domReplace);

fs.writeFileSync('src/components/AudioPlayer.tsx', content);
