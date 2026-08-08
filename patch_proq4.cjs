const fs = require('fs');
let content = fs.readFileSync('src/lib/audio.ts', 'utf8');

// 1. Update Oversampling to 8x
content = content.replace("const sampleRate = targetSampleRate * 2;", "const sampleRate = targetSampleRate * 8; // Ultra-high 8x Oversampling (Pro-Q 4 / Pro-L 2 maximum precision)");
content = content.replace("2x Internal Oversampling", "8x Internal Oversampling");

// 2. Implement Dynamic EQ Bands
const eqOld = `  // Transparent, surgical digital EQ bands without harmonic distortion
  for (let i = 0; i < eqFrequencies.length; i++) {
     if (Math.abs(stats.eqOffsets[i]) > 0.1) {
         const band = offlineCtx.createBiquadFilter();
         band.type = 'peaking';
         band.frequency.value = eqFrequencies[i];
         // Variable Q: surgical Q for high gain corrections, wider for subtle
         const qAdjust = Math.min(4.0, Math.max(1.0, Math.abs(stats.eqOffsets[i]) * 0.8));
         band.Q.value = qAdjust; 
         band.gain.value = stats.eqOffsets[i];
         prevStereoNode.connect(band);
         prevStereoNode = band;
     }
  }`;

const eqNew = `  // Transparent, surgical digital EQ bands (Static + Dynamic EQ emulation)
  for (let i = 0; i < eqFrequencies.length; i++) {
     const hasStatic = Math.abs(stats.eqOffsets[i]) > 0.1;
     const hasDynamic = stats.dynEqAmount[i] > 0.1; // Requires dynamic taming
     
     if (hasStatic || hasDynamic) {
         // Base static EQ (can be 0 if only dynamic)
         const staticGain = hasStatic ? stats.eqOffsets[i] : 0;
         const qAdjust = Math.min(4.0, Math.max(1.0, Math.abs(staticGain) * 0.8 + (hasDynamic ? 2.0 : 0)));
         
         if (hasDynamic) {
             // Dynamic EQ topology: Split signal into Bandstop and Bandpass -> Compress Bandpass -> Mix
             const splitter = offlineCtx.createGain();
             prevStereoNode.connect(splitter);
             
             // The rest of the signal (Notch/Bandstop)
             const bandReject = offlineCtx.createBiquadFilter();
             bandReject.type = 'notch';
             bandReject.frequency.value = eqFrequencies[i];
             bandReject.Q.value = qAdjust;
             
             // The dynamic band (Bandpass)
             const bandPass = offlineCtx.createBiquadFilter();
             bandPass.type = 'bandpass';
             bandPass.frequency.value = eqFrequencies[i];
             bandPass.Q.value = qAdjust;
             
             // Dynamic behavior (Compressor just for this band)
             const dynComp = offlineCtx.createDynamicsCompressor();
             dynComp.threshold.value = -30 - (stats.dynEqAmount[i] * 15); // Dynamic threshold based on variance
             dynComp.ratio.value = 1.5 + (stats.dynEqAmount[i] * 2); 
             dynComp.attack.value = 0.005; // Fast attack for resonances
             dynComp.release.value = 0.1;
             
             // Apply static gain to the bandpass path before mixing back
             const makeupGain = offlineCtx.createGain();
             makeupGain.gain.value = Math.pow(10, staticGain / 20);

             // Routing
             splitter.connect(bandReject);
             splitter.connect(bandPass);
             bandPass.connect(dynComp);
             dynComp.connect(makeupGain);
             
             const mixer = offlineCtx.createGain();
             bandReject.connect(mixer);
             makeupGain.connect(mixer);
             
             prevStereoNode = mixer;
         } else {
             // Standard static peaking band
             const band = offlineCtx.createBiquadFilter();
             band.type = 'peaking';
             band.frequency.value = eqFrequencies[i];
             band.Q.value = qAdjust; 
             band.gain.value = staticGain;
             prevStereoNode.connect(band);
             prevStereoNode = band;
         }
     }
  }`;

content = content.replace(eqOld, eqNew);

// 3. Update report text
const reportOld = "eq: `Precision Digital EQ: 31-band surgical parametric matching (FabFilter Pro-Q style) with variable Q-factor for maximum transparency and phase coherence. Precise low-end focus shelf (+1.5dB at 60Hz) and surgical mud removal (-1.5dB at 250Hz, Q=2.0).`,";
const reportNew = "eq: `Precision Digital EQ (Pro-Q 4 Style): 31-band surgical parametric & dynamic matching with 8x oversampling. Dynamic EQ nodes engaged for high-variance resonant frequencies. Maximum transparency and phase coherence. Precise low-end focus shelf (+1.5dB at 60Hz).`,";
content = content.replace(reportOld, reportNew);

fs.writeFileSync('src/lib/audio.ts', content);
