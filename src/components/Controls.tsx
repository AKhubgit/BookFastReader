
import { Play, Pause, Rewind, FastForward, RotateCcw } from 'lucide-react';

interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onRewind: () => void;
  onFastForward: () => void;
  onRestart: () => void;
  wpm: number;
  onWpmChange: (wpm: number) => void;
}

export function Controls({
  isPlaying,
  onPlayPause,
  onRewind,
  onFastForward,
  onRestart,
  wpm,
  onWpmChange,
}: ControlsProps) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
        <button className="button secondary icon-button" onClick={onRestart} title="Restart">
          <RotateCcw size={20} />
        </button>
        <button className="button secondary icon-button" onClick={onRewind} title="Rewind 10 words">
          <Rewind size={24} />
        </button>
        
        <button 
          className="button icon-button" 
          onClick={onPlayPause}
          style={{ width: '60px', height: '60px', borderRadius: '30px' }}
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" style={{ marginLeft: '4px' }} />}
        </button>
        
        <button className="button secondary icon-button" onClick={onFastForward} title="Forward 10 words">
          <FastForward size={24} />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', minWidth: '60px' }}>Speed</span>
        <input 
          type="range" 
          min="100" 
          max="1000" 
          step="10" 
          value={wpm}
          onChange={(e) => onWpmChange(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--accent-color)' }}
        />
        <span style={{ fontSize: '0.9rem', fontWeight: 600, minWidth: '60px', textAlign: 'right' }}>{wpm} WPM</span>
      </div>
    </div>
  );
}
