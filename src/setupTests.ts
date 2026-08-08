import '@testing-library/jest-dom';

class MockAudioContext {
  createGain() {
    return {
      connect: () => {},
      gain: { value: 1, setValueAtTime: () => {}, setTargetAtTime: () => {} }
    };
  }
  createBufferSource() {
    return {
      connect: () => {},
      start: () => {},
      stop: () => {},
      disconnect: () => {},
      buffer: null
    };
  }
  createAnalyser() {
    return {
      connect: () => {},
      getByteFrequencyData: () => {},
      getFloatTimeDomainData: () => {},
      frequencyBinCount: 1024,
      smoothingTimeConstant: 0.8,
      fftSize: 2048
    };
  }
  createChannelSplitter() {
    return {
      connect: () => {}
    };
  }
  decodeAudioData() {
    return Promise.resolve({
      duration: 100,
      length: 441000,
      numberOfChannels: 2,
      sampleRate: 44100,
      getChannelData: () => new Float32Array(441000)
    });
  }
  close() {
    return Promise.resolve();
  }
  get currentTime() {
    return 0;
  }
}
(window as any).AudioContext = MockAudioContext;
(window as any).webkitAudioContext = MockAudioContext;

(window as any).URL.createObjectURL = () => 'blob:test';
(window as any).URL.revokeObjectURL = () => {};

if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    }),
  });
}

const mockCanvasContext = new Proxy({}, {
  get: (target, prop) => {
    if (prop === 'measureText') return () => ({ width: 10 });
    if (prop === 'createLinearGradient') return () => ({ addColorStop: () => {} });
    return () => {};
  }
});

(HTMLCanvasElement.prototype as any).getContext = () => mockCanvasContext;
