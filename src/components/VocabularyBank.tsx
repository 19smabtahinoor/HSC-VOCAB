import React, { useState, useMemo } from 'react';
import { WordEntry } from '../types';
import { Search, Star, CheckCircle, Volume2, ChevronLeft, ChevronRight, BookMarked, ToggleLeft, RefreshCw, Layers } from 'lucide-react';
import { speakEnglishWord, playSound } from '../utils/audio';

interface VocabularyBankProps {
  words: WordEntry[];
  starredIds: string[];
  learnedIds: string[];
  toggleStar: (id: string) => void;
  toggleLearned: (id: string) => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const VocabularyBank: React.FC<VocabularyBankProps> = ({
  words,
  starredIds,
  learnedIds,
  toggleStar,
  toggleLearned,
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [expandedWordId, setExpandedWordId] = useState<string | null>(null);

  // Parse filters
  const processedWords = useMemo(() => {
    return words.filter((word) => {
      // 1. Category tab filter
      if (activeFilter === 'synonyms' && word.type !== 'synonym') return false;
      if (activeFilter === 'antonyms' && word.type !== 'antonym') return false;
      if (activeFilter === 'starred' && !starredIds.includes(word.id)) return false;
      if (activeFilter === 'learned' && !learnedIds.includes(word.id)) return false;
      if (activeFilter === 'unlearned' && learnedIds.includes(word.id)) return false;

      // 2. Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        word.word.toLowerCase().includes(q) ||
        word.answer.toLowerCase().includes(q) ||
        word.bengali.includes(q)
      );
    });
  }, [words, activeFilter, starredIds, learnedIds, searchQuery]);

  // Handle pagination values
  const totalItems = processedWords.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  
  // Safe adjustment when filters change output count
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedWords = useMemo(() => {
    return processedWords.slice(startIndex, endIndex);
  }, [processedWords, startIndex, endIndex]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      playSound('click');
      setCurrentPage(page);
    }
  };

  const handlePronounce = (e: React.MouseEvent, wordText: string) => {
    e.stopPropagation();
    playSound('click');
    speakEnglishWord(wordText);
  };

  const toggleRowExpand = (id: string) => {
    playSound('click');
    setExpandedWordId(expandedWordId === id ? null : id);
  };

