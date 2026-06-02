import React, { useState, useEffect } from 'react';
import { wordList } from './data';
import { Header } from './components/Header';
import { VocabularyBank } from './components/VocabularyBank';
import { Flashcards } from './components/Flashcards';
import { QuizArena } from './components/QuizArena';
import { BookOpen, HelpCircle, Award, Sparkles, Star, Download, Printer, Share2, Music, Wifi, WifiOff } from 'lucide-react';
import { playSound } from './utils/audio';

// Dynamic verification portal before entering the platform
function RegistrationGate({ onRegister }: { onRegister: (user: { name: string; email: string; liked: boolean | null }) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Please specify both your name and email.');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address (e.g. student@college.edu).');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.success) {
        onRegister(data.user);
      } else {
        setError(data.error || 'Failed to initialize session.');
      }
    } catch (err) {
      console.error('Neon DB connection error, using local fallback:', err);
      // Clean offline fallback so students are never blocked if database config is loading
      onRegister({ name: name.trim(), email: email.trim().toLowerCase(), liked: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090B] p-4 font-sans text-zinc-100 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.08)_0,transparent_75%)] pointer-events-none" />
      
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-[#141417]/95 p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-indigo-500/10 blur-xl" />
        
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 border border-zinc-700 text-indigo-400 shadow-md">
            <BookOpen className="h-7 w-7 text-indigo-400" />
          </div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            HSC Vocab
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            HSC English 2nd Paper Prep Portal (Question 11)
          </p>
        </div>

        <div className="border-t border-zinc-800/80 pt-4">
          <p className="text-xs text-zinc-400 text-center leading-relaxed mb-5">
            Welcome, student! Please enter your details below to establish your secure revision profile and synchronize database records.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5 align-middle">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Full Name
              </label>
              <input
                type="text"
                placeholder="S.M. Abtahi Noor"
                value={name}
                required
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 py-2.5 px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:bg-zinc-900 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-150"
              />
            </div>

            <div className="space-y-1.5 align-middle">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Email Address
              </label>
              <input
                type="email"
                placeholder="student@college.edu.bd"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 py-2.5 px-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:bg-zinc-900 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all duration-150"
              />
            </div>

            {error && (
              <p className="text-xs font-medium text-rose-450 text-center bg-rose-950/20 border border-rose-900/40 p-2.5 rounded-lg">
                ⚠️ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-900/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Initializing Portal...' : 'Enter Prep Platform'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; liked: boolean | null } | null>(() => {
    try {
      const saved = localStorage.getItem('hsc_user_profile');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [liveLikes, setLiveLikes] = useState<number>(0);

  // PWA installation & Offline status states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(() => {
    // Hide initially if already installed or dismissed in past session
    return localStorage.getItem('pwa_banner_dismissed') !== 'true';
  });
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [showIOSHint, setShowIOSHint] = useState<boolean>(false);

  useEffect(() => {
    // 1. Listen for browser network status online/offline changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 2. Capture native mobile or desktop "install app" eligibility trigger
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Ensure banner comes active when system reports app is installable
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Detect iOS and Safari standalone states for instructions display
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isSafariIOS = /iphone|ipad|ipod/.test(userAgent) && !/crios|fxios/.test(userAgent);
    const isAppStandalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;

    if (isSafariIOS && !isAppStandalone) {
      setIsIOS(true);
    }

    // 4. Capture successful app installations
    const handleAppInstalled = () => {
      console.log('HSC Companion: App installed successfully!');
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (isIOS) {
      setShowIOSHint(true);
      playSound('click');
      return;
    }

    if (!deferredPrompt) {
      // Fallback instruction helper if the event is delayed
      alert("Installation is fully supported on your browser! Tap your browser menu button (e.g. Chrome's three dots ⋮ or Edge's menu) and select 'Install app' or 'Add to Home screen'.");
      return;
    }

    playSound('click');
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User design prompt installation outcome: ${outcome}`);
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    }
  };

  // Synchronize overall stats from database
  useEffect(() => {
    fetch('/api/likes/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLiveLikes(data.totalLikes);
        }
      })
      .catch((err) => console.error('Failed to synchronize likes from Neon DB:', err));
  }, []);

  // Synchronize dynamic user likes profile directly from database, bypassing stale local storage
  useEffect(() => {
    if (userProfile?.email) {
      fetch(`/api/users/profile?email=${encodeURIComponent(userProfile.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            const updated = {
              name: data.user.name,
              email: data.user.email,
              liked: data.user.liked
            };
            setUserProfile(updated);
            localStorage.setItem('hsc_user_profile', JSON.stringify(updated));
          }
        })
        .catch((err) => console.error('Failed to sync profile status from DB:', err));
    }
  }, [userProfile?.email]);

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
  const toggleAppLike = async () => {
    if (!userProfile) return;
    const newLiked = !userProfile.liked;

    try {
      const res = await fetch('/api/users/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userProfile.email, liked: newLiked }),
      });
      const data = await res.json();
      if (data.success) {
        const updatedProfile = { ...userProfile, liked: newLiked };
        setUserProfile(updatedProfile);
        localStorage.setItem('hsc_user_profile', JSON.stringify(updatedProfile));
        setLiveLikes(data.totalLikes);
        playSound('click');
      }
    } catch (err) {
      console.error('Failed to log like choice in Neon DB:', err);
    }
  };

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

  // Securely gate access to user profile registration
  if (!userProfile) {
    return (
      <RegistrationGate
        onRegister={(user) => {
          setUserProfile(user);
          localStorage.setItem('hsc_user_profile', JSON.stringify(user));
          playSound('click');
          // Update live statistics count
          fetch('/api/likes/stats')
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                setLiveLikes(data.totalLikes);
              }
            })
            .catch((err) => console.error(err));
        }}
      />
    );
  }

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

        {/* Dynamic Mobile/Desktop PWA Install & Offline Awareness Banner */}
        {showInstallBanner && (
          <div className="rounded-2xl border border-indigo-900/30 bg-indigo-950/10 p-4 transition-all relative overflow-hidden backdrop-blur-md">
            <div className="absolute top-3 right-3">
              <button
                onClick={() => {
                  setShowInstallBanner(false);
                  localStorage.setItem('pwa_banner_dismissed', 'true');
                  playSound('click');
                }}
                className="text-zinc-500 hover:text-zinc-350 transition-colors cursor-pointer text-xs font-semibold px-2 py-1 rounded bg-zinc-900/60 border border-zinc-800/40"
              >
                ✕ Dismiss
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pr-12">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 min-w-[48px] items-center justify-center rounded-2xl bg-indigo-900/30 text-indigo-400 border border-indigo-800/20">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
                    Study 100% Offline with Desktop & Mobile PWA
                    {isOnline ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Wifi className="h-2.5 w-2.5 animate-pulse" /> Online Synced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <WifiOff className="h-2.5 w-2.5" /> Offline Mode Active
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-3xl">
                    Add this Question 11 syllabus Companion directly to your device launcher. It compiles instantly and runs offline, ensuring robust practice sessions without any mobile data depletion or network outages.
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center w-full md:w-auto">
                <button
                  onClick={handleInstallApp}
                  className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg hover:shadow-indigo-900/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Download className="h-4 w-4 animate-bounce" />
                  <span>{isIOS ? 'Show iOS Setup' : 'Install Syllabus Companion'}</span>
                </button>
              </div>
            </div>

            {/* iOS Safari custom installation guidelines overlay */}
            {showIOSHint && (
              <div className="mt-4 border-t border-zinc-800/60 pt-4 text-xs text-zinc-400 space-y-2 max-w-xl animate-fade-in">
                <p className="font-bold text-indigo-300">📱 Simple Safari iOS Setup Instructions:</p>
                <ol className="list-decimal list-inside pl-1 space-y-1.5 text-zinc-350">
                  <li>Tap the circular <span className="text-white font-semibold">Share Icon</span> at the base of your Safari viewport.</li>
                  <li>Scroll down and select <span className="text-white font-semibold">"Add to Home Screen"</span>.</li>
                  <li>Click <span className="text-indigo-400 font-semibold">"Add"</span> in the upper right. The companion will now load flawlessly without internet.</li>
                </ol>
                <div className="pt-1">
                  <button
                    onClick={() => setShowIOSHint(false)}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                  >
                    Got it, close guide
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navigation Tab selection panel */}
        <div className="flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center justify-between border border-zinc-800 bg-[#18181B] shadow-lg rounded-2xl px-5 py-4">
          
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 min-[480px]:pb-0 scrollbar-none">
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
      <footer className="w-full border-t border-zinc-800 bg-[#09090B] py-6 mt-12 print:hidden pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <p className="text-xs text-zinc-500">
              &copy; 2026 HSC English Companion. Developed by{" "}
              <a
                href="https://smabtahinoor.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors underline decoration-indigo-500/30 underline-offset-2"
              >
                S.M.Abtahi Noor
              </a>
            </p>
            <div className="flex justify-center gap-4 text-xs font-semibold text-zinc-500">
              <span>Question Number 11 Study Module</span>
              <span>&bull;</span>
              <span>Study Offline with Flashcards</span>
              {!showInstallBanner && (
                <>
                  <span>&bull;</span>
                  <button
                    onClick={() => {
                      setShowInstallBanner(true);
                      localStorage.setItem('pwa_banner_dismissed', 'false');
                      playSound('click');
                    }}
                    className="text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer underline flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" /> Install App
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Real-time Neon Likes Counter and Active Session Metadata */}
          <div className="border-t border-zinc-800/80 pt-6 flex flex-col items-center justify-between gap-4 sm:flex-row text-xs text-zinc-500">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <span className="text-zinc-400">Do you like this project?</span>
              <button
                onClick={toggleAppLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-bold ${
                  userProfile.liked
                    ? 'bg-rose-500/15 border-rose-500/35 text-rose-400 shadow-sm'
                    : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750 text-zinc-300 hover:text-white'
                }`}
              >
                <span className="text-sm">{userProfile.liked ? '❤️' : '🤍'}</span>
                <span>{userProfile.liked ? 'Liked!' : 'Like Project'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 bg-rose-500/5 border border-rose-500/15 px-3.5 py-1.5 rounded-full text-rose-400 text-xs font-bold shadow-md shadow-rose-950/20">
              <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Loved by <b className="font-mono text-white text-sm bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md ml-1 mr-1">{liveLikes}</b> users</span>
            </div>

            <div className="text-zinc-500 text-center sm:text-right">
              Signed in as <span className="font-semibold text-zinc-300">{userProfile.name}</span> &bull;{" "}
              <button
                onClick={() => {
                  localStorage.removeItem('hsc_user_profile');
                  setUserProfile(null);
                  playSound('click');
                }}
                className="text-zinc-400 hover:text-rose-450 transition-colors underline cursor-pointer font-medium"
              >
                Change Session
              </button>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
