import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AudioPlayer } from './AudioPlayer';

vi.mock('lucide-react', () => ({
  Play: () => <div data-testid="icon-play">Play</div>,
  Pause: () => <div data-testid="icon-pause">Pause</div>,
  Download: () => <div data-testid="icon-download">Download</div>,
}));

describe('AudioPlayer', () => {
  const mockFile = new File([''], 'test.wav', { type: 'audio/wav' });

  it('renders correctly with just raw file', async () => {
    await act(async () => {
      render(<AudioPlayer rawFile={mockFile} />);
    });
    expect(screen.getByTestId('icon-play')).toBeInTheDocument();
  });

  it('renders processed button if processedBlob is provided', async () => {
    const mockBlob = new Blob([''], { type: 'audio/wav' });
    await act(async () => {
      render(<AudioPlayer rawFile={mockFile} processedBlob={mockBlob} />);
    });
    expect(screen.getByText('Active (Mastered)')).toBeInTheDocument();
  });

  it('can switch modes if processedBlob is provided', async () => {
    const mockBlob = new Blob([''], { type: 'audio/wav' });
    await act(async () => {
      render(<AudioPlayer rawFile={mockFile} processedBlob={mockBlob} />);
    });
    
    const masteredBtn = screen.getByText('Active (Mastered)');
    await act(async () => {
      fireEvent.click(masteredBtn);
    });
    expect(masteredBtn).toHaveClass('bg-indigo-500'); 
  });
});