  const clearQuery = () => {
    playSound('click');
    setSearchQuery('');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Filtering Control Bar */}
      <div className="rounded-3xl border border-zinc-800 bg-[#18181B] p-4 shadow-lg md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
              <Search className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              id="vocab-search-input"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search English word, answer list, or Bengali meaning..."
              className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 py-2.5 pl-11 pr-10 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:bg-zinc-900 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-150"
              aria-label="Search words"
            />
            {searchQuery && (
              <button
                id="search-clear-btn"
                onClick={clearQuery}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-medium text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick filter tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mr-1 hidden sm:inline">Filters:</span>
            {[
              { id: 'all', label: 'All Words' },
              { id: 'synonyms', label: 'Synonyms Only' },
              { id: 'antonyms', label: 'Antonyms Only' },
              { id: 'starred', label: 'Starred' },
              { id: 'learned', label: 'Mastered' },
              { id: 'unlearned', label: 'Needs Practice' }
            ].map((tab) => {
              const isActive = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`filter-tab-${tab.id}`}
                  onClick={() => {
                    playSound('click');
                    setActiveFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20'
                      : 'bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-750 hover:text-zinc-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

        </div>

        {/* Quick Results Summary Row */}
        <div className="mt-4 flex flex-wrap items-center justify-between border-t border-zinc-850 pt-3.5 text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-300">Showing {totalItems}</span> matching entries
            {searchQuery && <span>for "{searchQuery}"</span>}
          </div>
          {totalItems > 0 && (
            <div>
              Words {startIndex + 1} - {endIndex} of {totalItems}
            </div>
          )}
        </div>
      </div>

      {/* Main Vocabulary List/Desktop Table Container */}
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-[#18181B] shadow-xl">
        
        {totalItems === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/40">
            <div className="rounded-full bg-zinc-800 p-4 text-zinc-500 mb-3">
              <Layers className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="text-base font-semibold text-zinc-200">No words found</h3>
            <p className="mt-1 text-sm text-zinc-400 max-w-sm">
              We couldn't find any synonym or antonym entries matching of those specific rules in the current filter.
            </p>
            <button
              id="empty-reset-btn"
              onClick={() => {
                playSound('click');
                setSearchQuery('');
                setActiveFilter('all');
                setCurrentPage(1);
              }}
              className="mt-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-bold text-white shadow-lg transition-all cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="w-full">
            
            {/* Desktop Table Header Profile (Hidden on Mobile) */}
            <div className="hidden grid-cols-12 gap-4 border-b border-zinc-800 bg-[#121214] px-6 py-3.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider md:grid">
              <div className="col-span-3">English Word</div>
              <div className="col-span-2">Task Type</div>
              <div className="col-span-4">Answers (Synonym / Antonym)</div>
              <div className="col-span-2">Bengali Meaning</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* List entries layout */}
            <div className="divide-y divide-zinc-800">
              {paginatedWords.map((word) => {
                const isExpanded = expandedWordId === word.id;
                const isStarred = starredIds.includes(word.id);
                const isLearned = learnedIds.includes(word.id);

                return (
                  <div
                    key={word.id}
                    className={`group transition-all duration-150 border-b border-zinc-800/80 ${
                      isExpanded
                        ? 'bg-[#151518]'
                        : 'hover:bg-zinc-800/25'
                    }`}
                  >
                    
                    {/* Primary Responsive Row Display */}
                    <div
                      onClick={() => toggleRowExpand(word.id)}
                      className="flex flex-col gap-3 px-5 py-4 cursor-pointer md:grid md:grid-cols-12 md:gap-4 md:items-center md:px-6 md:py-3.5"
                    >
                      {/* 1. English Word */}
                      <div className="col-span-3 flex items-center justify-between md:justify-start gap-3">
                        <div className="flex items-center gap-3">
                          <span className="font-display font-semibold text-zinc-100 group-hover:text-indigo-400 text-base md:text-sm transition-colors">
                            {word.word}
                          </span>
                          <button
                            id={`pronounce-btn-${word.id}`}
                            onClick={(e) => handlePronounce(e, word.word)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:bg-indigo-950/50 hover:text-indigo-400 border border-zinc-700/60 transition-colors"
                            title="Hear pronunciation"
                            aria-label={`Pronounce ${word.word}`}
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        
                        {/* Mobile active action indicator badges */}
                        <div className="flex items-center gap-2 md:hidden">
                          <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-2xs font-semibold ${
                            word.type === 'synonym'
                              ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                              : 'bg-rose-50/10 text-rose-400 border border-rose-900/50'
                          }`}>
                            {word.type === 'synonym' ? 'Synonym' : 'Antonym'}
                          </span>
                          {isStarred && <Star className="h-4 w-4 fill-amber-400 text-amber-500" />}
                          {isLearned && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                        </div>
                      </div>

                      {/* 2. Type badge (Desktop Only) */}
                      <div className="col-span-2 hidden md:block">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                          word.type === 'synonym'
                            ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/50'
                            : 'bg-rose-50/10 text-rose-400 border border-rose-900/50'
                        }`}>
                          {word.type === 'synonym' ? 'Synonym' : 'Antonym'}
                        </span>
                      </div>

                      {/* 3. Answer Field */}
                      <div className="col-span-4 flex flex-col md:flex-row md:items-baseline md:gap-1.5">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide md:hidden">Answer:</span>
                        <span className="text-sm font-medium text-indigo-300 font-mono bg-indigo-950/20 md:bg-transparent rounded px-1.5 py-0.5 md:p-0">
                          {word.answer}
                        </span>
                      </div>

                      {/* 4. Bengali translation */}
                      <div className="col-span-2 flex flex-col md:flex-row md:items-baseline md:gap-1.5 md:col-span-2">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide md:hidden">Bengali:</span>
                        <span className="text-sm text-zinc-300 font-medium font-display">
                          {word.bengali}
                        </span>
                      </div>

                      {/* 5. Star & Complete Action buttons */}
                      <div className="col-span-1 hidden md:flex items-center justify-end gap-1.5">
                        <button
                          id={`row-star-btn-${word.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound('click');
                            toggleStar(word.id);
                          }}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                            isStarred
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              : 'bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                          }`}
                          title={isStarred ? 'Unstar word' : 'Star word for revision'}
                        >
                          <Star className={`h-4 w-4 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                        </button>

                        <button
                          id={`row-learn-btn-${word.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            playSound('click');
                            toggleLearned(word.id);
                          }}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all cursor-pointer ${
                            isLearned
                              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                              : 'bg-zinc-900 border-zinc-700/80 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                          }`}
                          title={isLearned ? 'Mark as studying' : 'Mark as mastered'}
                        >
                          <CheckCircle className={`h-4 w-4 ${isLearned ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                        </button>
                      </div>

                    </div>

                    {/* EXPANDABLE STUDY PANEL DETAILED DRAWER */}
                    {isExpanded && (
                      <div className="border-t border-zinc-800 bg-[#121214]/65 p-5 md:px-8 md:py-6 animate-fade-in text-zinc-300">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          
                          {/* Left helper box */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Syllabus Analysis</h4>
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 shadow-md">
                              <p className="text-xs text-zinc-400 leading-relaxed">
                                Under HSC Board guidelines, for <b>Question 11</b> you are asked to provide either a synonym (similar meaning) or antonym (opposite meaning) based on a context passage structure.
                              </p>
                              <div className="mt-2.5 flex items-center justify-between border-t border-zinc-800 pt-2 text-xs">
                                <span className="text-zinc-500">Target Type:</span>
                                <span className={`font-bold uppercase tracking-wider ${word.type === 'synonym' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {word.type}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Middle interactive study values */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Bilingual Reference</h4>
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 shadow-md space-y-2">
                              <div>
                                <span className="text-2xs text-zinc-500 uppercase font-mono tracking-wider block">English Answer Examples:</span>
                                <span className="text-sm font-semibold font-mono text-indigo-400">{word.answer}</span>
                              </div>
                              <div className="border-t border-zinc-800 pt-2">
                                <span className="text-2xs text-zinc-500 uppercase font-mono tracking-wider block">Bengali Word Meaning:</span>
                                <span className="text-sm font-semibold text-zinc-100 font-display">{word.bengali}</span>
                              </div>
                            </div>
                          </div>

                          {/* Quick revision action controls */}
                          <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Revision Dashboard</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {/* Bookmark Toggle */}
                              <button
                                id={`expanded-star-btn-${word.id}`}
                                onClick={() => toggleStar(word.id)}
                                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer ${
                                  isStarred
                                    ? 'bg-amber-500/15 border-amber-500/35 text-amber-400'
                                    : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                                }`}
                              >
                                <Star className={`h-4 w-4 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                                {isStarred ? 'Starred ⭐️' : 'Star Word'}
                              </button>

                              {/* Got It Toggle */}
                              <button
                                id={`expanded-learn-btn-${word.id}`}
                                onClick={() => toggleLearned(word.id)}
                                className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-semibold transition-all cursor-pointer ${
                                  isLearned
                                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400'
                                    : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
                                }`}
                              >
                                <CheckCircle className="h-4 w-4" />
                                {isLearned ? 'Mastered ✅' : 'Mark Learned'}
                              </button>

                              {/* Play Audio Pronunciation */}
                              <button
                                id={`expanded-speech-btn-${word.id}`}
                                onClick={() => speakEnglishWord(word.word)}
                                className="col-span-2 flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 p-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-750 hover:text-zinc-100 transition-all cursor-pointer"
                              >
                                <Volume2 className="h-4 w-4" />
                                Speak Word Pronunciation
                              </button>
                            </div>
                          </div>

                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-zinc-800 bg-[#18181B] px-5 py-4.5 shadow-lg sm:flex-row">
          
          <div className="text-xs text-zinc-400 font-medium text-center sm:text-left">
            Showing <span className="font-semibold text-zinc-200">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-zinc-200">{endIndex}</span> of{' '}
            <span className="font-semibold text-zinc-200">{totalItems}</span> matching syllabus targets
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            
            {/* Prev Button */}
            <button
              id="pagination-prev-btn"
              onClick={() => handlePageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage === 1}
              className="flex h-9 items-center justify-center gap-1 rounded-xl border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-750 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev</span>
            </button>

            {/* Pagination Range Numbers */}
            <div className="hidden sm:flex items-center gap-1.5">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Focus rendering around active pages
                let targetPage = i + 1;
                if (safeCurrentPage > 3 && totalPages > 5) {
                  if (safeCurrentPage + 2 > totalPages) {
                    targetPage = totalPages - 4 + i;
                  } else {
                    targetPage = safeCurrentPage - 2 + i;
                  }
                }
                const isSelected = targetPage === safeCurrentPage;

                return (
                  <button
                    key={targetPage}
                    id={`p-num-btn-${targetPage}`}
                    onClick={() => handlePageChange(targetPage)}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-750'
                    }`}
                  >
                    {targetPage}
                  </button>
                );
              })}
            </div>

            {/* Mobile simplified page display */}
            <span className="text-xs font-semibold text-zinc-400 sm:hidden">
              Page {safeCurrentPage} of {totalPages}
            </span>

            {/* Next Button */}
            <button
              id="pagination-next-btn"
              onClick={() => handlePageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage === totalPages}
              className="flex h-9 items-center justify-center gap-1 rounded-xl border border-zinc-700 bg-zinc-800 text-xs font-semibold text-zinc-300 hover:bg-zinc-750 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            
            {/* Quick dropdown jump selector */}
            <div className="hidden md:flex items-center gap-2 border-l border-zinc-800 pl-3">
              <span className="text-2xs text-zinc-500 font-medium">Jump to:</span>
              <select
                id="pagination-jump-select"
                value={safeCurrentPage}
                onChange={(e) => handlePageChange(Number(e.target.value))}
                className="rounded-lg border border-zinc-700 bg-zinc-800 py-1 pl-1.5 pr-6 text-2xs font-semibold text-zinc-300 focus:outline-none cursor-pointer"
              >
                {Array.from({ length: totalPages }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Page {i + 1}
                  </option>
                ))}
              </select>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
