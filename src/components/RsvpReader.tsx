import { useState, useEffect, useCallback, useRef } from 'react';
import { Maximize, Settings, X, Search, FileText } from 'lucide-react';
import { Controls } from './Controls';
import { ProgressBar } from './ProgressBar';
import type { ParsedBook } from '../utils/parser';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface RsvpReaderProps {
  book: ParsedBook;
  onClose: () => void;
}

export function RsvpReader({ book, onClose }: RsvpReaderProps) {
  const { title, words, file, pdfLocations } = book;
  const isPdf = file?.name.endsWith('.pdf');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [wpm, setWpm] = useState(300);
  const [showSettings, setShowSettings] = useState(false);
  const [hideControls, setHideControls] = useState(false);
  const [displayWordCount, setDisplayWordCount] = useState(3);
  const [textSize, setTextSize] = useState(100);
  const [showDefinition, setShowDefinition] = useState(false);
  const [definitionData, setDefinitionData] = useState<any>(null);
  const [isFetchingDefinition, setIsFetchingDefinition] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  
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

  // Scroll active PDF word into view
  useEffect(() => {
    if (showPdf && isPdf) {
      const activeEl = document.getElementById('active-pdf-word');
      if (activeEl) {
        // smooth scrolling might be too slow for fast RSVP, use instant or smooth depending on wpm if needed
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentIndex, showPdf, isPdf]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);
  const handleRewind = () => setCurrentIndex(p => Math.max(0, p - 10));
  const handleFastForward = () => setCurrentIndex(p => Math.min(words.length - 1, p + 10));
  const handleRestart = () => setCurrentIndex(0);
  const handleSeek = (index: number) => setCurrentIndex(index);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleShowDefinition = async () => {
    setIsPlaying(false);
    setShowDefinition(true);
    setDefinitionData(null);
    setIsFetchingDefinition(true);
    
    const currentWord = words[currentIndex] || '';
    const cleanWord = currentWord.replace(/[^a-zA-Z]/g, '').toLowerCase();
    
    if (!cleanWord) {
      setIsFetchingDefinition(false);
      setDefinitionData({ error: 'No valid word to define.' });
      return;
    }
    
    try {
      const response = await fetch(`/api/dictionary/${cleanWord}`);
      if (!response.ok) {
        // Try fallback to datamuse
        const fallback = await fetch(`/api/datamuse/words?sp=${cleanWord}&md=d&max=1`);
        if (fallback.ok) {
          const fallbackData = await fallback.json();
          if (fallbackData && fallbackData.length > 0 && fallbackData[0].defs) {
            // Group by part of speech
            const meaningsMap: Record<string, any[]> = {};
            fallbackData[0].defs.forEach((defStr: string) => {
              const [pos, def] = defStr.split('\t');
              if (!meaningsMap[pos]) meaningsMap[pos] = [];
              meaningsMap[pos].push({ definition: def });
            });
            
            const meanings = Object.keys(meaningsMap).map(pos => ({
              partOfSpeech: pos,
              definitions: meaningsMap[pos]
            }));
            
            setDefinitionData({ meanings });
            setIsFetchingDefinition(false);
            return;
          }
        }
        throw new Error(`Definition not found for "${cleanWord}"`);
      }
      const data = await response.json();
      setDefinitionData(data[0]);
    } catch (err: any) {
      setDefinitionData({ error: err.message || 'Definition not found.' });
    } finally {
      setIsFetchingDefinition(false);
    }
  };

  const renderWords = () => {
    const scale = textSize / 100;
    const currentWord = words[currentIndex] || '';
    
    // Optimal Recognition Point (ORP)
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
    
    // Calculate words before and after based on displayWordCount
    const totalSideWords = displayWordCount - 1;
    const wordsBeforeCount = Math.floor(totalSideWords / 2);
    const wordsAfterCount = Math.ceil(totalSideWords / 2);
    
    const prevWords = [];
    for (let i = wordsBeforeCount; i > 0; i--) {
      if (currentIndex - i >= 0) {
        prevWords.push(words[currentIndex - i]);
      } else {
        prevWords.push('');
      }
    }
    
    const nextWords = [];
    for (let i = 1; i <= wordsAfterCount; i++) {
      if (currentIndex + i < words.length) {
        nextWords.push(words[currentIndex + i]);
      } else {
        nextWords.push('');
      }
    }

    const renderSideWords = (sideWords: string[], align: 'right' | 'left') => (
      <div style={{ flex: 1, display: 'flex', gap: `${2 * scale}rem`, justifyContent: align === 'right' ? 'flex-end' : 'flex-start', overflow: 'hidden' }}>
        {sideWords.map((w, i) => (
          <div key={i} style={{ fontSize: `${5 * scale}rem`, color: 'var(--text-muted)', opacity: 0.5, whiteSpace: 'nowrap' }}>
            {w}
          </div>
        ))}
      </div>
    );

    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: `${4 * scale}rem`, width: '100%' }}>
        {renderSideWords(prevWords, 'right')}
        
        <div style={{ display: 'flex', justifyContent: 'center', fontSize: `${9 * scale}rem`, fontWeight: 600, letterSpacing: '0.05em', minWidth: `${500 * scale}px` }}>
          <span style={{ color: 'var(--text-color)', textAlign: 'right', flex: 1 }}>{before}</span>
          <span style={{ color: 'var(--accent-color)' }}>{pivot}</span>
          <span style={{ color: 'var(--text-color)', textAlign: 'left', flex: 1 }}>{after}</span>
        </div>
        
        {renderSideWords(nextWords, 'left')}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', padding: '2rem' }}>
      <div className={hideControls ? 'auto-hide' : ''} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, opacity: 0.8 }}>{title}</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isPdf && (
            <button className="button secondary icon-button" onClick={() => setShowPdf(!showPdf)} title="Show PDF" style={{ background: showPdf ? 'rgba(255,255,255,0.2)' : undefined }}>
              <FileText size={20} />
            </button>
          )}
          <button className="button secondary icon-button" onClick={handleShowDefinition} title="Define Word">
            <Search size={20} />
          </button>
          <button className="button secondary icon-button" onClick={() => setShowSettings(true)} title="Settings">
            <Settings size={20} />
          </button>
          <button className="button secondary icon-button" onClick={handleFullscreen} title="Toggle Fullscreen">
            <Maximize size={20} />
          </button>
          <button className="button danger" onClick={onClose}>Close Book</button>
        </div>
      </div>
      
      <div style={{ flex: showPdf ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: showPdf ? '30vh' : '60vh' }}>
        {words.length > 0 && currentIndex < words.length ? (
          <div className="word-display" style={{ width: '100%' }}>
            {renderWords()}
          </div>
        ) : (
          <div>Finished</div>
        )}
      </div>

      {showPdf && isPdf && file && (
        <div style={{ flex: 0.6, borderTop: '1px solid var(--border-color)', overflowY: 'auto', backgroundColor: '#e5e7eb', display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
          <Document file={file} loading={<div style={{ color: '#000' }}>Loading PDF...</div>}>
            <Page 
              pageNumber={pdfLocations?.[currentIndex]?.pageNumber || 1} 
              customTextRenderer={({ str, itemIndex }) => {
                if (pdfLocations?.[currentIndex]?.itemIndex === itemIndex) {
                  return `<mark id="active-pdf-word" style="background-color: yellow; color: black; border-radius: 2px;">${str}</mark>`;
                }
                return str;
              }}
              renderAnnotationLayer={false}
              width={Math.min(window.innerWidth - 64, 800)}
            />
          </Document>
        </div>
      )}

      <div className={hideControls ? 'auto-hide' : ''} style={{ marginTop: 'auto' }}>
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

      {showSettings && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{ width: '400px', padding: '2rem', position: 'relative' }}>
            <button 
              className="button secondary icon-button" 
              onClick={() => setShowSettings(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Settings</h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <label htmlFor="hide-controls" style={{ fontSize: '1.1rem' }}>Auto-Hide Controls</label>
              <input 
                type="checkbox" 
                id="hide-controls"
                checked={hideControls}
                onChange={(e) => setHideControls(e.target.checked)}
                style={{ width: '1.25rem', height: '1.25rem' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <label htmlFor="word-count" style={{ fontSize: '1.1rem' }}>Words Displayed: {displayWordCount}</label>
              <input 
                type="range" 
                id="word-count"
                min="1"
                max="10"
                value={displayWordCount}
                onChange={(e) => setDisplayWordCount(parseInt(e.target.value))}
                style={{ width: '150px' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <label htmlFor="text-size" style={{ fontSize: '1.1rem' }}>Text Size: {textSize}%</label>
              <input 
                type="range" 
                id="text-size"
                min="50"
                max="200"
                step="10"
                value={textSize}
                onChange={(e) => setTextSize(parseInt(e.target.value))}
                style={{ width: '150px' }}
              />
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Hover over top/bottom edges while reading to reveal hidden controls.
            </p>
          </div>
        </div>
      )}

      {showDefinition && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-panel" style={{ width: '500px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto', padding: '2rem', position: 'relative' }}>
            <button 
              className="button secondary icon-button" 
              onClick={() => setShowDefinition(false)}
              style={{ position: 'absolute', top: '1rem', right: '1rem', border: 'none' }}
            >
              <X size={20} />
            </button>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', textTransform: 'capitalize' }}>
              {words[currentIndex]?.replace(/[^a-zA-Z]/g, '') || 'Word'}
            </h3>
            
            {isFetchingDefinition ? (
              <p style={{ color: 'var(--text-muted)' }}>Loading definition...</p>
            ) : definitionData?.error ? (
              <p style={{ color: '#ef4444' }}>{definitionData.error}</p>
            ) : definitionData ? (
              <div>
                {definitionData.meanings.map((meaning: any, i: number) => (
                  <div key={i} style={{ marginBottom: '1rem' }}>
                    <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem', fontStyle: 'italic' }}>{meaning.partOfSpeech}</h4>
                    <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-color)', opacity: 0.9 }}>
                      {meaning.definitions.slice(0, 3).map((def: any, j: number) => (
                        <li key={j} style={{ marginBottom: '0.5rem' }}>{def.definition}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
