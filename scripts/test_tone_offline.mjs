import * as Tone from 'tone';
import fs from 'fs';
async function test() {
  const offline = new Tone.OfflineContext(2, 48000, 48000);
  Tone.setContext(offline);
  
  const limiter = new Tone.Limiter(-1).toDestination();
  const eq = new Tone.EQ3(2, -1, 3).connect(limiter);
  const cheby = new Tone.Chebyshev(2).connect(eq);
  
  const osc = new Tone.Oscillator(440).connect(cheby).start();
  
  const buffer = await offline.render();
  console.log("Rendered buffer length:", buffer.length);
}
test().catch(console.error);
