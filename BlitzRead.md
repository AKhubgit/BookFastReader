# BlitzRead ⚡️📖

**BlitzRead** is a high-performance, web-based speed reading application built around the Rapid Serial Visual Presentation (RSVP) technique. It is designed to help users consume written content—such as plain text, EPUB books, and PDF documents—at incredibly high speeds (often 300 to 1000+ words per minute) by minimizing the eye movements (saccades) traditionally required for reading.

## Current Status and Features
The project is currently in an advanced, highly functional state. It features a sleek, dark-themed, glassmorphic UI with a focus on deep immersion and minimal distractions. 

**Key Features:**
- **Multi-Format Support:** Instantly parses and reads `.txt`, `.epub`, and `.pdf` files.
- **Dynamic RSVP Engine:** Flashes words one by one perfectly centered on the screen. 
- **Smart Pacing:** Automatically adds microscopic pauses for punctuation (commas, periods, question marks) to improve comprehension at high speeds.
- **Context Words:** Configurable setting to show 1 to 10 surrounding context words (ghosted in the background) to help anchor the reader.
- **Advanced PDF Dual-View:** A fully synchronized split-screen mode for PDFs. As the RSVP flashes a word, the actual visual PDF document automatically scrolls and highlights the exact word on the original page.
- **Integrated Dictionary:** One-click dictionary lookup for the current word, utilizing multiple fallback APIs to ensure definitions are always found.
- **Customizable Experience:** Adjustable text sizing (50% - 200%), adjustable WPM speed, auto-hiding controls, and fullscreen toggle.
- **Draggable Split Layout:** The screen real estate between the RSVP reader and the PDF document can be dynamically resized by dragging a central splitter.

## Languages and Technologies
- **Core:** React 18, TypeScript, HTML5, CSS3.
- **Build Tool:** Vite (for lightning-fast HMR and proxy configuration).
- **Styling:** Vanilla CSS with CSS Variables, Flexbox, and Glassmorphism design principles.
- **Icons:** `lucide-react` for clean, scalable vector icons.
- **Parsing Libraries:** 
  - `epubjs`: For extracting text flows from complex EPUB package structures.
  - `pdfjs-dist` / `react-pdf`: For rendering PDF canvases and extracting raw text alongside spatial metadata (page numbers and item indices).

## How It Works: A Technical Overview
BlitzRead is separated into two major phases: **Parsing** and **Playback**.

### 1. Parsing (`parser.ts`)
When a user uploads a file, it is processed entirely client-side using the `FileReader` API. 
- For **TXT**, it reads the string and splits it by whitespace.
- For **EPUB**, it utilizes `epubjs` to navigate the spine, load each chapter, extract the text content from the DOM elements, and concatenate it.
- For **PDF**, it uses `pdfjs-dist` to iterate through every page. It extracts not only the text but also the physical location (page number and text-item index) of every single word. This metadata is saved into a `pdfLocations` map.

### 2. Playback (`RsvpReader.tsx`)
The parsed text is fed into the RSVP Engine as an array of strings. 
- **The Loop:** A `useEffect` hook powered by `setTimeout` recursively advances the `currentIndex` based on the user's selected WPM. 
- **Optimal Recognition Point (ORP):** For every word, the engine calculates the ORP (usually just left of the center). The word is split into three parts: the left side, the pivot letter (highlighted in the primary accent color), and the right side. This perfectly aligns the user's fovea.
- **PDF Synchronization:** If a PDF is loaded, a second viewport renders the document via `react-pdf`. Using the `pdfLocations` map, BlitzRead intercepts the PDF's text layer rendering and injects a yellow `<mark>` HTML tag around the currently active word. 
- **Auto-Scroll & Tracking:** A layout effect observes the injected `<mark>` tag and commands the browser to `scrollIntoView`, keeping the highlighted text perfectly centered in the lower window while the reader progresses.

## Project Evolution & Changelog
BlitzRead has undergone several rapid iterations to reach its current state:

1. **Initial Setup:** Bootstrapped the Vite/React environment with a dark theme and custom CSS variables.
2. **Core RSVP Engine:** Built the fundamental reading loop, play/pause states, WPM calculation, and ORP text alignment.
3. **Multi-Format Parsing:** Added support for `.txt` and integrated `epubjs` for `.epub` parsing.
4. **Context & Sizing:** Added the settings menu, allowing users to tweak the text scale and display 1-10 surrounding words to reduce the "tunnel vision" effect of standard RSVP.
5. **Dictionary Integration:** Built a dictionary feature using `dictionaryapi.dev` with a `datamuse` fallback. Implemented a Vite proxy to bypass ad-blocker and CORS restrictions.
6. **PDF Integration (Phase 1):** Integrated `pdfjs-dist` to extract raw text from PDFs so they could be read in the RSVP engine.
7. **PDF Dual-View (Phase 2):** Integrated `react-pdf`. Mapped RSVP array indices to physical PDF locations. Built the split-screen UI.
8. **PDF Synchronization (Phase 3):** Implemented the dynamic `<mark>` highlighting in the PDF text layer and the `scrollIntoView` auto-tracking.
9. **Layout Constraints:** Re-architected the Flexbox CSS to prevent the PDF's height from breaking the page boundaries, ensuring controls are always visible.
10. **Refinements & Controls:** Added zoom-in/zoom-out buttons for the PDF, a toggle to lock/unlock auto-scrolling, rounded black borders for visual distinction, and a completely draggable UI splitter to dynamically resize the dual-view panels.
