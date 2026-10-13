import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface SimpleExplainerProps {
  term: string;
  explanation: string;
  example?: string;
}

export const SimpleExplainer: React.FC<SimpleExplainerProps> = ({ term, explanation, example }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="relative inline-flex items-center gap-1 group">
      <span className="underline decoration-dotted decoration-slate-400 dark:decoration-slate-500 underline-offset-2 cursor-help text-slate-800 dark:text-slate-200">
        {term}
      </span>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="text-slate-400 hover:text-brand-600 focus:outline-none"
        aria-label={`What does ${term} mean?`}
      >
        <HelpCircle className="w-3.5 h-3.5 inline" />
      </button>

      {isOpen && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg shadow-2xl border border-slate-700/80 z-50 pointer-events-none transition-opacity duration-150">
          <span className="block font-semibold text-brand-300 mb-1">{term}</span>
          <span className="block text-slate-200 leading-relaxed">{explanation}</span>
          {example && (
            <span className="block mt-1.5 pt-1.5 border-t border-slate-700/60 text-[11px] text-slate-300">
              <strong className="text-brand-400">Example: </strong>
              {example}
            </span>
          )}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800"></span>
        </span>
      )}
    </span>
  );
};
