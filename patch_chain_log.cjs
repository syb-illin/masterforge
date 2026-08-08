const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldSection = `                                <div className="mt-4 pt-4 border-t border-gray-800">
                                   <h6 className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">Dynamic M/S EQ Curve</h6>
                                   <EqVisualizer eqOffsets={file.report.analysis.eqOffsets} sideEqOffsets={file.report.analysis.sideEqOffsets} />
                                </div>`;

const newSection = `                                <div className="mt-6 pt-4 border-t border-gray-800">
                                   <h6 className="text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider flex items-center gap-2"><Settings className="w-3.5 h-3.5" /> Processing Chain Log</h6>
                                   <div className="space-y-3 mb-6 text-[13px] text-gray-300">
                                     <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800/80">
                                       <span className="text-indigo-400 font-medium block mb-1">Gain Staging & DC Offset</span>
                                       {file.report.processing.gainStaging || 'Standard offset applied'}
                                     </div>
                                     <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800/80">
                                       <span className="text-indigo-400 font-medium block mb-1">Dynamic M/S EQ</span>
                                       {file.report.processing.eq || 'Surgical digital parametric EQ matching'}
                                     </div>
                                     <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800/80">
                                       <span className="text-indigo-400 font-medium block mb-1">Saturation & Excitement</span>
                                       {file.report.processing.saturation}
                                     </div>
                                     <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800/80">
                                       <span className="text-indigo-400 font-medium block mb-1">Stereo Imaging</span>
                                       {file.report.processing.stereo}
                                     </div>
                                     <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800/80">
                                       <span className="text-indigo-400 font-medium block mb-1">Glue Comp & True Peak Limiter</span>
                                       {file.report.processing.leveling}
                                     </div>
                                   </div>
                                   <h6 className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">Dynamic M/S EQ Curve</h6>
                                   <EqVisualizer eqOffsets={file.report.analysis.eqOffsets} sideEqOffsets={file.report.analysis.sideEqOffsets} />
                                </div>`;

content = content.replace(oldSection, newSection);

// Add Settings to lucide-react import
if (!content.includes('Settings,')) {
    content = content.replace('UploadCloud, ', 'UploadCloud, Settings, ');
}

fs.writeFileSync('src/App.tsx', content);
