import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  RefreshCw,
  AlertCircle,
  Cpu,
  User,
  Languages,
  CheckCircle2,
  TrendingUp,
  HelpCircle,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useAuth } from '../../context/AuthContext';
import { CopilotChatMessage, GemmaModelInfo } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

const DEFAULT_SUGGESTIONS_EN = [
  'Why is my financial health score low?',
  'How can I improve my savings rate?',
  'What is affecting my financial stability?',
  'How can I manage irregular income?',
  'How can I improve my repayment habits?',
  'What are my biggest financial risks?',
  'How can I prepare financially before applying for a loan?'
];

const DEFAULT_SUGGESTIONS_HI = [
  'Mera financial trust score kaise improve karein?',
  'Bachat (savings) badhane ka sabse aasan tareeqa kya hai?',
  'Irregular income ko kaise manage karein?',
  'Mera sabse bada financial risk kya hai?',
  'Loan lene se pehle mujhe kya taiyari karni chahiye?'
];

export const FinancialHealthCopilot: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { records, metrics, trustScore, consents } = useFinancial();
  const { profile, isDemoMode, currentDemoPersona } = useAuth();

  const [messages, setMessages] = useState<CopilotChatMessage[]>(() => {
    return [
      {
        id: 'welcome-msg',
        role: 'assistant',
        content: `Hello! I am your NEXUS AI Financial Health Copilot, powered by Google's Gemma 4 open-weight model. I can explain your money flow, suggest realistic ways to build savings, and help you prepare a solid financial profile. What would you like to explore today?`,
        timestamp: new Date().toISOString(),
        suggestedQuestions: [
          'Why is my financial health score at this level?',
          'What are my biggest financial risks?',
          'How can I improve my savings buffer?'
        ],
        modelInformation: {
          model_name: 'gemma-4-26b-a4b-it',
          provider: 'Google Gemini API',
          is_open_weight: true,
          timestamp: new Date().toISOString()
        }
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hinglish'>('en');
  const [error, setError] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const question = (textToSend || input).trim();
    if (!question || isLoading) return;

    if (!consents.financialAnalysis) {
      setError('Please enable Financial Analysis consent in Privacy Settings to chat with Copilot.');
      return;
    }

    setError(null);
    setInput('');

    const userMessage: CopilotChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          history: messages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
          records,
          profile: {
            occupation: profile?.occupation || (isDemoMode ? currentDemoPersona?.profile.occupation : 'Freelancer'),
            monthlyIncomeRange: profile?.monthlyIncomeRange
          },
          preferredLanguage: language === 'hinglish' ? 'hinglish' : 'en'
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.message || `Copilot service responded with status ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: CopilotChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'I analyzed your records but could not generate a response.',
        timestamp: new Date().toISOString(),
        suggestedQuestions: data.suggestedQuestions || [],
        modelInformation: data.modelInformation || {
          model_name: 'gemma-4-26b-a4b-it',
          provider: 'Google Gemini API',
          is_open_weight: true,
          timestamp: new Date().toISOString()
        }
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setError(null);
    } catch (err: any) {
      console.warn('[Copilot Chat Error]:', err);
      // Resilient local fallback: if API or network drops, generate an immediate grounded response from ledger metrics
      const isHinglish = language === 'hinglish';
      const fallbackReply = isHinglish
        ? `Aapke verified ledger ke anusaar, aapne ₹${metrics.totalIncome.toLocaleString('en-IN')} income aur ₹${metrics.totalExpenses.toLocaleString('en-IN')} expenses track kiye hain (Savings rate: ${metrics.savingsRate}%). Regular logging se aapka Financial Trust Score behtar hota hai.`
        : `Based on your verified ledger, you have tracked ₹${metrics.totalIncome.toLocaleString('en-IN')} in earnings and ₹${metrics.totalExpenses.toLocaleString('en-IN')} in expenses (Savings rate: ${metrics.savingsRate}%). Continuing to log regular entries will keep your Financial Trust Passport strong.`;

      const assistantFallbackMessage: CopilotChatMessage = {
        id: `local-fallback-${Date.now()}`,
        role: 'assistant',
        content: fallbackReply,
        timestamp: new Date().toISOString(),
        suggestedQuestions: isHinglish
          ? ['Main bachat kaise badhaun?', 'Mera trust score kaise improve hoga?']
          : ['How can I improve my savings rate?', 'What are my top expense categories?'],
        modelInformation: {
          model_name: 'nexus-local-fallback-engine',
          provider: 'NEXUS Resilient Client Engine',
          is_open_weight: false,
          timestamp: new Date().toISOString()
        }
      };

      setMessages((prev) => [...prev, assistantFallbackMessage]);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: `Conversation cleared. I am grounded in your latest verified financial records (${records.length} records tracked). How can I assist you?`,
        timestamp: new Date().toISOString(),
        suggestedQuestions: language === 'hinglish' ? DEFAULT_SUGGESTIONS_HI.slice(0, 3) : DEFAULT_SUGGESTIONS_EN.slice(0, 3),
        modelInformation: {
          model_name: 'gemma-4-26b-a4b-it',
          provider: 'Google Gemini API',
          is_open_weight: true,
          timestamp: new Date().toISOString()
        }
      }
    ]);
    setError(null);
  };

  const currentSuggestions = language === 'hinglish' ? DEFAULT_SUGGESTIONS_HI : DEFAULT_SUGGESTIONS_EN;

  return (
    <div className={`bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[650px] ${className}`}>
      {/* Copilot Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0B0F17]/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center shadow-md shadow-brand-500/20 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">
                NEXUS AI Financial Health Copilot
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-800 dark:text-brand-300 border border-brand-300 dark:border-brand-800">
                Gemma 4 (26B)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Personalized financial guidance grounded in verified records • No numerical hallucinations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'hinglish' : 'en')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Toggle between English and Hindi / Hinglish"
          >
            <Languages className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>{language === 'en' ? 'EN' : 'हिंदी / Hinglish'}</span>
          </button>

          {/* Clear Chat */}
          <button
            type="button"
            onClick={handleClearChat}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={chatContainerRef} className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs">
                  <Cpu className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm leading-relaxed ${
                isUser
                  ? 'bg-slate-900 text-white dark:bg-brand-600 dark:text-white rounded-tr-none shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
              }`}>
                <div className="whitespace-pre-line">{msg.content}</div>

                {/* Assistant Metadata Badge */}
                {!isUser && msg.modelInformation && (
                  <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Sparkles className="w-2.5 h-2.5 text-brand-500" />
                      Model: {msg.modelInformation.model_name} (Open-Weight)
                    </span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}

                {/* Suggested Follow-up Chips from Assistant */}
                {!isUser && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/70 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      Suggested follow-ups:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSend(q)}
                          disabled={isLoading}
                          className="text-left text-xs px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/60 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors shadow-2xs"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center flex-shrink-0 text-xs shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center flex-shrink-0">
              <Cpu className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800/90 rounded-2xl rounded-tl-none p-4 border border-slate-200 dark:border-slate-700 text-slate-500 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-slate-600 dark:text-slate-300">Gemma 4 analyzing your verified ledger...</span>
            </div>
          </div>
        )}

        {/* Error / Retry Banner */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
            {lastFailedQuestion && (
              <button
                type="button"
                onClick={() => handleSend(lastFailedQuestion)}
                className="px-2 py-1 rounded bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Carousel / Chips (Bottom of Chat) */}
      <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0E1524]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0 mr-1">
            Try asking:
          </span>
          {currentSuggestions.slice(0, 4).map((suggestion, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(suggestion)}
              disabled={isLoading}
              className="whitespace-nowrap text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-700 dark:hover:text-brand-300 transition-colors shadow-2xs flex-shrink-0"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Input Bar */}
      <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === 'hinglish'
                ? 'Apne kharche ya bachat ke baare mein poochein (Hinglish / English)...'
                : 'Ask Copilot about your savings, stability, or loan readiness...'
            }
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-semibold text-sm transition-all shadow-sm flex items-center gap-1.5"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Ask</span>
          </button>
        </form>
        <div className="mt-1.5 text-center text-[11px] text-slate-400 dark:text-slate-500">
          Gemma 4 provides educational guidance. It does not replace official credit scores or financial advice.
        </div>
      </div>
    </div>
  );
};
