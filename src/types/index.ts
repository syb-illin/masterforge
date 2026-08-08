import { AudioReport } from '../lib/audio';

export type AudioFile = {
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
