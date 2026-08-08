import { useTranslation } from 'react-i18next';
import React, { useState, useRef } from 'react';
import { Upload, Sliders, Moon, Sun, Globe, Play, Download, CheckCircle, FileAudio, Settings, X, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AudioReport, processAudio, getReferenceTargets, guessGenre } from './lib/audio';
import { AudioPlayer } from './components/AudioPlayer';
import { EqVisualizer } from './components/EqVisualizer';
import pkg from '../package.json';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

type AudioFile = {
  id: string;
  file: File;
  status: 'idle' | 'processing' | 'done' | 'error';
  progress: number;
  step: string;
  blob?: Blob;
  report?: AudioReport;
  specs?: { sampleRate: number; bitDepth: number; channels: number; duration?: number } | null;
  warmth?: number;
  brightness?: number;
  intensity?: number;
};

async function getWavSpecs(file: File) {
  if (!file.name.toLowerCase().endsWith('.wav')) return null;
  try {
    const buffer = await file.slice(0, 8192).arrayBuffer();
    const view = new DataView(buffer);
    if (view.byteLength < 12) return null;
    if (view.getUint32(0, false) !== 0x52494646) return null; // 'RIFF'
    if (view.getUint32(8, false) !== 0x57415645) return null; // 'WAVE'

    let offset = 12;
    let format = null;
    let dataSize = 0;
    while (offset < view.byteLength - 8) {
      const chunkId = view.getUint32(offset, false);
      const chunkSize = view.getUint32(offset + 4, true);
      if (chunkId === 0x666d7420) { // 'fmt '
        if (offset + 24 > view.byteLength) return null;
        const channels = view.getUint16(offset + 10, true);
        const sampleRate = view.getUint32(offset + 12, true);
        const bitDepth = view.getUint16(offset + 22, true);
        format = { channels, sampleRate, bitDepth };
      } else if (chunkId === 0x64617461) { // 'data'
        dataSize = chunkSize;
        break;
      }
      offset += 8 + chunkSize;
    }
    if (format) {
      let duration = undefined;
      if (dataSize > 0) {
         duration = dataSize / (format.sampleRate * format.channels * (format.bitDepth / 8));
      }
      return { ...format, duration };
    }
    return null;
  } catch (e) {
    console.error("Failed to read WAV specs", e);
    return null;
  }
}

