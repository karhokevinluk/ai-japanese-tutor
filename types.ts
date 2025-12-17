export enum CharacterType {
  HIRAGANA = 'Hiragana',
  KATAKANA = 'Katakana',
  KANJI_N5 = 'Kanji (N5)',
  KANJI_N4 = 'Kanji (N4)',
}

export interface CharacterData {
  char: string;
  romaji: string;
  meaning?: string;
  onReading?: string; // Onyomi
  kunReading?: string; // Kunyomi
}

export interface EvaluationResult {
  score: number; // 0-100
  summary: string; // Generalized one-sentence comment
  critique: string;
  suggestions: string[];
  strokeAccuracy: 'Low' | 'Medium' | 'High';
  balance: 'Poor' | 'Good' | 'Excellent';
}

export interface DrawingPoint {
  x: number;
  y: number;
}