import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock AudioContext
class MockAudioContext {
  currentTime = 0;
  sampleRate = 44100;
  createGain = vi.fn(() => ({
    gain: { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn()
  }));
  createDynamicsCompressor = vi.fn(() => ({
    threshold: { value: -24 },
    knee: { value: 30 },
    ratio: { value: 12 },
    attack: { value: 0.003 },
    release: { value: 0.25 },
    connect: vi.fn(),
    disconnect: vi.fn()
  }));
  createBiquadFilter = vi.fn(() => ({
    type: 'lowpass',
    frequency: { value: 350 },
    Q: { value: 1 },
    gain: { value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn()
  }));
  createBufferSource = vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  }));
  decodeAudioData = vi.fn().mockResolvedValue({
    duration: 1,
    length: 44100,
    sampleRate: 44100,
    numberOfChannels: 2,
    getChannelData: vi.fn(() => new Float32Array(44100))
  });
  destination = {
    channelCount: 2
  };
}

class MockOfflineAudioContext extends MockAudioContext {
  public length: number;
  constructor(channels: any, length: any, sampleRate: any) {
    super();
    this.length = length;
  }
  startRendering = vi.fn().mockResolvedValue({
    duration: 1,
    length: 44100,
    sampleRate: 44100,
    numberOfChannels: 2,
    getChannelData: vi.fn(() => new Float32Array(44100))
  });
}

global.window.AudioContext = MockAudioContext as any;
global.window.OfflineAudioContext = MockOfflineAudioContext as any;

global.URL.createObjectURL = vi.fn(() => 'blob:test');
global.URL.revokeObjectURL = vi.fn();
