import * as Tone from 'tone';
const offlineCtx = new OfflineAudioContext(2, 44100, 44100);
Tone.setContext(new Tone.OfflineContext(offlineCtx));
const osc = offlineCtx.createOscillator();
const widener = new Tone.StereoWidener(0.5);
const out = offlineCtx.createGain();

try {
  Tone.connect(osc, widener);
  console.log("Connect 1 OK");
} catch(e) { console.error("Connect 1 Error", e.message); }

try {
  Tone.connect(widener, out);
  console.log("Connect 2 OK");
} catch(e) { console.error("Connect 2 Error", e.message); }
