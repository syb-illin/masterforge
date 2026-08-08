import { render } from '@testing-library/react';
import { vi, describe, it, beforeEach } from 'vitest';
import App from './App';
import './i18n';

vi.mock('./lib/audio', () => ({
  processAudio: vi.fn(),
  getReferenceTargets: vi.fn(),
  guessGenre: vi.fn()
}));

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));
vi.mock('jszip', () => ({
  default: vi.fn().mockImplementation(() => ({
    file: vi.fn(),
    generateAsync: vi.fn().mockResolvedValue(new Blob())
  }))
}));

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders correctly', () => {
    render(<App />);
  });
});
