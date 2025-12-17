import React from 'react';
import { EvaluationResult } from '../types';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: EvaluationResult | null;
  isLoading: boolean;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({ isOpen, onClose, result, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-paper-white w-full max-w-md rounded-lg shadow-2xl overflow-hidden border border-stone-200">
        
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-seal-red border-t-transparent rounded-full animate-spin"></div>
             <p className="text-stone-600 font-serif animate-pulse">Sensei is reviewing your work...</p>
          </div>
        ) : result ? (
          <>
            <div className="bg-seal-red p-4 text-white flex justify-between items-center">
              <h3 className="font-serif text-xl font-bold">Evaluation</h3>
              <button onClick={onClose} className="hover:bg-red-800 p-1 rounded transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-sm text-stone-500 uppercase tracking-wider">Score</span>
                    <span className={`text-6xl font-serif font-bold ${result.score > 80 ? 'text-green-600' : result.score > 60 ? 'text-amber-600' : 'text-red-600'}`}>
                        {result.score}
                    </span>
                </div>
                <div className="text-right space-y-2">
                    <div className="text-sm"><span className="text-stone-500">Balance:</span> <span className={`font-bold ml-1 ${result.balance === 'Excellent' ? 'text-green-700' : 'text-stone-800'}`}>{result.balance}</span></div>
                    <div className="text-sm"><span className="text-stone-500">Accuracy:</span> <span className={`font-bold ml-1 ${result.strokeAccuracy === 'High' ? 'text-green-700' : 'text-stone-800'}`}>{result.strokeAccuracy}</span></div>
                </div>
              </div>

              {result.summary && (
                <div className="p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-md">
                   <p className="text-blue-900 italic font-medium">"{result.summary}"</p>
                </div>
              )}

              <div className="bg-stone-100 p-4 rounded-md border border-stone-200">
                <h4 className="text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">Detailed Critique</h4>
                <p className="text-stone-700 text-sm leading-relaxed">{result.critique}</p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-stone-500 mb-2 uppercase tracking-wide">Key Improvements</h4>
                <ul className="list-disc list-inside space-y-1">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="text-sm text-stone-600">{s}</li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={onClose}
                className="w-full bg-stone-800 hover:bg-black text-white py-3 rounded-md transition-all font-medium"
              >
                Continue Practice
              </button>
            </div>
          </>
        ) : (
             <div className="p-8 text-center text-red-500">
                Failed to load results. Please try again.
                <button onClick={onClose} className="mt-4 block mx-auto text-sm underline text-stone-500">Close</button>
             </div>
        )}
      </div>
    </div>
  );
};