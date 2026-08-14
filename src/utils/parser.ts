import ePub, { Book } from 'epubjs';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;

export interface ParsedBook {
  title: string;
  words: string[];
}

export async function parseTxtFile(file: File): Promise<ParsedBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Split text into words (handling punctuation intelligently if needed, but basic space split is fine for now)
      const words = text.split(/\s+/).filter(word => word.length > 0);
      resolve({
        title: file.name.replace('.txt', ''),
        words
      });
    };
    reader.onerror = (e) => reject(e);
    reader.readAsText(file);
  });
}

export async function parseEpubFile(file: File): Promise<ParsedBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const book: Book = ePub(arrayBuffer);
        await book.ready;
        
        let fullText = '';
        const spine = book.spine as any; // spine items
        
        // This is a naive extraction. For a robust reader we might want to paginate or stream,
        // but for a simple web demo we extract all text.
        for (let i = 0; i < spine.length; i++) {
          const item = spine.get(i);
          const doc = await item.load(book.load.bind(book));
          if (doc && doc.body) {
            fullText += doc.body.textContent + ' ';
          }
        }
        
        const metadata = await book.loaded.metadata;
        const title = metadata.title || file.name.replace('.epub', '');
        
        const words = fullText.split(/\s+/).filter(word => word.length > 0);
        
        resolve({
          title,
          words
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

export async function parsePdfFile(file: File): Promise<ParsedBook> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + ' ';
        }
        
        const words = fullText.split(/\s+/).filter(word => word.length > 0);
        
        resolve({
          title: file.name.replace('.pdf', ''),
          words
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (e) => reject(e);
    reader.readAsArrayBuffer(file);
  });
}

export async function parseFile(file: File): Promise<ParsedBook> {
  if (file.name.endsWith('.epub')) {
    return parseEpubFile(file);
  } else if (file.name.endsWith('.txt')) {
    return parseTxtFile(file);
  } else if (file.name.endsWith('.pdf')) {
    return parsePdfFile(file);
  } else {
    throw new Error("Unsupported file format");
  }
}
