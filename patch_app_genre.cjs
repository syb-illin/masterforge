const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  "import { AudioReport, processAudio, getReferenceTargets } from './lib/audio';",
  "import { AudioReport, processAudio, getReferenceTargets, guessGenre } from './lib/audio';"
);

const addFilesOld = `    const newAudioFiles: AudioFile[] = await Promise.all(validFiles.map(async file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'idle',
      progress: 0,
      step: 'Waiting',
      specs: await getWavSpecs(file),
      warmth: 0,
      brightness: 0,
      intensity: 100
    })));`;

const addFilesNew = `    const newAudioFiles: AudioFile[] = await Promise.all(validFiles.map(async file => {
      const specs = await getWavSpecs(file);
      let genre = "Unknown";
      try {
        genre = await guessGenre(file);
      } catch(e) {}
      
      return {
        id: Math.random().toString(36).substring(7),
        file,
        status: 'idle',
        progress: 0,
        step: 'Waiting',
        specs: specs ? { ...specs, genre } : { genre },
        warmth: 0,
        brightness: 0,
        intensity: 100
      };
    }));`;

content = content.replace(addFilesOld, addFilesNew);

const uiSpecOld = `{fileObj.specs && (
                              <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-xs font-medium">
                                {fileObj.specs.bitDepth}-bit / {fileObj.specs.sampleRate / 1000}kHz
                              </span>
                            )}`;
                            
const uiSpecNew = `{fileObj.specs && (
                              <>
                                {fileObj.specs.bitDepth && (
                                  <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-xs font-medium">
                                    {fileObj.specs.bitDepth}-bit / {fileObj.specs.sampleRate / 1000}kHz
                                  </span>
                                )}
                                {fileObj.specs.genre && fileObj.specs.genre !== "Unknown" && (
                                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                    {fileObj.specs.genre}
                                  </span>
                                )}
                              </>
                            )}`;

content = content.replace(uiSpecOld, uiSpecNew);

fs.writeFileSync('src/App.tsx', content);
