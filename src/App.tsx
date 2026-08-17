import { useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { RsvpReader } from './components/RsvpReader';
import { parseFile, type ParsedBook } from './utils/parser';

function App() {
  const [book, setBook] = useState<ParsedBook | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const parsedBook = await parseFile(file);
      if (parsedBook.words.length === 0) {
        throw new Error("No words found in the file.");
      }
      setBook(parsedBook);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setBook(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflow: 'hidden' }}>
      <header style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: 'var(--accent-color)' }}>Blitz</span>Read
        </h1>
        {book && <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Reading: {book.title}</span>}
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: book ? '0' : '2rem', overflow: 'hidden' }}>
        {error && (
          <div style={{ position: 'absolute', top: '5rem', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', padding: '1rem', borderRadius: '8px', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        {!book ? (
          <div style={{ width: '100%', maxWidth: '800px' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Read faster, understand better.</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                Upload your favorite book or article and read it one word at a time using Rapid Serial Visual Presentation.
              </p>
            </div>
            <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
          </div>
        ) : (
          <RsvpReader book={book} onClose={handleClose} />
        )}
      </main>
    </div>
  );
}

export default App;
