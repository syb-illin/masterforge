import * as Tone from 'tone';
async function test() {
  const duration = 1;
  const buffer = await Tone.Offline(async ({ transport }) => {
     const source = new Tone.Oscillator(440, "sine").start(0);
     const eq = new Tone.EQ3(2, 0, 2);
     const sat = new Tone.Chebyshev(2);
     const comp = new Tone.MultibandCompressor({
        low: { threshold: -24 },
        mid: { threshold: -24 },
        high: { threshold: -24 }
     });
     const limiter = new Tone.Limiter(-1);
     
     source.chain(eq, sat, comp, limiter, Tone.Destination);
  }, duration);
  
  console.log("Buffer length:", buffer.length);
}
test().catch(console.error);
