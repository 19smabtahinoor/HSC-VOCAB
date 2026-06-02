import React, { useState, useMemo } from 'react';
import { WordEntry, QuizQuestion } from '../types';
import { Award, CheckCircle2, AlertTriangle, RefreshCw, Volume2, HelpCircle, ArrowRight, BookOpen, Clock, Heart, Calendar } from 'lucide-react';
import { playSound, speakEnglishWord } from '../utils/audio';

interface QuizArenaProps {
  words: WordEntry[];
  starredIds: string[];
  saveHighScore: (scorePercent: number) => void;
  soundEnabled: boolean;
}

export const QuizArena: React.FC<QuizArenaProps> = ({
  words,
  starredIds,
  saveHighScore,
  soundEnabled
}) => {
  // Setup states
  const [inQuiz, setInQuiz] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [quizType, setQuizType] = useState<'all' | 'synonyms' | 'antonyms' | 'starred'>('all');
  
  // Game states
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  // Helper: Shuffle an array of any type
  const shuffleArray = <T extends unknown>(arr: T[]): T[] => {
    return [...arr].sort(() => Math.random() - 0.5);
  };

  // Setup/Start Game Handler
  const startQuiz = () => {
    playSound('click');
    
    // 1. Determine card deck to study
    let deck = words;
    if (quizType === 'synonyms') deck = words.filter(w => w.type === 'synonym');
    if (quizType === 'antonyms') deck = words.filter(w => w.type === 'antonym');
    if (quizType === 'starred') deck = words.filter(w => starredIds.includes(w.id));

    // Fallback if starry list is empty
    if (deck.length === 0) {
      alert("No words available in the current filter deck to start the quiz. Please choose another deck.");
      return;
    }

    // 2. Select random entries
    const shuffledDeck = shuffleArray<WordEntry>(deck);
    const selectedCount = Math.min(questionCount, shuffledDeck.length);
    const quizCandidates = shuffledDeck.slice(0, selectedCount);

    // 3. Assemble unique question entries with realistic decoys
    const formulatedQuestions: QuizQuestion[] = quizCandidates.map((entry) => {
      // Find eligible decoy candidates (answers representing other words with distinct definitions)
      const decoyPool = words
        .filter(w => w.answer !== entry.answer && w.word !== entry.word)
        .map(w => w.answer);
      
      const uniqueDecoys = Array.from(new Set(decoyPool)) as string[];
      const randomizedDecoys = shuffleArray<string>(uniqueDecoys).slice(0, 3);
      
      // Ensure we have exactly 4 choices (shuffled)
      const options = shuffleArray<string>([entry.answer, ...randomizedDecoys]);

      return {
        word: entry.word,
        type: entry.type,
        correctAnswer: entry.answer,
        bengali: entry.bengali,
        options
      };
    });

    setQuestions(formulatedQuestions);
    setCurrentIndex(0);
    setSelectedOption(null);
    setHasSubmitted(false);
    setScore(0);
    setShowHint(false);
    setQuizFinished(false);
    setInQuiz(true);
  };

  // Option submission handle
  const handleSelectOption = (option: string) => {
    if (hasSubmitted) return;
    
    setSelectedOption(option);
    setHasSubmitted(true);
    
    const isCorrect = option === questions[currentIndex].correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
      if (soundEnabled) playSound('success');
    } else {
      if (soundEnabled) playSound('failure');
    }
  };

  const handleNextQuestion = () => {
    playSound('click');
    setShowHint(false);
    setSelectedOption(null);
    setHasSubmitted(false);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Submit scored percentile
      const finalPercent = Math.round((score / questions.length) * 100);
      saveHighScore(finalPercent);
      setQuizFinished(true);
    }
  };

  const handlePronounce = (txt: string) => {
    playSound('click');
    speakEnglishWord(txt);
  };

  const handleResetQuiz = () => {
    playSound('click');
    setInQuiz(false);
    setQuizFinished(false);
  };

  const activeQuestion = questions[currentIndex];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      
      {/* CASE A: QUIZ BOOT/CONFIG SCREEN */}
      {!inQuiz && (
        <div className="rounded-3xl border border-zinc-800 bg-[#18181B] p-6 shadow-xl md:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 border border-zinc-700 text-indigo-400 shadow-md">
              <Award className="h-8 w-8 text-indigo-455" />
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-100">
              Practice Revision Quiz
            </h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Assess your syllabus vocabulary with generated multiple-choice tests containing realistic study answers.
            </p>
          </div>

          <div className="divide-y divide-zinc-800 border-t border-b border-zinc-800">
            
            {/* 1. Category Selection */}
            <div className="py-4 space-y-2.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">
                Choose Syllabus Category:
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { id: 'all', title: 'All Vocab', desc: 'Full list' },
                  { id: 'synonyms', title: 'Synonyms', desc: 'Similar words' },
                  { id: 'antonyms', title: 'Antonyms', desc: 'Opposite words' },
                  { id: 'starred', title: 'Starred', desc: `Saved (${starredIds.length})` }
                ].map((type) => {
                  const isSelect = quizType === type.id;
                  const isStarOption = type.id === 'starred';
                  const isStarDisabled = isStarOption && starredIds.length === 0;

                  return (
                    <button
                      key={type.id}
                      disabled={isStarDisabled}
                      id={`quiz-type-btn-${type.id}`}
                      onClick={() => {
                        playSound('click');
                        setQuizType(type.id as any);
                      }}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition-all cursor-pointer ${
                        isSelect
                          ? 'bg-indigo-600 border-indigo-650 text-white shadow-lg shadow-indigo-900/30'
                          : isStarDisabled
                          ? 'bg-zinc-900/30 border-zinc-850/60 text-zinc-650 cursor-not-allowed opacity-40'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800/80 hover:border-zinc-600'
                      }`}
                    >
                      <span className="text-xs font-bold select-none">{type.title}</span>
                      <span className={`text-[10px] select-none ${isSelect ? 'text-indigo-200' : 'text-zinc-500'}`}>
                        {type.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Count limits selection */}
            <div className="py-4 space-y-2.5">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block">
                Count of Questions:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 20, 30].map((num) => {
                  const isSelect = questionCount === num;
                  return (
                    <button
                      key={num}
                      id={`quiz-count-btn-${num}`}
                      onClick={() => {
                        playSound('click');
                        setQuestionCount(num);
                      }}
                      className={`rounded-xl border py-2.5 text-xs font-bold transition-all cursor-pointer ${
                        isSelect
                          ? 'bg-indigo-600 border-indigo-650 text-white shadow-lg shadow-indigo-900/30'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-605'
                      }`}
                    >
                      {num} Questions
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          <button
            id="quiz-arena-start-btn"
            onClick={startQuiz}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-3.5 text-sm sm:text-base font-bold text-white shadow-xl shadow-indigo-900/40 transition-all cursor-pointer"
          >
            Start Practice Quiz
          </button>
        </div>
      )}

      {/* CASE B: ACTIVE GAMING MODE DISPLAY */}
      {inQuiz && !quizFinished && activeQuestion && (
        <div className="space-y-6">
          
          {/* Top Gaming progress telemetry */}
          <div className="flex items-center justify-between rounded-3xl border border-zinc-800 bg-[#18181B] p-3.5 shadow-lg text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 font-semibold text-zinc-300">
              <Clock className="h-4 w-4 text-indigo-400" />
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-lg">
              Score: <b className="text-indigo-400">{score}</b> / {currentIndex}
            </span>
          </div>

          {/* Core Question Layout card */}
          <div className="rounded-3xl border border-zinc-800 bg-[#18181B] p-6 shadow-xl md:p-8 space-y-6">
            
            <div className="text-center space-y-4">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                activeQuestion.type === 'synonym'
                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40'
                  : 'bg-rose-50/10 text-rose-450 border border-rose-900/50'
              }`}>
                What is the {activeQuestion.type} of:
              </span>
              
              <div className="flex items-center justify-center gap-2.5 bg-zinc-900/40 py-4 px-6 rounded-2xl border border-zinc-800/80 max-w-sm mx-auto">
                <h3 className="font-display text-3xl font-extrabold tracking-tight text-zinc-100">
                  {activeQuestion.word}
                </h3>
                
                {/* Pronounce Trigger word icon */}
                <button
                  id="quiz-word-pronounce-btn"
                  onClick={() => handlePronounce(activeQuestion.word)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:bg-indigo-950/50 hover:text-indigo-400 border border-zinc-700/60 transition-all cursor-pointer"
                  title="Speak target word"
                >
                  <Volume2 className="h-4 w-4" />
                </button>
              </div>

              {/* Reveal translation clues drawer */}
              <div className="pt-2">
                {showHint ? (
                  <div className="inline-flex flex-col items-center gap-1 rounded-xl bg-zinc-905 px-4 py-2 border border-zinc-800 animate-slide-up">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase">Bilingual Clue:</span>
                    <span className="text-sm font-semibold font-display text-zinc-200">{activeQuestion.bengali}</span>
                  </div>
                ) : (
                  <button
                    id="quiz-hint-reveal-btn"
                    onClick={() => {
                      playSound('click');
                      setShowHint(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-indigo-400 cursor-pointer transition-colors bg-zinc-800 border border-zinc-700/80 px-3 py-1.5 rounded-lg"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-zinc-500" />
                    <span>Reveal Bengali Hint Meaning</span>
                  </button>
                )}
              </div>
            </div>

            {/* MCQ 4-Candidate Choices grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {activeQuestion.options.map((option, idx) => {
                const isSelected = selectedOption === option;
                const isCorrectAnswer = option === activeQuestion.correctAnswer;
                
                // Coloring classes dynamically based on query submission status
                let optionStyle = 'bg-zinc-900/60 border-zinc-750 text-zinc-350 hover:bg-zinc-800 hover:border-zinc-700';
                
                if (hasSubmitted) {
                  if (isCorrectAnswer) {
                    // Correct layout: bright green
                    optionStyle = 'bg-emerald-950/40 border-emerald-800 text-emerald-400 ring-2 ring-emerald-550/15 font-bold';
                  } else if (isSelected) {
                    // Selected wrong answer: bold crimson red
                    optionStyle = 'bg-rose-950/45 border-rose-850 text-rose-450 ring-2 ring-rose-550/15 font-bold';
                  } else {
                    // Other options after submission: dimmed down
                    optionStyle = 'bg-zinc-900/25 border-zinc-850 text-zinc-600 cursor-not-allowed opacity-50';
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-indigo-950/40 border-indigo-600 text-indigo-200 ring-2 ring-indigo-500/20 font-bold';
                }

                return (
                  <button
                    key={idx}
                    disabled={hasSubmitted}
                    id={`quiz-option-btn-${idx}`}
                    onClick={() => handleSelectOption(option)}
                    className={`flex items-start text-left gap-3.5 rounded-2xl border p-4 text-sm font-semibold transition-all cursor-pointer ${optionStyle}`}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-805 text-zinc-400 text-[10px] font-bold uppercase transition-colors">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 font-mono tracking-tight text-xs sm:text-sm">
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Answer details / Next Question action footer */}
            {hasSubmitted && (
              <div className="border-t border-zinc-800 pt-5 space-y-4 animate-slide-up">
                <div className="flex items-center gap-2 text-xs">
                  {selectedOption === activeQuestion.correctAnswer ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 fill-emerald-950/40" />
                      Correct answer! Brilliant work.
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-bold text-rose-400 flex-wrap">
                      <AlertTriangle className="h-4.5 w-4.5 text-rose-400 fill-rose-950/40" />
                      <span>Incorrect. Correct candidate was: </span>
                      <strong className="font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded text-indigo-400 block sm:inline">{activeQuestion.correctAnswer}</strong>
                    </span>
                  )}
                </div>

                <button
                  id="quiz-next-question-btn"
                  onClick={handleNextQuestion}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-900/30 transition-all cursor-pointer"
                >
                  <span>{currentIndex + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

          </div>

          <button
            id="quiz-quit-early-btn"
            onClick={handleResetQuiz}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-rose-455 transition-colors cursor-pointer"
          >
            Quit Quiz Practice Session
          </button>
        </div>
      )}

      {/* CASE C: QUIZ FINISHED CELEBRATION CONSOLE */}
      {quizFinished && (
        <div className="rounded-3xl border border-zinc-800 bg-[#18181B] p-6 shadow-xl md:p-8 text-center space-y-6">
          
          {/* trophy medal section */}
          <div className="relative inline-block animate-bounce">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-zinc-800 border border-zinc-700 mx-auto text-4xl shadow-md">
              <span>🏆</span>
            </div>
            {score === questions.length && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white uppercase tracking-wider scale-110 shadow-lg">
                ★
              </span>
            )}
          </div>

          {/* congrats feedback values */}
          <div className="space-y-1.5">
            <h3 className="font-display text-2xl font-bold tracking-tight text-zinc-100">
              {score === questions.length 
                ? 'Mastery Level: 100% Perfect!' 
                : score >= questions.length * 0.8
                ? 'Amazing Score: Solid Progress!'
                : score >= questions.length * 0.5
                ? 'Strong Effort! Keep Reviving'
                : 'Revision Session Complete'}
            </h3>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              You scored <b className="text-zinc-200">{score}</b> out of <b className="text-zinc-200">{questions.length}</b> generated synonym/antonym challenges.
            </p>
          </div>

          {/* Stats indicators panel */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4.5 grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div>
              <span className="text-2xs font-semibold text-zinc-500 uppercase tracking-wider block mb-0.5">Scored Points:</span>
              <span className="text-base font-bold text-zinc-200 font-mono">{score} / {questions.length}</span>
            </div>
            <div>
              <span className="text-2xs font-semibold text-zinc-500 uppercase tracking-wider block mb-0.5">Success Rate:</span>
              <span className={`text-base font-bold font-mono ${
                score >= questions.length * 0.8 ? 'text-emerald-450' : 'text-indigo-400'
              }`}>
                {Math.round((score / questions.length) * 100)}%
              </span>
            </div>
          </div>

          {/* Action control block */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 max-w-md mx-auto">
            <button
              id="quiz-celebrate-replay-btn"
              onClick={startQuiz}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-900/30 transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry This Deck</span>
            </button>

            <button
              id="quiz-celebrate-reset-btn"
              onClick={handleResetQuiz}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 py-3.5 text-xs sm:text-sm font-bold text-zinc-300 hover:bg-zinc-750 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <span>Setup Custom Quiz</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
