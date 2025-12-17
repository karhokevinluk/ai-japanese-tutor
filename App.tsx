import React, { useState, useEffect, useRef } from 'react';
import { CharacterType, CharacterData, EvaluationResult } from './types';
import { fetchCharacterList, evaluateHandwriting } from './services/gemini';
import { DrawingPad } from './components/DrawingPad';
import { ResultsModal } from './components/ResultsModal';

export default function App() {
  const [hasMounted, setHasMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CharacterType>(CharacterType.HIRAGANA);
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [selectedChar, setSelectedChar] = useState<CharacterData | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  type FontStyle = 'serif' | 'sans' | 'textbook' | 'calligraphy';
  const [selectedFont, setSelectedFont] = useState<FontStyle>('textbook');

  const [isChallengeMode, setIsChallengeMode] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showOverlayRef, setShowOverlayRef] = useState(true);
  const [isReferenceHidden, setIsReferenceHidden] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Verification that the component actually mounts
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const loadCharacters = async () => {
      setIsLoadingList(true);
      setError(null);
      try {
        const list = await fetchCharacterList(selectedCategory);
        setCharacters(list);
        if (list.length > 0 && !isChallengeMode) {
          setSelectedChar(list[0]);
        }
      } catch (err: any) {
        console.error("Initialization Error:", err);
        setError(err.message || "Failed to connect to the AI service.");
      } finally {
        setIsLoadingList(false);
      }
    };
    if (hasMounted) {
      loadCharacters();
    }
  }, [selectedCategory, hasMounted]);

  useEffect(() => {
    if (isChallengeMode) {
      setIsReferenceHidden(true);
      setShowOverlayRef(false);
      pickRandomCharacter();
    } else {
      setIsReferenceHidden(false);
      setShowOverlayRef(true);
    }
  }, [isChallengeMode]);

  const pickRandomCharacter = () => {
    if (characters.length === 0) return;
    const randomIndex = Math.floor(Math.random() * characters.length);
    setSelectedChar(characters[randomIndex]);
    clearCanvas();
  };

  useEffect(() => {
    clearCanvas();
    if (!isChallengeMode) setShowOverlayRef(true);
  }, [selectedChar]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleEvaluate = async () => {
    if (!selectedChar || !canvasRef.current) return;
    setShowModal(true);
    setIsEvaluating(true);
    setEvaluationResult(null);
    try {
      const imageBase64 = canvasRef.current.toDataURL('image/png');
      const result = await evaluateHandwriting(selectedChar.char, imageBase64);
      setEvaluationResult(result);
    } catch (err: any) {
      console.error("Evaluation Error:", err);
      // We don't set global error here to keep the drawing pad visible, 
      // the modal will handle the null result state.
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (isChallengeMode) setIsReferenceHidden(false);
  };

  const handleNextChallenge = () => {
    pickRandomCharacter();
    setIsReferenceHidden(true);
  };

  const getFontClass = (font: FontStyle) => {
    switch (font) {
      case 'serif': return 'font-serif';
      case 'sans': return 'font-sans';
      case 'textbook': return 'font-textbook';
      case 'calligraphy': return 'font-calligraphy';
      default: return 'font-textbook';
    }
  };

  if (!hasMounted) {
    return <div className="min-h-screen bg-paper-warm flex items-center justify-center font-serif text-stone-400">Loading ZenCalligraphy...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-warm p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md text-center border-t-4 border-seal-red">
          <div className="text-seal-red text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold mb-2 text-stone-800 font-serif">Configuration Required</h1>
          <p className="text-stone-600 mb-6 text-sm">{error}. Make sure you have added your API_KEY to the Vercel Environment Variables.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-stone-800 text-white px-6 py-2 rounded-md hover:bg-black transition-colors font-bold text-xs uppercase tracking-widest"
          >
            Refresh App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper-warm text-stone-800 font-sans flex flex-col md:flex-row">
      <aside className={`w-full md:w-80 bg-stone-100 border-r border-stone-200 flex flex-col h-[40vh] md:h-screen transition-all ${isChallengeMode ? 'opacity-50 pointer-events-none grayscale' : 'opacity-100'}`}>
        <div className="p-6 border-b border-stone-200 bg-paper-white">
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2 text-stone-800">
            <span className="bg-seal-red text-white w-8 h-8 flex items-center justify-center rounded-sm text-sm">Zen</span>
            Calligraphy
          </h1>
          <p className="text-xs text-stone-500 mt-1">AI-Powered Japanese Tutor</p>
        </div>

        <div className="p-4 grid grid-cols-2 gap-2">
          {Object.values(CharacterType).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedCategory(type)}
              className={`px-3 py-2 text-xs font-bold uppercase rounded-md transition-colors ${
                selectedCategory === type 
                ? 'bg-stone-800 text-white' 
                : 'bg-white border border-stone-300 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {isLoadingList ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin h-6 w-6 border-2 border-stone-800 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {characters.map((char) => (
                <button
                  key={char.char}
                  onClick={() => setSelectedChar(char)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-md border transition-all ${
                    selectedChar?.char === char.char
                    ? 'bg-white border-seal-red ring-1 ring-seal-red shadow-md'
                    : 'bg-white/50 border-stone-200 hover:bg-white hover:border-stone-400'
                  }`}
                >
                  <span className={`text-xl ${getFontClass(selectedFont)}`}>{char.char}</span>
                  <span className="text-[10px] text-stone-500 font-medium">{char.romaji}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-y-auto h-screen">
        <div className="w-full flex flex-col md:flex-row justify-between items-center p-4 gap-4">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-stone-200 shadow-sm">
                <span className="text-xs font-bold text-stone-500 uppercase">Style:</span>
                <select 
                    value={selectedFont} 
                    onChange={(e) => setSelectedFont(e.target.value as FontStyle)}
                    className="text-sm font-medium text-stone-700 bg-transparent outline-none cursor-pointer"
                >
                    <option value="textbook">Textbook (Klee One)</option>
                    <option value="calligraphy">Brush (Yuji Syuku)</option>
                    <option value="serif">Mincho (Serif)</option>
                    <option value="sans">Gothic (Sans)</option>
                </select>
            </div>

            <div className="bg-stone-200 p-1 rounded-lg flex items-center shadow-inner">
                <button onClick={() => setIsChallengeMode(false)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${!isChallengeMode ? 'bg-white shadow text-stone-800' : 'text-stone-500 hover:text-stone-700'}`}>Practice</button>
                <button onClick={() => setIsChallengeMode(true)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${isChallengeMode ? 'bg-seal-red shadow text-white' : 'text-stone-500 hover:text-stone-700'}`}>Challenge</button>
            </div>
        </div>

        <div className="flex-1 flex flex-col items-center p-4 md:p-8">
            {selectedChar ? (
            <div className="w-full max-w-2xl flex flex-col items-center gap-8">
                <div className="text-center space-y-2 min-h-[100px] flex flex-col justify-end">
                    {isChallengeMode && isReferenceHidden ? (
                         <div className="animate-pulse flex flex-col items-center">
                             <p className="text-stone-400 font-bold uppercase tracking-widest text-xs mb-2">Challenge</p>
                             <h2 className="text-4xl font-bold text-stone-700 mb-2">Write: <span className="text-seal-red underline">{selectedChar.meaning || selectedChar.romaji}</span></h2>
                             {selectedChar.meaning && <p className="text-stone-500 text-lg">({selectedChar.romaji})</p>}
                         </div>
                    ) : (
                        <>
                            <div className="flex items-center justify-center gap-3">
                                <h2 className={`text-6xl ${getFontClass(selectedFont)} text-ink-black`}>{selectedChar.char}</h2>
                                <div className="text-left">
                                    <p className="text-xl font-bold text-stone-600">{selectedChar.romaji}</p>
                                    {selectedChar.meaning && <p className="text-sm text-stone-500 italic">{selectedChar.meaning}</p>}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-center justify-center w-full">
                    {(!isChallengeMode || !isReferenceHidden) ? (
                        <div className="w-[300px] h-[300px] bg-white border border-stone-200 shadow-sm flex items-center justify-center relative rounded-sm">
                            <div className="absolute inset-0 pointer-events-none opacity-20">
                                <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-red-500 transform -translate-x-1/2"></div>
                                <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-red-500 transform -translate-y-1/2"></div>
                            </div>
                            <span className={`text-[200px] leading-none select-none text-black ${getFontClass(selectedFont)}`}>{selectedChar.char}</span>
                        </div>
                    ) : (
                        <div className="w-[300px] h-[300px] bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center rounded-sm">
                             <div className="text-center p-8">
                                 <div className="text-6xl mb-4">?</div>
                                 <p className="text-stone-500 font-serif">Draw from memory</p>
                                 <button onClick={() => setIsReferenceHidden(false)} className="mt-4 text-xs text-seal-red hover:underline">Peek Answer</button>
                             </div>
                        </div>
                    )}

                    <div className="relative">
                        <div className="relative w-[300px] h-[300px]">
                            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 z-0 ${showOverlayRef && !isReferenceHidden ? 'opacity-10' : 'opacity-0'}`}>
                                <span className={`text-[200px] leading-none text-black ${getFontClass(selectedFont)}`}>{selectedChar.char}</span>
                            </div>
                            <DrawingPad ref={canvasRef} width={300} height={300} onClear={clearCanvas} className="z-10 relative bg-transparent" />
                        </div>
                        
                        <div className="mt-4 flex items-center justify-between">
                            <button onClick={clearCanvas} className="px-3 py-1.5 text-xs font-bold text-stone-600 bg-stone-200 rounded transition-colors hover:bg-stone-300">Clear</button>
                            <button 
                                onClick={handleEvaluate}
                                disabled={isEvaluating}
                                className="px-6 py-2 bg-seal-red text-white font-bold rounded shadow-lg disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
                            >
                                {isEvaluating ? 'Evaluating...' : 'Check'}
                            </button>
                        </div>
                    </div>
                </div>

                {isChallengeMode && !isReferenceHidden && (
                    <button onClick={handleNextChallenge} className="px-8 py-3 bg-stone-800 text-white rounded-md font-bold shadow-md hover:bg-black transition-all">Next Challenge</button>
                )}
            </div>
            ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-stone-400 font-serif italic">
                <p>Select a character from the sidebar to begin your practice.</p>
            </div>
            )}
        </div>
      </main>

      <ResultsModal isOpen={showModal} onClose={handleCloseModal} result={evaluationResult} isLoading={isEvaluating} />
    </div>
  );
}