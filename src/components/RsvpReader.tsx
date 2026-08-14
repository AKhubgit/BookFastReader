import { useState, useEffect, useCallback, useRef } from 'react';
import { Controls } from './Controls';
import { ProgressBar } from './ProgressBar';

interface RsvpReaderProps {
  title: string;
  words: string[];
  onClose: () => void;
}

export function RsvpReader({ title, words, onClose }: RsvpReaderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(300);
  
  const timerRef = useRef<number | null>(null);

  const getDelayMs = useCallback((word: string, currentWpm: number) => {
    let baseDelay = (60 / currentWpm) * 1000;
    
    // Add small pauses for punctuation
    if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
      baseDelay *= 2.0;
    } else if (word.endsWith(',') || word.endsWith(';') || word.endsWith(':')) {
      baseDelay *= 1.5;
    }
    
    return baseDelay;
  }, []);

  const advanceWord = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev >= words.length - 1) {
        setIsPlaying(false);
        return prev;
      }
      return prev + 1;
    });
  }, [words.length]);

  useEffect(() => {
    if (isPlaying && currentIndex < words.length) {
      const currentWord = words[currentIndex];
      const delay = getDelayMs(currentWord, wpm);
      
      timerRef.current = window.setTimeout(advanceWord, delay);
    }

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying, currentIndex, words, wpm, advanceWord, getDelayMs]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(p => !p);
      } else if (e.code === 'ArrowLeft') {
        setCurrentIndex(p => Math.max(0, p - 10));
      } else if (e.code === 'ArrowRight') {
        setCurrentIndex(p => Math.min(words.length - 1, p + 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [words.length]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleRewind = () => setCurrentIndex(p => Math.max(0, p - 10));
  const handleFastForward = () => setCurrentIndex(p => Math.min(words.length - 1, p + 10));
  const handleRestart = () => setCurrentIndex(0);
  const handleSeek = (index: number) => setCurrentIndex(index);

  const renderWords = () => {
    const currentWord = words[currentIndex];
    
    // Optimal Recognition Point (ORP)
    // Generally slightly left of center
    const length = currentWord.length;
    let orpIndex = Math.floor(length / 2);
    if (length > 1) {
      orpIndex = Math.floor((length - 1) / 2);
    }
    if (length > 5) {
      orpIndex = Math.floor(length / 3);
    }

    const before = currentWord.slice(0, orpIndex);
    const pivot = currentWord.slice(orpIndex, orpIndex + 1);
    const after = currentWord.slice(orpIndex + 1);
    
    const prevWord = currentIndex > 0 ? words[currentIndex - 1] : '';
    const nextWord = currentIndex < words.length - 1 ? words[currentIndex + 1] : '';

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', width: '100%' }}>
        <div style={{ flex: 1, textAlign: 'right', fontSize: '3rem', color: 'var(--text-muted)', opacity: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {prevWord}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center', fontSize: '5rem', fontWeight: 600, letterSpacing: '0.05em', minWidth: '400px' }}>
          <span style={{ color: 'var(--text-color)', textAlign: 'right', flex: 1 }}>{before}</span>
          <span style={{ color: 'var(--accent-color)' }}>{pivot}</span>
          <span style={{ color: 'var(--text-color)', textAlign: 'left', flex: 1 }}>{after}</span>
        </div>
        
        <div style={{ flex: 1, textAlign: 'left', fontSize: '3rem', color: 'var(--text-muted)', opacity: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {nextWord}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, opacity: 0.8 }}>{title}</h2>
        <button className="button secondary" onClick={onClose}>Close Book</button>
      </div>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '500px' }}>
        {words.length > 0 && currentIndex < words.length ? (
          <div className="word-display" style={{ width: '100%' }}>
            {renderWords()}
          </div>
        ) : (
          <div>Finished</div>
        )}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <ProgressBar 
          currentIndex={currentIndex} 
          totalWords={words.length} 
          onSeek={handleSeek} 
        />
        <Controls 
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onRewind={handleRewind}
          onFastForward={handleFastForward}
          onRestart={handleRestart}
          wpm={wpm}
          onWpmChange={setWpm}
        />
      </div>
    </div>
  );
}
