import { useCallback, useState } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export function FileUpload({ onFileSelect, isLoading }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.txt') || file.name.endsWith('.epub') || file.name.endsWith('.pdf')) {
        onFileSelect(file);
      } else {
        alert('Please upload a .txt, .epub, or .pdf file');
      }
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className={`glass-panel upload-container ${isDragging ? 'dragging' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      style={{
        padding: '4rem 2rem',
        textAlign: 'center',
        borderStyle: isDragging ? 'solid' : 'dashed',
        borderColor: isDragging ? 'var(--accent-color)' : 'var(--border-color)',
        borderWidth: '2px',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        maxWidth: '500px',
        width: '100%',
        margin: '0 auto',
        opacity: isLoading ? 0.5 : 1,
        pointerEvents: isLoading ? 'none' : 'auto'
      }}
    >
      <input
        type="file"
        accept=".txt,.epub,.pdf"
        onChange={handleChange}
        style={{ display: 'none' }}
        id="file-upload"
      />
      <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Upload size={48} color={isDragging ? 'var(--accent-color)' : 'var(--text-muted)'} style={{ marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>{isLoading ? 'Processing...' : 'Upload a Book'}</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Drag and drop a .txt, .epub, or .pdf file here, or click to select one
        </p>
      </label>
    </div>
  );
}