function formatDuration(seconds?: number) {
  if (seconds === undefined) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const PROFILES = [
  { id: 'music', name: 'Music Platforms', descKey: 'profile_default_desc' },
  { id: 'youtube', name: 'YouTube', descKey: 'profile_youtube_desc' },
  { id: 'tiktok', name: 'TikTok', descKey: 'profile_tiktok_desc' }
];

export default function App() {
  const { t, i18n } = useTranslation();

  const [files, setFiles] = useState<AudioFile[]>([]);
  const filesRef = useRef<AudioFile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState(PROFILES[0].id);
  const [targetLufs, setTargetLufs] = useState(-14);
  const [targetTruePeak, setTargetTruePeak] = useState(-1.0);
  const [autoProcess, setAutoProcess] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedReports, setExpandedReports] = useState<Record<string, boolean>>({});
  const [expandedEq, setExpandedEq] = useState<Record<string, boolean>>({});
  const [exportSampleRate, setExportSampleRate] = useState(48000);
  const [exportBitDepth, setExportBitDepth] = useState(24);
  const [referenceFile, setReferenceFile] = useState<{name: string, stats: any} | null>(null);
  const refInputRef = useRef<HTMLInputElement>(null);
  const [isAnalyzingRef, setIsAnalyzingRef] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isProcessingRef = useRef(false);

  // Sync state to ref for sequential processing
  React.useEffect(() => {
    filesRef.current = files;
  }, [files]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleReferenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsAnalyzingRef(true);
      try {
        const stats = await getReferenceTargets(file);
        setReferenceFile({ name: file.name, stats });
      } catch (err) {
        console.error("Failed to analyze reference track:", err);
      } finally {
        setIsAnalyzingRef(false);
      }
    }
    if (refInputRef.current) refInputRef.current.value = '';
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files));
    }
    // reset input so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addFiles = async (newFiles: File[]) => {
    const validFiles = newFiles.filter(f => f.type.includes('audio/') || f.name.endsWith('.wav'));
    const newAudioFiles: AudioFile[] = await Promise.all(validFiles.map(async file => {
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
    }));
    setFiles(prev => [...prev, ...newAudioFiles]);
  };

  const handleProcess = async (fileObj: AudioFile) => {
    setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'processing', progress: 0, step: 'Starting' } : f));
    
    try {
      const profileName = PROFILES.find(p => p.id === selectedProfile)?.name || 'Custom';
      const { blob, report } = await processAudio(
        fileObj.file,
        { 
          profile: profileName, 
          targetLufs: referenceFile ? referenceFile.stats.lufs : targetLufs, 
          targetTruePeak: referenceFile ? (20 * Math.log10(referenceFile.stats.peak || 1e-6)) : targetTruePeak,
          referenceStats: referenceFile?.stats,
          exportSampleRate,
          exportBitDepth
        }, 
        (step, progress) => {
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, step, progress } : f));
        },
        { warmth: fileObj.warmth, brightness: fileObj.brightness, intensity: fileObj.intensity }
      );
      
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'done', progress: 100, step: 'Complete', blob, report } : f));
    } catch (err) {
      console.error('Audio processing failed:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error', step: `Processing failed: ${errMsg}` } : f));
    }
  };

  const processAll = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    let idleFiles = filesRef.current.filter(f => f.status === 'idle');
    while (idleFiles.length > 0) {
      await handleProcess(idleFiles[0]);
      idleFiles = filesRef.current.filter(f => f.status === 'idle');
    }
    
    isProcessingRef.current = false;
  };

  React.useEffect(() => {
    if (autoProcess && files.some(f => f.status === 'idle') && !isProcessingRef.current) {
      processAll();
    }
  }, [files, autoProcess]);

  const handleRemove = (id: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== id);
      return updated;
    });
  };

  const handleDownload = (fileObj: AudioFile) => {
    if (!fileObj.blob) return;
    const url = URL.createObjectURL(fileObj.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileObj.file.name.replace(/\.wav$/i, '') + '_refined.wav';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    const doneFiles = files.filter(f => f.status === 'done' && f.blob);
    if (doneFiles.length === 0) return;
    
    const zip = new JSZip();
    doneFiles.forEach(f => {
      const name = f.file.name.replace(/\.wav$/i, '') + '_refined.wav';
      zip.file(name, f.blob!);
    });
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'refined_audio.zip');
  };

  return (
    <div className="min-h-screen bg-[#0C0C0E] text-gray-100 p-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col mb-12 py-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                <Sliders className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{t('app_title')}</h1>
                <p className="text-sm text-gray-400 font-medium">{t('app_subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  const newLang = i18n.language === 'en' ? 'fr' : 'en';
                  i18n.changeLanguage(newLang);
                }}
                className="p-2 text-gray-400 hover:text-indigo-500 transition-colors"
                aria-label={t('lang_toggle')}
                title={t('lang_toggle')}
              >
                <Globe className="w-5 h-5" />
              </button>
              <div className="text-xs font-mono text-gray-500 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">
                v{pkg.version}
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Dropzone */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
                ${isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-gray-800 hover:border-gray-700 hover:bg-gray-900'}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileInput} 
                className="hidden" 
                multiple 
                accept="audio/*,.wav" 
              />
              <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-800">
                <Upload className={`w-8 h-8 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} />
              </div>
              <h3 className="text-lg font-medium mb-2">{t("upload_title")}</h3>
              <p className="text-gray-500 text-sm">{t("upload_desc")}</p>
            </div>

            {/* File List */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Queue ({files.length})</h3>
                    <div className="flex gap-2">
                      {files.filter(f => f.status === 'done').length > 1 && (
                        <button 
                          onClick={handleExportAll}
                          className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded flex items-center gap-2 transition-colors"
                        >
                          <Download className="w-3 h-3" /> Export All (ZIP)
                        </button>
                      )}
                      {files.some(f => f.status === 'idle') && (
                        <button 
                          onClick={processAll}
                          className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded flex items-center gap-2 transition-colors"
                        >
                          <Play className="w-3 h-3" /> Process All
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {files.map(file => (
                    <div key={file.id} className="bg-[#141417] border border-gray-800 rounded-lg overflow-hidden">
                      <motion.div 
                        layout
                        className="p-4 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 bg-gray-900 rounded flex items-center justify-center shrink-0">
                          <FileAudio className="w-5 h-5 text-gray-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm truncate">{file.file.name}</h4>
                            {file.specs && (
                              <span className="text-[10px] uppercase font-semibold tracking-wide bg-gray-800 text-gray-400 px-2 py-0.5 rounded border border-gray-700 whitespace-nowrap">
                                {file.specs.sampleRate / 1000}kHz / {file.specs.bitDepth}-bit / {file.specs.channels === 1 ? 'Mono' : file.specs.channels === 2 ? 'Stereo' : `${file.specs.channels}ch`}
                                {file.specs.duration !== undefined && ` / ${formatDuration(file.specs.duration)}`}
                              </span>
                            )}
                          </div>
                          
                          {file.status === 'processing' ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs text-indigo-500">
                                <span>{file.step}</span>
                                <span>{Math.round(file.progress)}%</span>
                              </div>
                              <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                                <motion.div 
                                  className="h-full bg-indigo-500"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${file.progress}%` }}
                                  transition={{ type: 'tween', duration: 0.2 }}
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500">
                              {(file.file.size / (1024 * 1024)).toFixed(2)} MB • {file.step}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          {file.status === 'idle' && (
                            <button 
                              onClick={() => handleProcess(file)}
                              className="p-2 bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white rounded transition-colors"
                              title="Process file"
                            >
                              <Play className="w-4 h-4 fill-current" />
                            </button>
                          )}
                          {file.status === 'processing' && (
                            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                          )}
                          {file.status === 'done' && (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <button 
                                onClick={() => setExpandedReports(prev => ({ ...prev, [file.id]: !prev[file.id] }))}
                                className={`p-2 rounded transition-colors ${expandedReports[file.id] ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                                title="View Report"
                              >
                                <Info className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDownload(file)}
                                className="p-2 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors"
                                title="Download WAV"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {file.status !== 'processing' && (
                            <>
                              <button 
                                onClick={() => setExpandedEq(prev => ({ ...prev, [file.id]: !prev[file.id] }))}
                                className={`p-2 rounded transition-colors ${expandedEq[file.id] ? 'bg-indigo-500 text-white' : 'bg-transparent text-gray-400 hover:text-white hover:bg-gray-800'}`}
                                title="Custom EQ"
                              >
                                <Sliders className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemove(file.id)}
                                className="p-2 bg-transparent text-gray-500 hover:text-red-400 rounded transition-colors"
                                title="Remove file"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                      
                      {/* Report Section */}
                      <AnimatePresence>
                        {file.report && expandedReports[file.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-800 bg-gray-900/30 overflow-hidden text-xs"
                          >
                            <div className="p-4 space-y-4">
                              <div>
                                <h5 className="font-semibold text-gray-400 mb-2 uppercase tracking-wide flex justify-between">
                                  <span>Mastering Analysis</span>
                                </h5>
                                
                                {file.report.refinedAnalysis ? (
                                  <table className="w-full text-left text-gray-300 mb-2 border-collapse">
                                    <thead>
                                      <tr className="border-b border-gray-700 text-gray-500 text-xs uppercase">
                                        <th className="pb-1 font-normal">Metric</th>
                                        <th className="pb-1 font-normal text-right">Original</th>
                                        <th className="pb-1 font-normal text-right text-indigo-400">Mastered</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                      <tr>
                                        <td className="py-2 text-gray-400">{t("integrated_lufs")}</td>
                                        <td className="py-2 text-right">{file.report.analysis.lufs.toFixed(1)}</td>
                                        <td className="py-2 text-right text-indigo-300 font-medium">{file.report.refinedAnalysis?.lufs?.toFixed(1) || (file.report as any)?.analysis?.lufs?.toFixed(1)}</td>
                                      </tr>
                                      <tr>
                                        <td className="py-2 text-gray-400">{t("lra")}</td>
                                        <td className="py-2 text-right">{file.report.analysis.lra ? file.report.analysis.lra.toFixed(1) + ' LU' : 'N/A'}</td>
                                        <td className="py-2 text-right text-indigo-300 font-medium">-</td>
                                      </tr>
                                      <tr>
                                        <td className="py-2 text-gray-400">{t("true_peak")}</td>
                                        <td className="py-2 text-right">{(20 * Math.log10(file.report.analysis.peak || 1e-6)).toFixed(2)} dB</td>
                                        <td className="py-2 text-right text-indigo-300 font-medium">{(20 * Math.log10(file.report.refinedAnalysis.peak || 1e-6)).toFixed(2)} dB</td>
                                      </tr>
                                      <tr>
                                        <td className="py-2 text-gray-400">{t("dynamic_range")}</td>
                                        <td className="py-2 text-right">{(20 * Math.log10(file.report.analysis.crestFactor || 1)).toFixed(1)} dB</td>
                                        <td className="py-2 text-right text-indigo-300 font-medium">{(20 * Math.log10(file.report.refinedAnalysis.crestFactor || 1)).toFixed(1)} dB</td>
                                      </tr>
                                      <tr>
                                        <td className="py-2 text-gray-400">{t("stereo_width")}</td>
                                        <td className="py-2 text-right">{file.report.analysis.stereoWidth.toFixed(2)}</td>
                                        <td className="py-2 text-right text-indigo-300 font-medium">{file.report.refinedAnalysis.stereoWidth.toFixed(2)}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                ) : (
                                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-300 mb-2 bg-gray-800/30 p-3 rounded-lg">
                                    <div className="flex flex-col"><span className="text-gray-500 text-xs">LUFS</span> <span className="font-medium">{file.report.analysis.lufs.toFixed(1)}</span></div>
                                    <div className="flex flex-col"><span className="text-gray-500 text-xs">LRA</span> <span className="font-medium">{file.report.analysis.lra ? file.report.analysis.lra.toFixed(1) + ' LU' : 'N/A'}</span></div>
                                    <div className="flex flex-col"><span className="text-gray-500 text-xs">{t("true_peak")}</span> <span className="font-medium">{(20 * Math.log10(file.report.analysis.peak || 1e-6)).toFixed(2)} dB</span></div>
                                    <div className="flex flex-col"><span className="text-gray-500 text-xs">{t("dynamic_range")}</span> <span className="font-medium">{(20 * Math.log10(file.report.analysis.crestFactor || 1)).toFixed(1)} dB</span></div>
                                    <div className="flex flex-col"><span className="text-gray-500 text-xs">{t("stereo_width")}</span> <span className="font-medium">{file.report.analysis.stereoWidth.toFixed(2)}</span></div>
                                  </div>
                                )}
                                
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {file.report.analysis.characteristics.map((c, i) => (
                                    <span key={i} className="px-2.5 py-1 text-xs bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">{c}</span>
                                  ))}
                                  {file.report.analysis.genAiArtifactProb !== undefined && file.report.analysis.genAiArtifactProb > 20 && (
                                    <span className="px-2.5 py-1 text-xs bg-red-500/10 text-red-400 rounded border border-red-500/20">
                                      {t('ai_artifact')}: {file.report.analysis.genAiArtifactProb}%
                                    </span>
                                  )}
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-800">
                                   <h6 className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider flex items-center gap-2"><Settings className="w-3.5 h-3.5" /> Processing Chain Log</h6>
                                   <div className="space-y-3 mb-6 text-[13px] text-gray-300">
                                     <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800/80">
                                       <span className="text-indigo-400 font-medium block mb-1">{t("gain_staging")}</span>
                                       {file.report.processing.gainStaging || 'Standard offset applied'}
                                     </div>
                                     <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800/80">
                                       <span className="text-indigo-400 font-medium block mb-1">{t("dynamic_eq")}</span>
                                       {file.report.processing.eq || 'Surgical digital parametric EQ matching'}
                                     </div>
                                     <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800/80">
                                       <span className="text-indigo-400 font-medium block mb-1">{t("saturation")}</span>
                                       {file.report.processing.saturation}
                                     </div>
                                     <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800/80">
                                       <span className="text-indigo-400 font-medium block mb-1">{t("stereo_imaging")}</span>
                                       {file.report.processing.stereo}
                                     </div>
                                     <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800/80">
                                       <span className="text-indigo-400 font-medium block mb-1">{t("glue_comp")}</span>
                                       {file.report.processing.leveling}
                                     </div>
                                   </div>
                                   <h6 className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">{t("eq_curve")}</h6>
                                   <EqVisualizer eqOffsets={file.report.analysis.eqOffsets} sideEqOffsets={file.report.analysis.sideEqOffsets} />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Custom EQ Section */}
                      <AnimatePresence>
                        {expandedEq[file.id] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-gray-800 bg-gray-900/30 overflow-hidden text-sm"
                          >
                            <div className="p-4 space-y-4">
                              <h5 className="font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
                                <Sliders className="w-4 h-4" /> Custom EQ Curves
                              </h5>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Warmth (Lows)</span>
                                    <span>{file.warmth || 0} dB</span>
                                  </div>
                                  <input 
                                    type="range" min="-10" max="10" step="1" 
                                    value={file.warmth || 0}
                                    onChange={(e) => setFiles(prev => prev.map(f => f.id === file.id ? { ...f, warmth: parseFloat(e.target.value) } : f))}
                                    className="w-full accent-indigo-500"
                                  />
                                </div>
                                <div>
                                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Brightness (Highs)</span>
                                    <span>{file.brightness || 0} dB</span>
                                  </div>
                                  <input 
                                    type="range" min="-10" max="10" step="1" 
                                    value={file.brightness || 0}
                                    onChange={(e) => setFiles(prev => prev.map(f => f.id === file.id ? { ...f, brightness: parseFloat(e.target.value) } : f))}
                                    className="w-full accent-indigo-500"
                                  />
                                </div>
                                <div>
                                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                                    <span>Intensity (Dry / Wet)</span>
                                    <span>{file.intensity !== undefined ? file.intensity : 100}%</span>
                                  </div>
                                  <input 
                                    type="range" min="0" max="100" step="1" 
                                    value={file.intensity !== undefined ? file.intensity : 100}
                                    onChange={(e) => setFiles(prev => prev.map(f => f.id === file.id ? { ...f, intensity: parseInt(e.target.value) } : f))}
                                    className="w-full accent-indigo-500"
                                  />
                                </div>
                                <button
                                  onClick={() => handleProcess(file)}
                                  className="w-full mt-2 py-2 bg-indigo-500 text-white text-xs font-semibold rounded hover:bg-indigo-600 transition-colors"
                                >
                                  Apply & Re-process
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Audio Player Section */}
                      {file.status === 'done' && file.blob && (
                        <div className="p-4 border-t border-gray-800">
                           <AudioPlayer rawFile={file.file} processedBlob={file.blob} />
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Sidebar / Options */}
          <div className="space-y-6">
            <div className="bg-[#141417] border border-gray-800 rounded-xl p-6">
              <div className="mb-6 pb-6 border-b border-gray-800">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                  Reference Track
                </h3>
                <input 
                  type="file" 
                  ref={refInputRef} 
                  accept="audio/*,.wav,.mp3,.flac" 
                  className="hidden" 
                  onChange={handleReferenceUpload} 
                />
                
                {referenceFile ? (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-200 truncate pr-2">{referenceFile.name}</span>
                      <button onClick={() => setReferenceFile(null)} className="text-gray-500 hover:text-red-400 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
                      <div>LUFS: <span className="text-gray-200">{referenceFile.stats.lufs.toFixed(1)}</span></div>
                      <div>Peak: <span className="text-gray-200">{(20 * Math.log10(referenceFile.stats.peak || 1e-6)).toFixed(1)} dB</span></div>
                    </div>
                    <div className="mt-2 text-[10px] text-indigo-400 font-medium">EQ Matching Active</div>
                  </div>
                ) : (
                  <button 
                    onClick={() => refInputRef.current?.click()}
                    disabled={isAnalyzingRef}
                    className="w-full py-3 px-4 border-2 border-dashed border-gray-700 hover:border-indigo-500 hover:bg-indigo-500/5 rounded-lg text-sm text-gray-400 hover:text-indigo-400 transition-all flex items-center justify-center gap-2"
                  >
                    {isAnalyzingRef ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                        Analyzing...
                      </span>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Upload Reference
                      </>
                    )}
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                  Upload a commercial track to match its loudness and tonal balance.
                </p>
              </div>
              
              <div className="mb-6 pb-6 border-b border-gray-800">
                <h3 className="font-semibold mb-4 text-sm text-gray-400">Export Format</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Sample Rate</label>
                    <select 
                      value={exportSampleRate}
                      onChange={e => setExportSampleRate(Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 pr-8 text-sm text-gray-300 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em_1em] bg-no-repeat bg-[position:right_0.5rem_center]"
                    >
                      <option value={44100}>44.1 kHz</option>
                      <option value={48000}>48 kHz</option>
                      <option value={88200}>88.2 kHz</option>
                      <option value={96000}>96 kHz</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Bit Depth</label>
                    <select 
                      value={exportBitDepth}
                      onChange={e => setExportBitDepth(Number(e.target.value))}
                      className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2 pr-8 text-sm text-gray-300 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%24%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:1em_1em] bg-no-repeat bg-[position:right_0.5rem_center]"
                    >
                      <option value={16}>16-bit PCM</option>
                      <option value={24}>24-bit PCM</option>
                      <option value={32}>32-bit Float</option>
                    </select>
                  </div>
                </div>
              </div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-400" />
                Mastering Targets
              </h3>
              
              <div className="space-y-3 mb-6">
                {PROFILES.map(profile => (
                  <label 
                    key={profile.id}
                    className={`
                      block relative p-4 rounded-lg border cursor-pointer transition-all
                      ${selectedProfile === profile.id 
                        ? 'border-indigo-500 bg-indigo-500/5' 
                        : 'border-gray-800 bg-gray-900/30 hover:border-gray-700'
                      }
                    `}
                  >
                    <input 
                      type="radio" 
                      name="profile" 
                      value={profile.id}
                      checked={selectedProfile === profile.id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedProfile(val);
                        if (val === 'youtube' || val === 'music') { setTargetLufs(-14); setTargetTruePeak(-1.0); }
                        else if (val === 'tiktok') { setTargetLufs(-11); setTargetTruePeak(-2.0); }
                      }}
                      className="absolute opacity-0 w-0 h-0"
                    />
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{profile.name}</span>
                      {selectedProfile === profile.id && (
                        <CheckCircle className="w-4 h-4 text-indigo-500" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{t(profile.descKey)}</p>
                  </label>
                ))}
              </div>
              
              <div className="space-y-5 pt-4 border-t border-gray-800">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Target LUFS</span>
                    <span className="font-mono text-gray-200">{targetLufs.toFixed(1)}</span>
                  </div>
                  <input aria-label={t("integrated_lufs")} type="range" min="-24" max="-6" step="0.5" value={targetLufs} onChange={(e) => { setTargetLufs(parseFloat(e.target.value)); setSelectedProfile(''); }} className="w-full accent-indigo-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">True Peak Limit</span>
                    <span className="font-mono text-gray-200">{targetTruePeak.toFixed(1)} dB</span>
                  </div>
                  <input aria-label={t("true_peak")} type="range" min="-3" max="0" step="0.1" value={targetTruePeak} onChange={(e) => { setTargetTruePeak(parseFloat(e.target.value)); setSelectedProfile(''); }} className="w-full accent-indigo-500 h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer" />
                </div>
              </div>
                    <div className="mt-6 pt-6 border-t border-gray-800">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      className="sr-only"
                      checked={autoProcess}
                      onChange={(e) => setAutoProcess(e.target.checked)}
                    />
                    <div className={`block w-10 h-6 rounded-full transition-colors ${autoProcess ? 'bg-indigo-500' : 'bg-gray-800'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoProcess ? 'translate-x-4' : ''}`}></div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-200">Auto-Process Files</div>
                    <div className="text-xs text-gray-500 mt-0.5">Start mastering immediately upon upload</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-[#141417] border border-gray-800 rounded-xl p-6">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                DSP Signal Chain
              </h3>
              <div className="space-y-2">
                {[
                  { id: 'step-1', name: 'Input Stage & Analysis', module: 'High-Resolution Analysis' },
                  { id: 'step-2', name: 'Dynamic Equalization', module: '31-Band Phase-Linear EQ' },
                  { id: 'step-3', name: 'Harmonic Exciter', module: 'Multi-Band Saturation' },
                  { id: 'step-4', name: 'Stereo Field', module: 'Dynamic Stereo Width' },
                  { id: 'step-5', name: 'Maximizer', module: 'True Peak Limiter (-1dBTP)' }
                ].map((step, i) => {
                  const activeFile = files.find(f => f.status === 'processing');
                  const errorFile = files.find(f => f.status === 'error');
                  const doneFile = files.find(f => f.status === 'done');
                  
                  let state = 'idle';
                  if (activeFile) {
                    const prog = activeFile.progress;
                    const thresholds = [0, 20, 50, 70, 90, 100];
                    if (prog >= thresholds[i] && prog < thresholds[i+1]) state = 'processing';
                    else if (prog >= thresholds[i+1]) state = 'done';
                  } else if (errorFile) {
                    state = 'error';
                  } else if (doneFile && files.every(f => f.status !== 'processing')) {
                    state = 'done';
                  }

                  return (
                    <div key={step.id} className={`group relative flex items-center justify-between p-3 rounded border transition-all duration-300 ${
                      state === 'processing' ? 'bg-indigo-500/10 border-indigo-500/30' :
                      state === 'done' ? 'bg-green-500/5 border-green-500/20' :
                      'bg-gray-900/50 border-gray-800'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${
                          state === 'processing' ? 'text-indigo-400 bg-indigo-400 animate-pulse' :
                          state === 'done' ? 'text-green-400 bg-green-400' :
                          'text-gray-700 bg-gray-700 shadow-none'
                        }`}></div>
                        <span className={`text-xs font-semibold uppercase tracking-wider ${
                          state === 'processing' ? 'text-indigo-300' :
                          state === 'done' ? 'text-green-300' :
                          'text-gray-400'
                        }`}>{step.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-600 bg-black/30 px-2 py-0.5 rounded">{step.module}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

