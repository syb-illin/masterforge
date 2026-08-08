const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

if (!content.includes('EqVisualizer')) {
    content = content.replace(
        "import { AudioPlayer } from './components/AudioPlayer';",
        "import { AudioPlayer } from './components/AudioPlayer';\nimport { EqVisualizer } from './components/EqVisualizer';"
    );
    
    const targetDiv = `                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>`;
                      
    const replacementDiv = `                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-800">
                                   <h6 className="text-xs text-gray-500 font-medium mb-3 uppercase tracking-wider">Dynamic M/S EQ Curve</h6>
                                   <EqVisualizer eqOffsets={file.report.analysis.eqOffsets} sideEqOffsets={file.report.analysis.sideEqOffsets} />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>`;
                      
    content = content.replace(targetDiv, replacementDiv);
    fs.writeFileSync('src/App.tsx', content);
}
