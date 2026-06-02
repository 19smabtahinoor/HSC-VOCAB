import { useState, useEffect } from 'react';
import { wordList } from './data';
import { Header } from './components/Header';
import { VocabularyBank } from './components/VocabularyBank';
import { Flashcards } from './components/Flashcards';
import { QuizArena } from './components/QuizArena';
import { BookOpen, HelpCircle, Award, Sparkles, Star, Download, Printer, Share2, Music } from 'lucide-react';
import { playSound } from './utils/audio';

export default function App() {
  // Sync state managers with localStorage for persistent revision tracking
  const [starredIds, setStarredIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hsc_starred_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [learnedIds, setLearnedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('hsc_learned_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [quizHighScore, setQuizHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hsc_quiz_highscore');
      return saved ? Number(saved) : 0;
    } catch {
      return 0;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hsc_sound_effects');
      return saved !== 'false'; // Default to true
    } catch {
      return true;
    }
  });

  // Keep search and category filters preserved in parent memory
  const [activeCoreTab, setActiveCoreTab] = useState<'vocab' | 'flashcards' | 'quiz'>('vocab');
  const [vocabFilter, setVocabFilter] = useState<string>('all');
  const [vocabSearch, setVocabSearch] = useState<string>('');

  // Persist states to local storage on changes
  useEffect(() => {
    localStorage.setItem('hsc_starred_ids', JSON.stringify(starredIds));
  }, [starredIds]);

  useEffect(() => {
    localStorage.setItem('hsc_learned_ids', JSON.stringify(learnedIds));
  }, [learnedIds]);

  useEffect(() => {
    localStorage.setItem('hsc_quiz_highscore', quizHighScore.toString());
  }, [quizHighScore]);

  useEffect(() => {
    localStorage.setItem('hsc_sound_effects', soundEnabled.toString());
  }, [soundEnabled]);

  // Event handlers
  const toggleStar = (id: string) => {
    setStarredIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleLearned = (id: string) => {
    setLearnedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const markAsLearnedDirect = (id: string, learned: boolean) => {
    setLearnedIds((prev) => {
      const exists = prev.includes(id);
      if (learned && !exists) return [...prev, id];
      if (!learned && exists) return prev.filter((x) => x !== id);
      return prev;
    });
  };

  const saveHighScore = (scorePercent: number) => {
    if (scorePercent > quizHighScore) {
      setQuizHighScore(scorePercent);
    }
  };

  const handleTabChange = (tab: 'vocab' | 'flashcards' | 'quiz') => {
    playSound('click');
    setActiveCoreTab(tab);
  };

  // Printable Revision Sheet download using standard print dialog styling support
  const handlePrintExamSheet = () => {
    playSound('click');
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 antialiased font-sans flex flex-col">
      
      {/* 1. Header Toolbar Dashboard Section */}
      <Header
        totalCount={wordList.length}
        starredCount={starredIds.length}
        learnedCount={learnedIds.length}
        quizHighScore={quizHighScore}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
      />

      {/* 2. Main Workspace Layout */}
      <main className="flex-1 mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Navigation Tab selection panel */}
        <div className="flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center justify-between border border-zinc-800 bg-[#18181B] shadow-lg rounded-2xl px-5 py-4">
          
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 min-[480px]:pb-0">
            {[
              { id: 'vocab', label: 'Syllabus Bank', icon: BookOpen },
              { id: 'flashcards', label: 'Flashcard Suite', icon: Sparkles },
              { id: 'quiz', label: 'Practice Quiz', icon: Award }
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeCoreTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`main-tab-link-${tab.id}`}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                      : 'text-zinc-400 hover:bg-zinc-850 hover:text-zinc-100'
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick interactive print and review trigger */}
          <div className="flex items-center gap-2">
            <button
              id="app-print-exam-sheet-btn"
              onClick={handlePrintExamSheet}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 hover:border-zinc-600 px-3.5 py-2 text-xs font-bold text-zinc-300 transition-all cursor-pointer"
              title="Print current vocabulary list/revision sheet to PDF style"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print Printout Sheet</span>
            </button>
          </div>

        </div>

        {/* 3. Conditional Tab Content Workspace */}
        <section id="main-workbook-workspace-view" className="animate-fade-in duration-300">
          {activeCoreTab === 'vocab' && (
            <VocabularyBank
              words={wordList}
              starredIds={starredIds}
              learnedIds={learnedIds}
              toggleStar={toggleStar}
              toggleLearned={toggleLearned}
              activeFilter={vocabFilter}
              setActiveFilter={setVocabFilter}
              searchQuery={vocabSearch}
              setSearchQuery={setVocabSearch}
            />
          )}

          {activeCoreTab === 'flashcards' && (
            <Flashcards
              words={wordList}
              starredIds={starredIds}
              learnedIds={learnedIds}
              toggleStar={toggleStar}
              toggleLearned={toggleLearned}
              markAsLearnedDirect={markAsLearnedDirect}
            />
          )}

          {activeCoreTab === 'quiz' && (
            <QuizArena
              words={wordList}
              starredIds={starredIds}
              saveHighScore={saveHighScore}
              soundEnabled={soundEnabled}
            />
          )}
        </section>

      </main>

      {/* 4. Beautiful print stylesheet layout helper (Hidden by default, shown during window.print()) */}
      <section className="hidden print:block print:bg-white p-8 space-y-6">
        <div className="border-b-2 border-slate-900 pb-3">
          <h1 className="text-2xl font-bold uppercase tracking-wider text-slate-900">HSC 2026 Revision Guide — Synonym & Antonym Sheet</h1>
          <p className="text-sm text-slate-600">English 2nd Paper (Question 11) &bull; Study Bookmarks Sheet</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Starred Vocabulary Bookmarks ({starredIds.length === 0 ? "Full List" : starredIds.length} entries matching)</h2>
          <table className="w-full border-collapse border border-slate-300 text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-300 px-3 py-2 text-left">English Word</th>
                <th className="border border-slate-300 px-3 py-2 text-left">Task Type</th>
                <th className="border border-slate-300 px-3 py-2 text-left">Suggested Answers (Synonym/Antonym)</th>
                <th className="border border-slate-300 px-3 py-2 text-left">Bengali Translation</th>
              </tr>
            </thead>
            <tbody>
              {wordList
                .filter(w => starredIds.length === 0 || starredIds.includes(w.id))
                .map((word, idx) => (
                  <tr key={word.id} className="divide-y divide-slate-100">
                    <td className="border border-slate-300 px-3 py-2 font-semibold font-mono">{word.word}</td>
                    <td className="border border-slate-300 px-3 py-2 uppercase font-bold text-xs">{word.type}</td>
                    <td className="border border-slate-300 px-3 py-2 font-mono text-indigo-900">{word.answer}</td>
                    <td className="border border-slate-300 px-3 py-2 text-slate-900 font-medium">{word.bengali}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 pt-3 text-2xs text-slate-400 text-center">
          Generated via HSC Synonym & Antonym Study Companion Dashboard on {new Date().toLocaleDateString()}
        </div>
      </section>

      {/* 5. Minimalistic Professional Academic Footer */}
      <footer className="w-full border-t border-zinc-800 bg-[#09090B] py-6 mt-12 print:hidden">
        <div className="mx-auto max-w-7xl px-4 text-center space-y-1.5 md:flex md:items-center md:justify-between md:space-y-0 sm:px-6 lg:px-8">
          <p className="text-xs text-zinc-500">
            &copy; 2026 HSC English Companion. Developed for National Syllabus Boards.
          </p>
          <div className="flex justify-center gap-4 text-xs font-semibold text-zinc-500">
            <span>Question Number 11 Study Module</span>
            <span>&bull;</span>
            <span>Study Offline with Flashcards</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
