export type EntryType = 'synonym' | 'antonym';

export interface WordEntry {
  id: string; // generated unique id
  word: string;
  type: EntryType;
  answer: string;
  bengali: string;
}

export interface UserProgress {
  bookmarked: string[]; // array of word ids
  learned: string[];    // array of word ids
  quizHighScores: QuizScore[];
}

export interface QuizScore {
  date: string;
  score: number;
  total: number;
}

export interface QuizQuestion {
  word: string;
  type: EntryType;
  correctAnswer: string;
  bengali: string;
  options: string[];
}
