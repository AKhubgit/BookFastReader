

interface ProgressBarProps {
  currentIndex: number;
  totalWords: number;
  onSeek: (index: number) => void;
}

export function ProgressBar({ currentIndex, totalWords, onSeek }: ProgressBarProps) {
  const progress = totalWords > 0 ? (currentIndex / (totalWords - 1)) * 100 : 0;

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newIndex = Math.floor(percentage * (totalWords - 1));
    onSeek(Math.max(0, Math.min(newIndex, totalWords - 1)));
  };

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '1rem auto' }}>
      <div 
        style={{ 
          height: '8px', 
          backgroundColor: 'var(--bg-color-glass)', 
          borderRadius: '4px',
          overflow: 'hidden',
          cursor: 'pointer',
          border: '1px solid var(--border-color)'
        }}
        onClick={handleContainerClick}
      >
        <div 
          style={{ 
            height: '100%', 
            width: `${progress}%`, 
            backgroundColor: 'var(--accent-color)',
            transition: 'width 0.1s linear'
          }} 
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <span>Word {currentIndex + 1}</span>
        <span>{Math.round(progress)}%</span>
        <span>{totalWords} Words</span>
      </div>
    </div>
  );
}
