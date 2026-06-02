import React, { useState, useEffect, useMemo } from 'react';
import { WordEntry } from '../types';
import { RefreshCw, Star, CheckCircle, Volume2, ArrowLeft, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { speakEnglishWord, playSound } from '../utils/audio';

interface FlashcardsProps {
  words: WordEntry[];
  starredIds: string[];
  learnedIds: string[];
  toggleStar: (id: string) => void;
  toggleLearned: (id: string) => void;
  markAsLearnedDirect: (id: string, learned: boolean) => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({
  words,
  starredIds,
  learnedIds,
  toggleStar,
  toggleLearned,
  markAsLearnedDirect
}) => {
  const [deckFilter, setDeckFilter] = useState<'all' | 'synonyms' | 'antonyms' | 'starred' | 'unlearned'>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);

  // Filter word deck
  const activeDeck = useMemo(() => {
    return words.filter((word) => {
      if (deckFilter === 'synonyms' && word.type !== 'synonym') return false;
      if (deckFilter === 'antonyms' && word.type !== 'antonym') return false;
      if (deckFilter === 'starred' && !starredIds.includes(word.id)) return false;
      if (deckFilter === 'unlearned' && learnedIds.includes(word.id)) return false;
      return true;
    });
  }, [words, deckFilter, starredIds, learnedIds]);

  const currentWord = activeDeck[currentIndex];

  // Auto reset index when deck content shifts
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [deckFilter]);

  // Handle keyboard interaction listeners safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeDeck.length === 0) return;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handleFlip();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
        case 'KeyS':
          e.preventDefault();
          if (currentWord) {
            playSound('click');
            toggleStar(currentWord.id);
          }
          break;
        case 'KeyL':
          e.preventDefault();
          if (currentWord) {
            playSound('click');
            toggleLearned(currentWord.id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDeck, currentIndex, currentWord]);

  const handleFlip = () => {
    playSound('click');
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (activeDeck.length <= 1) return;
    playSound('click');
    setIsFlipped(false);
    // Subtle slide/fade animation transition
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % activeDeck.length);
    }, 150);
  };

  const handlePrev = () => {
    if (activeDeck.length <= 1) return;
    playSound('click');
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + activeDeck.length) % activeDeck.length);
    }, 150);
  };

  const handlePronounce = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    playSound('click');
    speakEnglishWord(text);
  };

  // Drills action marking
  const handleMarkProgress = (learned: boolean) => {
    if (!currentWord) return;
    
    setIsFlipped(false);
    
    // Animate a short confirmation nudge
    setShakeCard(true);
    setTimeout(() => setShakeCard(false), 400);

    // Save state
    markAsLearnedDirect(currentWord.id, learned);

    // Move next
    if (activeDeck.length > 1) {
      setTimeout(() => {
        handleNext();
      }, 200);
    }
  };

  const isStarred = currentWord ? starredIds.includes(currentWord.id) : false;
  const isMastered = currentWord ? learnedIds.includes(currentWord.id) : false;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      
      {/* Deck Selector Navigation Bar */}
      <div className="rounded-3xl border border-zinc-800 bg-[#18181B] p-4 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">Study Deck Profile:</span>
          
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All Syllabus' },
              { id: 'synonyms', label: 'Synonyms Only' },
              { id: 'antonyms', label: 'Antonyms Only' },
              { id: 'starred', label: 'Starred list' },
              { id: 'unlearned', label: 'Practice Only' }
            ].map((deck) => (
              <button
                key={deck.id}
                id={`deck-selector-btn-${deck.id}`}
                onClick={() => {
                  playSound('click');
                  setDeckFilter(deck.id as any);
                }}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold select-none cursor-pointer transition-all ${
                  deckFilter === deck.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750 border border-zinc-700/80'
                }`}
              >
                {deck.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {activeDeck.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-800 bg-[#18181B] p-12 text-center shadow-lg bg-zinc-900/10">
          <Layers className="h-10 w-10 text-zinc-500 mb-3" />
          <h3 className="text-base font-semibold text-zinc-200">This Deck Is Empty</h3>
          <p className="mt-1 text-sm text-zinc-400 max-w-sm leading-relaxed">
            There are no words matching that filter. Turn on <b>Star list</b> on items inside the Vocabulary Bank to populate star cards!
          </p>
          <button
            id="deck-fallback-all-btn"
            onClick={() => {
              playSound('click');
              setDeckFilter('all');
            }}
            className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-colors cursor-pointer"
          >
            Load Full Deck
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Main Flashcard display */}
          <div className="relative w-full">
            
            {/* 3D Container viewport */}
            <div 
              onClick={handleFlip}
              className={`card-3d-container relative h-[320px] w-full cursor-pointer select-none ${
                shakeCard ? 'animate-bounce' : ''
              }`}
            >
              <div className={`card-3d relative h-full w-full rounded-3xl border border-zinc-805 bg-[#141417] p-6 shadow-xl transition-all hover:shadow-2xl duration-500 ${
                isFlipped ? 'flipped' : ''
              }`}>
                
                {/* 1. FRONT SIDE */}
                <div className="card-front flex flex-col justify-between h-full p-2 bg-[#18181B]">
                  
                  {/* Top line detail tags */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                      currentWord.type === 'synonym'
                        ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30'
                        : 'bg-rose-950/30 text-rose-400 border border-rose-900/50'
                    }`}>
                      Find the {currentWord.type}
                    </span>
                    
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      {isStarred && <Star className="h-4.5 w-4.5 fill-amber-400 text-amber-500" />}
                      {isMastered && <CheckCircle className="h-4.5 w-4.5 text-emerald-400" />}
                    </div>
                  </div>

                  {/* Centered Target Word */}
                  <div className="text-center space-y-4 my-auto">
                    <h2 className="font-display text-4xl font-extrabold tracking-tight text-zinc-100 group-hover:text-indigo-455 sm:text-5xl">
                      {currentWord.word}
                    </h2>
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest block">
                      HSC Question 11 Study Card
                    </span>
                  </div>

                  {/* Bottom Guide */}
                  <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-400">
                    <button
                      onClick={(e) => handlePronounce(e, currentWord.word)}
                      className="flex items-center gap-1 hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      <Volume2 className="h-4 w-4" />
                      <span>Speak Pronunciation</span>
                    </button>
                    <span className="font-mono bg-zinc-800/80 px-2 py-1 rounded text-zinc-400">Click to flip &bull; Space</span>
                  </div>

                </div>

                {/* 2. BACK SIDE (Revealed after axis flip) */}
                <div className="card-back flex flex-col justify-between h-full p-2 bg-[#18181B]">
                  
                  {/* Top metrics details */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                      Definition & Meaning
                    </span>
                    <span className="text-xs text-zinc-500">Back Card</span>
                  </div>

                  {/* Centered Translations */}
                  <div className="text-center space-y-5 my-auto">
                    <div>
                      <span className="text-2xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Equivalent (English):</span>
                      <h3 className="font-mono text-2xl font-bold tracking-tight text-indigo-300">
                        {currentWord.answer}
                      </h3>
                    </div>
                    
                    <div className="pt-2 border-t border-zinc-800 max-w-[80%] mx-auto">
                      <span className="text-2xs font-semibold text-zinc-500 uppercase tracking-wider block mb-1">Bengali Meaning:</span>
                      <h4 className="font-display text-3xl font-bold tracking-normal text-zinc-100">
                        {currentWord.bengali}
                      </h4>
                    </div>
                  </div>

                  {/* Bottom details */}
                  <div className="flex items-center justify-between border-t border-zinc-800 pt-3 text-xs text-zinc-400">
                    <button
                      onClick={(e) => handlePronounce(e, currentWord.answer)}
                      className="flex items-center gap-1 hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      <Volume2 className="h-4 w-4" />
                      <span>Pronounce Equivalent</span>
                    </button>
                    <span className="font-mono text-zinc-500">Answer revealed &bull; Space</span>
                  </div>

                </div>

              </div>
            </div>

            {/* Deck index display indicator bubbles */}
            <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 px-2 font-medium">
              <span>Card <b className="text-zinc-200">{currentIndex + 1}</b> of <b className="text-zinc-200">{activeDeck.length}</b></span>
              <span className="hidden sm:inline text-zinc-500">Keyboard: Left/Right to change card &bull; Space to flip</span>
            </div>

          </div>

          {/* Practical Active Drills Marking Panel */}
          <div className="rounded-3xl border border-zinc-800 bg-[#18181B] p-4.5 shadow-lg space-y-3.5">
            <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest text-center">
              Active Card Drill Rating
            </h4>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Mark Practice Needed */}
              <button
                id="drill-practice-btn"
                onClick={() => handleMarkProgress(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-950/40 bg-rose-950/15 py-3 text-xs font-bold text-rose-400 hover:bg-rose-950/25 hover:border-rose-900/50 transition-all cursor-pointer"
              >
                ⚠️ Still Practicing
              </button>

              {/* Mark Mastered */}
              <button
                id="drill-mastered-btn"
                onClick={() => handleMarkProgress(true)}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-950/40 bg-emerald-950/15 py-3 text-xs font-bold text-emerald-400 hover:bg-emerald-950/25 hover:border-emerald-900/50 transition-all cursor-pointer"
              >
                👍 Got It, Mastered!
              </button>
            </div>
          </div>

          {/* Card Swipe Navigation Toolbar */}
          <div className="flex items-center justify-between">
            <button
              id="card-nav-prev-btn"
              onClick={handlePrev}
              disabled={activeDeck.length <= 1}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-755 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {/* Quick Star shortcut button */}
            <button
              id="card-shortcut-star-btn"
              onClick={() => {
                if (currentWord) {
                  playSound('click');
                  toggleStar(currentWord.id);
                }
              }}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                isStarred
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750'
              }`}
            >
              <Star className={`h-4.5 w-4.5 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
              <span>{isStarred ? 'Starred ⭐️' : 'Star Card (S)'}</span>
            </button>

            <button
              id="card-nav-next-btn"
              onClick={handleNext}
              disabled={activeDeck.length <= 1}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-755 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
