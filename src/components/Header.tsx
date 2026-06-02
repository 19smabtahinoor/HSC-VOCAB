import React from 'react';
import { BookOpen, Star, CheckCircle, Volume2, ShieldQuestion } from 'lucide-react';

interface HeaderProps {
  totalCount: number;
  starredCount: number;
  learnedCount: number;
  quizHighScore: number;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  starredCount,
  learnedCount,
  quizHighScore,
  soundEnabled,
  setSoundEnabled
}) => {
  const percentLearned = totalCount > 0 ? Math.round((learnedCount / totalCount) * 100) : 0;

  return (
    <header className="relative w-full border-b border-zinc-800 bg-[#09090B]">
      {/* Decorative colored top aesthetic accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-800 shadow-[0_1px_10px_rgba(79,70,229,0.3)]" />
      
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          
          {/* Main Title Metadata */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-900/50 bg-[#18181B] px-3 py-1 text-xs font-semibold text-indigo-400">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              HSC English 2nd Paper Prep
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
              HSC Synonym & Antonym Prep
            </h1>
            <p className="text-sm text-zinc-400 sm:text-base">
              Question No. 11 Syllabus &bull; Comprehensive study bank with dual-language meanings
            </p>
          </div>

          {/* Quick Stats Toolbar & Settings */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Audio Toggle Indicator */}
            <button
              id="header-sound-toggle-btn"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
                soundEnabled
                  ? 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700'
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
              title={soundEnabled ? 'Mute study sound effects' : 'Enable study sound effects'}
              aria-label="Toggle study sound effects"
            >
              <Volume2 className={`h-4.5 w-4.5 ${soundEnabled ? 'text-white' : 'text-zinc-400'}`} />
              <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
            </button>

            {/* High Score Flag */}
            {quizHighScore > 0 && (
              <div className="inline-flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-2 text-sm font-medium text-amber-400">
                <span className="text-amber-500">🏆</span>
                <span>Best Quiz: <b>{quizHighScore}%</b></span>
              </div>
            )}
          </div>

        </div>

        {/* Dense Dashboard Metrics Row */}
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          
          {/* Card 1: Total Dataset */}
          <div className="rounded-3xl border border-zinc-800 bg-[#18181B] p-4 transition-all hover:border-zinc-700 md:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Syllabus Words</dt>
                <dd className="text-xl font-bold font-display text-zinc-100 sm:text-2xl">{totalCount}</dd>
              </div>
            </div>
          </div>

          {/* Card 2: Learned Progression */}
          <div className="rounded-3xl border border-zinc-800 bg-[#18181B] p-4 transition-all hover:border-zinc-700 md:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-950/35 border border-emerald-800/30 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline justify-between col-span-2">
                  <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Mastered</dt>
                  <span className="text-xs font-semibold text-emerald-400">{percentLearned}%</span>
                </div>
                <dd className="text-xl font-bold font-display text-zinc-100 sm:text-2xl">{learnedCount}</dd>
              </div>
            </div>
            
            {/* Progression bar */}
            <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${percentLearned}%` }}
              />
            </div>
          </div>

          {/* Card 3: Starred Review Items */}
          <div className="rounded-3xl border border-zinc-800 bg-[#18181B] p-4 transition-all hover:border-zinc-700 md:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-950/35 border border-amber-850/30 text-amber-400">
                <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
              </div>
              <div>
                <dt className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Starred List</dt>
                <dd className="text-xl font-bold font-display text-zinc-100 sm:text-2xl">{starredCount}</dd>
              </div>
            </div>
          </div>

          {/* Card 4: Action helper note */}
          <div className="rounded-3xl border border-indigo-900/30 bg-indigo-950/15 p-4 transition-all hover:bg-indigo-950/25 md:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 min-w-10 items-center justify-center rounded-xl bg-indigo-900/40 text-indigo-400">
                <ShieldQuestion className="h-5 w-5" />
              </div>
              <div className="text-xs text-indigo-200 leading-relaxed">
                <b>Pro Tip:</b> Use the flashcards deck on mobile for interactive audio rehearsal before exams.
              </div>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
