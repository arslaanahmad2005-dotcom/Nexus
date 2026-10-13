import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  FinancialRecord,
  FinancialMetrics,
  AIAnalysisResult,
  FinancialPassport,
  PassportShareLink,
  SupportingDocument,
  RecordType,
  AnalysisPeriod,
  FinancialTrustScore
} from '../types';
import {
  calculateFinancialMetrics,
  calculateFinancialTrustScore,
  filterRecordsByPeriod,
  calculatePeriodComparison,
  generateDeterministicAnalysis
} from '../lib/calculations';
import { DEMO_PERSONAS } from '../data/demoData';

interface FinancialContextType {
  records: FinancialRecord[];
  metrics: FinancialMetrics;
  trustScore: FinancialTrustScore;
  analysis: AIAnalysisResult | null;
  passport: FinancialPassport | null;
  shareLinks: PassportShareLink[];
  documents: SupportingDocument[];
  consents: {
    financialAnalysis: boolean;
    passportSharing: boolean;
    dataStorage: boolean;
  };
  isAnalyzing: boolean;
  isGeneratingPassport: boolean;
  isSharingPassport: boolean;
  error: string | null;
  clearError: () => void;
  // Actions
  addRecord: (record: Omit<FinancialRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  updateRecord: (id: string, updates: Partial<FinancialRecord>) => Promise<boolean>;
  deleteRecord: (id: string) => Promise<boolean>;
  runAIAnalysis: (period?: AnalysisPeriod) => Promise<AIAnalysisResult | null>;
  askFollowUpQuestion: (question: string, period?: AnalysisPeriod) => Promise<string | null>;
  generatePassport: () => Promise<FinancialPassport | null>;
  createShareLink: (options: {
    recipientLabel: string;
    includedFields: ('summary' | 'income_consistency' | 'expense_breakdown' | 'repayments' | 'actionable_suggestions' | 'trust_score')[];
    expiresInHours: number;
  }) => Promise<{ shareUrl: string; shareToken: string; expiresAt: string } | null>;
  revokeShareLink: (shareId: string, shareToken?: string) => Promise<boolean>;
  uploadDocument: (file: File, documentType: SupportingDocument['documentType'], notes?: string) => Promise<boolean>;
  deleteDocument: (id: string) => Promise<boolean>;
  grantConsent: (type: 'financialAnalysis' | 'passportSharing' | 'dataStorage') => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isDemoMode, currentDemoPersona } = useAuth();

  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [passport, setPassport] = useState<FinancialPassport | null>(null);
  const [shareLinks, setShareLinks] = useState<PassportShareLink[]>([]);
  const [documents, setDocuments] = useState<SupportingDocument[]>([]);
  const [consents, setConsents] = useState({
    financialAnalysis: true,
    passportSharing: true,
    dataStorage: true
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPassport, setIsGeneratingPassport] = useState(false);
  const [isSharingPassport, setIsSharingPassport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  const generateSafeUUID = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      try {
        return crypto.randomUUID();
      } catch {
        // fallback
      }
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const saveRecordsToStorage = (updated: FinancialRecord[]) => {
    if (isDemoMode && currentDemoPersona) {
      localStorage.setItem(`nexus_demo_records_${currentDemoPersona.id}`, JSON.stringify(updated));
      const shortKey = currentDemoPersona.id.replace('demo-', '').split('-')[0];
      localStorage.setItem(`nexus_demo_records_${shortKey}`, JSON.stringify(updated));
    } else {
      const targetId = user?.id || 'nexus_local_user';
      localStorage.setItem(`nexus_user_records_${targetId}`, JSON.stringify(updated));
    }
  };

  // Synchronize state when user or demo mode changes
  useEffect(() => {
    if (isDemoMode && currentDemoPersona) {
      const shortKey = currentDemoPersona.id.replace('demo-', '').split('-')[0];
      const saved =
        localStorage.getItem(`nexus_demo_records_${currentDemoPersona.id}`) ||
        localStorage.getItem(`nexus_demo_records_${shortKey}`);

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setRecords(parsed);
          } else {
            setRecords(currentDemoPersona.records);
          }
        } catch {
          setRecords(currentDemoPersona.records);
        }
      } else {
        setRecords(currentDemoPersona.records);
      }

      const savedPass =
        localStorage.getItem(`nexus_demo_passport_${currentDemoPersona.id}`) ||
        localStorage.getItem(`nexus_demo_passport_${shortKey}`);
      if (savedPass) {
        try {
          setPassport(JSON.parse(savedPass));
        } catch {
          setPassport(currentDemoPersona.passport);
        }
      } else {
        setPassport(currentDemoPersona.passport);
      }
      setDocuments([
        {
          id: 'doc-demo-1',
          userId: currentDemoPersona.profile.id,
          fileName: 'Client_Retainer_Agreement_2026.pdf',
          fileSizeBytes: 1420500,
          mimeType: 'application/pdf',
          documentType: 'Freelance Invoice',
          status: 'Reviewed',
          notes: 'Signed client scope & monthly payment schedule',
          uploadedAt: '2026-09-01T10:00:00Z'
        },
        {
          id: 'doc-demo-2',
          userId: currentDemoPersona.profile.id,
          fileName: 'Bajaj_Finserv_NOC_Debit_Proof.pdf',
          fileSizeBytes: 650200,
          mimeType: 'application/pdf',
          documentType: 'Loan & EMI Repayment' as any,
          status: 'Reviewed',
          notes: 'Auto-debit confirmation showing zero bounce',
          uploadedAt: '2026-08-15T10:00:00Z'
        }
      ]);
      return;
    }

    if (user) {
      loadUserData(user.id);
    } else {
      // Check if guest/local records exist
      const localSaved = localStorage.getItem('nexus_user_records_nexus_local_user');
      if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          if (Array.isArray(parsed)) setRecords(parsed);
        } catch {
          setRecords([]);
        }
      } else {
        setRecords([]);
      }
      setAnalysis(null);
      setPassport(null);
      setShareLinks([]);
      setDocuments([]);
    }
  }, [user, isDemoMode, currentDemoPersona]);

  const loadUserData = async (userId: string) => {
    // 1. Immediately load local cache for instantaneous rendering
    const cacheKey = `nexus_user_records_${userId}`;
    const cached = localStorage.getItem(cacheKey);
    let initialRecords: FinancialRecord[] = [];
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          initialRecords = parsed;
          setRecords(parsed);
        }
      } catch {
        // ignore parse error
      }
    }

    try {
      // 2. Fetch fresh records from Supabase
      if (isSupabaseConfigured) {
        const { data: recData, error: recErr } = await supabase
          .from('financial_records')
          .select('*')
          .eq('user_id', userId)
          .order('record_date', { ascending: false });

        if (recErr) {
          console.warn('[NEXUS Data] Supabase records fetch note:', recErr.message);
        } else if (recData && recData.length > 0) {
          const formatted: FinancialRecord[] = recData.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            recordType: r.record_type,
            amount: Number(r.amount),
            recordDate: r.record_date,
            category: r.category,
            description: r.description || '',
            isRecurring: Boolean(r.is_recurring),
            createdAt: r.created_at,
            updatedAt: r.updated_at
          }));
          setRecords(formatted);
          localStorage.setItem(cacheKey, JSON.stringify(formatted));
        } else if (initialRecords.length > 0) {
          // If Supabase is empty (brand new user) but local records exist, push them to Supabase
          for (const lr of initialRecords) {
            try {
              await supabase.from('financial_records').insert({
                id: lr.id,
                user_id: userId,
                record_type: lr.recordType,
                amount: lr.amount,
                record_date: lr.recordDate,
                category: lr.category,
                description: lr.description || '',
                is_recurring: Boolean(lr.isRecurring)
              });
            } catch {
              // ignore background sync failure
            }
          }
        }
      }

      // 3. Check local passport cache first
      const passCacheKey = `nexus_user_passport_${userId}`;
      const cachedPassport = localStorage.getItem(passCacheKey);
      if (cachedPassport) {
        try {
          setPassport(JSON.parse(cachedPassport));
        } catch {
          // ignore parse error
        }
      }

      // 4. Fetch latest passport
      if (isSupabaseConfigured) {
        const { data: passData } = await supabase
          .from('financial_passports')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (passData) {
          const loadedPass: FinancialPassport = {
            id: passData.id,
            userId: passData.user_id,
            userName: profile?.fullName || 'Nexus User',
            occupation: (profile?.occupation || 'Freelancer') as any,
            version: passData.version,
            status: passData.status,
            passportHeadline: passData.headline,
            incomeStabilityLabel: passData.income_stability_label,
            repaymentDisciplineLabel: passData.repayment_discipline_label,
            savingsHabitLabel: passData.savings_habit_label,
            profileCompleteness: passData.passport_data?.profileCompleteness || 80,
            lastAnalysisDate: passData.updated_at,
            metrics: passData.passport_data?.metrics || calculateFinancialMetrics([]),
            trustScore: passData.passport_data?.trustScore,
            aiInsights: passData.passport_data?.aiInsights || {
              summary: '',
              positiveIndicators: [],
              areasForAttention: [],
              actionableSuggestions: [],
              missingInformation: [],
              modelUsed: 'gemini-1.5-flash'
            },
            supportingDocsSummary: passData.passport_data?.supportingDocsSummary || { totalUploaded: 0, types: [] },
            disclaimer: 'NEXUS is an alternative assessment tool and does not guarantee loan approval.',
            createdAt: passData.created_at,
            updatedAt: passData.updated_at
          };
          setPassport(loadedPass);
          localStorage.setItem(passCacheKey, JSON.stringify(loadedPass));
        }

        // 4. Fetch share links
        const { data: linksData } = await supabase
          .from('passport_share_links')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (linksData) {
          setShareLinks(
            linksData.map((l: any) => ({
              id: l.id,
              passportId: l.passport_id,
              shareToken: l.share_token_hash,
              recipientLabel: l.recipient_label,
              includedFields: l.included_fields,
              expiresAt: l.expires_at,
              isRevoked: l.is_revoked,
              revokedAt: l.revoked_at,
              accessCount: l.access_count,
              lastAccessedAt: l.last_accessed_at,
              createdAt: l.created_at
            }))
          );
        }

        // 5. Fetch supporting documents
        const { data: docsData } = await supabase
          .from('supporting_documents')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (docsData) {
          setDocuments(
            docsData.map((d: any) => ({
              id: d.id,
              userId: d.user_id,
              fileName: d.file_name,
              fileSizeBytes: d.file_size_bytes,
              mimeType: d.mime_type,
              documentType: d.document_type,
              status: d.status,
              notes: d.notes,
              uploadedAt: d.created_at
            }))
          );
        }
      }
    } catch (_err) {
      console.warn('[NEXUS Data] Records load exception handled safely');
    }
  };

  // Dynamically compute metrics and trust score whenever records change
  const metrics = useMemo(() => {
    return calculateFinancialMetrics(records);
  }, [records]);

  const trustScore = useMemo(() => {
    return calculateFinancialTrustScore(records, profile ? { occupation: profile.occupation } : undefined);
  }, [records, profile]);

  const addRecord = async (
    record: Omit<FinancialRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    try {
      const currentUserId = user?.id || (isDemoMode ? currentDemoPersona?.id : 'nexus_local_user') || 'nexus_local_user';
      const newId = isDemoMode ? `demo-rec-${Date.now()}` : generateSafeUUID();
      const now = new Date().toISOString();

      const newRecord: FinancialRecord = {
        id: newId,
        userId: currentUserId,
        ...record,
        createdAt: now,
        updatedAt: now
      };

      // 1. Immediately update local state
      const updated = [newRecord, ...records];
      setRecords(updated);

      // 2. Persist to storage
      saveRecordsToStorage(updated);

      // 3. Background sync to Supabase if authenticated
      if (isSupabaseConfigured && user && !isDemoMode) {
        try {
          const { error: insErr } = await supabase.from('financial_records').insert({
            id: newId,
            user_id: user.id,
            record_type: record.recordType,
            amount: record.amount,
            record_date: record.recordDate,
            category: record.category,
            description: record.description || '',
            is_recurring: Boolean(record.isRecurring)
          });

          if (insErr) {
            console.warn('[NEXUS Data] Cloud sync notice on insert:', insErr.message);
          }
        } catch (dbErr: any) {
          console.warn('[NEXUS Data] Supabase insert exception:', dbErr?.message);
        }
      }

      return true;
    } catch (err: any) {
      console.error('[NEXUS Data] Failed to add record:', err);
      setError(err.message || 'Failed to add record');
      return false;
    }
  };

  const updateRecord = async (id: string, updates: Partial<FinancialRecord>): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      const updated = records.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: now } : r
      );
      setRecords(updated);
      saveRecordsToStorage(updated);

      if (isSupabaseConfigured && user && !isDemoMode) {
        try {
          const payload: any = { updated_at: now };
          if (updates.recordType !== undefined) payload.record_type = updates.recordType;
          if (updates.amount !== undefined) payload.amount = updates.amount;
          if (updates.recordDate !== undefined) payload.record_date = updates.recordDate;
          if (updates.category !== undefined) payload.category = updates.category;
          if (updates.description !== undefined) payload.description = updates.description;
          if (updates.isRecurring !== undefined) payload.is_recurring = updates.isRecurring;

          const { error: updErr } = await supabase.from('financial_records').update(payload).eq('id', id);
          if (updErr) {
            console.warn('[NEXUS Data] Cloud sync notice on update:', updErr.message);
          }
        } catch (dbErr: any) {
          console.warn('[NEXUS Data] Supabase update exception:', dbErr?.message);
        }
      }

      return true;
    } catch (err: any) {
      console.error('[NEXUS Data] Failed to update record:', err);
      setError(err.message || 'Failed to update record');
      return false;
    }
  };

  const deleteRecord = async (id: string): Promise<boolean> => {
    try {
      const updated = records.filter((r) => r.id !== id);
      setRecords(updated);
      saveRecordsToStorage(updated);

      if (isSupabaseConfigured && user && !isDemoMode) {
        try {
          const { error: delErr } = await supabase.from('financial_records').delete().eq('id', id);
          if (delErr) {
            console.warn('[NEXUS Data] Cloud sync notice on delete:', delErr.message);
          }
        } catch (dbErr: any) {
          console.warn('[NEXUS Data] Supabase delete exception:', dbErr?.message);
        }
      }

      return true;
    } catch (err: any) {
      console.error('[NEXUS Data] Failed to delete record:', err);
      setError(err.message || 'Failed to delete record');
      return false;
    }
  };

  const runAIAnalysis = async (period: AnalysisPeriod = 'all_time'): Promise<AIAnalysisResult | null> => {
    setIsAnalyzing(true);
    setError(null);

    const activeRecords = filterRecordsByPeriod(records, period);
    const activeMetrics = calculateFinancialMetrics(activeRecords);
    const calculatedTrustScore = calculateFinancialTrustScore(records, profile ? { occupation: profile.occupation } : undefined);
    const periodComparison = calculatePeriodComparison(records, period);

    try {
      let fullAnalysis: AIAnalysisResult | null = null;

      try {
        const response = await fetch('/api/analyze-finances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            records,
            metrics: activeMetrics,
            period,
            profile: {
              fullName: profile?.fullName || 'Nexus User',
              occupation: profile?.occupation || 'Freelancer',
              monthlyIncomeRange: profile?.monthlyIncomeRange
            },
            consents
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.analysis) {
            fullAnalysis = {
              ...data.analysis,
              period,
              periodComparison,
              trustScore: calculatedTrustScore
            };
          }
        } else {
          console.warn('[NEXUS AI] Server API status:', response.status);
        }
      } catch (netErr: any) {
        console.warn('[NEXUS AI] Network or serverless connection issue:', netErr?.message || netErr);
      }

      // If server AI was unreachable (e.g. serverless cold start, deployment in-progress),
      // seamlessly engage the transparent deterministic analysis so user is NEVER blocked
      if (!fullAnalysis) {
        const fallback = generateDeterministicAnalysis({
          records,
          metrics: activeMetrics,
          profile: {
            occupation: profile?.occupation || 'Freelancer',
            monthlyIncomeRange: profile?.monthlyIncomeRange
          },
          trustScore: calculatedTrustScore,
          period,
          periodComparison
        });

        fullAnalysis = {
          ...fallback,
          modelUsed: 'NEXUS Verified Engine (Deterministic Fallback)'
        };
      }

      setAnalysis(fullAnalysis);

      // If user is logged into real Supabase, store analysis in DB
      if (isSupabaseConfigured && user && fullAnalysis) {
        await supabase.from('financial_analyses').insert({
          user_id: user.id,
          total_income: activeMetrics.totalIncome,
          total_expenses: activeMetrics.totalExpenses,
          net_remaining: activeMetrics.netRemaining,
          income_consistency_score: activeMetrics.incomeConsistencyScore,
          savings_rate: activeMetrics.savingsRate,
          metrics_json: { ...activeMetrics, trustScore: calculatedTrustScore, period, periodComparison },
          ai_summary: fullAnalysis.summary,
          positive_indicators: fullAnalysis.positiveIndicators,
          areas_for_attention: fullAnalysis.areasForAttention,
          actionable_suggestions: fullAnalysis.actionableSuggestions,
          missing_information: fullAnalysis.missingInformation,
          model_used: fullAnalysis.modelUsed
        });
      }

      return fullAnalysis;
    } catch (err: any) {
      console.error('[NEXUS AI] Unexpected analysis error:', err);
      const fallback = generateDeterministicAnalysis({
        records,
        metrics: activeMetrics,
        profile: {
          occupation: profile?.occupation || 'Freelancer',
          monthlyIncomeRange: profile?.monthlyIncomeRange
        },
        trustScore: calculatedTrustScore,
        period,
        periodComparison
      });
      setAnalysis(fallback);
      return fallback;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const askFollowUpQuestion = async (question: string, period: AnalysisPeriod = 'all_time'): Promise<string | null> => {
    try {
      const response = await fetch('/api/ask-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          records,
          period,
          profile: {
            fullName: profile?.fullName || 'Nexus User',
            occupation: profile?.occupation || 'Freelancer',
            monthlyIncomeRange: profile?.monthlyIncomeRange
          }
        })
      });

      if (!response.ok) {
        throw new Error('Follow-up request failed');
      }

      const data = await response.json();
      return data.answer || null;
    } catch (err) {
      // Deterministic client fallback if network / backend is unavailable
      const top = metrics.topExpenseCategories[0];
      const q = question.toLowerCase();
      if (q.includes('where am i spending') || q.includes('spending the most')) {
        return top
          ? `You are spending the most on ${top.category}, which accounts for ${top.percentage}% of your expenses. Reviewing non-essential purchases in this area will quickly build your monthly breathing room.`
          : 'You have not added enough expense records yet to identify spending hotspots.';
      }
      if (q.includes('manage') || q.includes('better')) {
        return `Your expenses currently absorb ${metrics.expenseToIncomeRatio}% of your earnings. Setting aside 10% to 15% immediately upon receiving income will build your emergency cushion without affecting necessities.`;
      }
      if (q.includes('missing')) {
        return metrics.dataSufficiency.missingAreas.length > 0
          ? `To make your financial story fully convincing, focus on adding: ${metrics.dataSufficiency.missingAreas.join('; ')}.`
          : 'Your baseline records are complete. Adding utility bills or rent receipts to your document vault provides additional third-party proof.';
      }
      if (q.includes('passport')) {
        return 'Build a more complete Financial Trust Passport by recording at least 3 months of steady income and logging on-time utility bills or rent receipts before generating your share link.';
      }
      if (q.includes('score')) {
        return `Your Financial Trust Score is ${trustScore.score}/100. It updates deterministically whenever you log new earnings, repayments, or savings. Logging scheduled bill payments unlocks additional points.`;
      }
      return `Your records demonstrate ${metrics.monthsTracked} month(s) of activity with ${metrics.savingsRate}% cash retention rate. Regular entries keep your profile verifiable.`;
    }
  };

  const generatePassport = async (): Promise<FinancialPassport | null> => {
    setIsGeneratingPassport(true);
    setError(null);

    try {
      // 1. Ensure up-to-date analysis
      let currentAnalysis = analysis;
      if (!currentAnalysis) {
        currentAnalysis = await runAIAnalysis();
      }

      if (!currentAnalysis) {
        throw new Error('Please complete the AI analysis step first.');
      }

      // Determine clear human-readable labels
      let stabilityLabel = 'Consistent & Active';
      if (metrics.incomeConsistencyScore >= 85) {
        stabilityLabel = 'High Consistency & Predictable Flow';
      } else if (metrics.incomeConsistencyScore >= 70) {
        stabilityLabel = 'Moderate Regularity';
      } else {
        stabilityLabel = 'Variable Earnings Pattern';
      }

      let repaymentLabel = 'No Recorded History';
      if (metrics.repaymentsCount >= 3) {
        repaymentLabel = `${metrics.repaymentsCount} On-Time Payments Tracked (No Delays)`;
      } else if (metrics.repaymentsCount >= 1) {
        repaymentLabel = `${metrics.repaymentsCount} Repayment Recorded`;
      }

      let savingsLabel = 'Building Cushion';
      if (metrics.savingsRate >= 25) {
        savingsLabel = `Strong Saver (~${metrics.savingsRate}% Retained)`;
      } else if (metrics.savingsRate >= 10) {
        savingsLabel = `Moderate Saver (~${metrics.savingsRate}% Retained)`;
      }

      const completeness = Math.min(
        100,
        (profile?.onboardingCompleted ? 20 : 10) +
          (records.length >= 5 ? 30 : records.length * 5) +
          (metrics.monthsTracked >= 3 ? 20 : metrics.monthsTracked * 6) +
          (metrics.repaymentsCount > 0 ? 15 : 0) +
          (documents.length > 0 ? 15 : 0)
      );

      const newPassport: FinancialPassport = {
        id: isDemoMode ? `demo-passport-${Date.now()}` : generateSafeUUID(),
        userId: user?.id || (isDemoMode ? currentDemoPersona?.profile.id : 'nexus_local_user') || 'demo-user',
        userName: profile?.fullName || 'Nexus Member',
        occupation: profile?.occupation || 'Freelancer',
        version: passport ? passport.version + 1 : 1,
        status: 'Active',
        passportHeadline: `Verified Financial Identity — ${profile?.occupation || 'Freelancer'} (${stabilityLabel})`,
        incomeStabilityLabel: stabilityLabel,
        repaymentDisciplineLabel: repaymentLabel,
        savingsHabitLabel: savingsLabel,
        profileCompleteness: completeness,
        lastAnalysisDate: new Date().toISOString(),
        metrics,
        trustScore,
        aiInsights: {
          summary: currentAnalysis.summary,
          positiveIndicators: currentAnalysis.positiveIndicators,
          expenseBreakdownInsight: currentAnalysis.expenseBreakdownInsight,
          areasForAttention: currentAnalysis.areasForAttention,
          actionableSuggestions: currentAnalysis.actionableSuggestions,
          trustScoreExplanation: currentAnalysis.trustScoreExplanation,
          missingInformation: currentAnalysis.missingInformation,
          modelUsed: currentAnalysis.modelUsed
        },
        supportingDocsSummary: {
          totalUploaded: documents.length,
          types: Array.from(new Set(documents.map((d) => d.documentType)))
        },
        disclaimer:
          'NEXUS is an alternative financial clarity and demonstration platform. It is not a licensed credit bureau and does not guarantee loan approval.',
        createdAt: passport?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (isDemoMode) {
        setPassport(newPassport);
        if (currentDemoPersona) {
          const shortKey = currentDemoPersona.id.replace('demo-', '').split('-')[0];
          localStorage.setItem(`nexus_demo_passport_${currentDemoPersona.id}`, JSON.stringify(newPassport));
          localStorage.setItem(`nexus_demo_passport_${shortKey}`, JSON.stringify(newPassport));
        }
        return newPassport;
      }

      const passCacheKey = `nexus_user_passport_${user?.id || 'nexus_local_user'}`;
      localStorage.setItem(passCacheKey, JSON.stringify(newPassport));

      if (isSupabaseConfigured && user) {
        try {
          const { error: passErr } = await supabase.from('financial_passports').insert({
            id: newPassport.id,
            user_id: user.id,
            status: newPassport.status,
            headline: newPassport.passportHeadline,
            income_stability_label: newPassport.incomeStabilityLabel,
            repayment_discipline_label: newPassport.repaymentDisciplineLabel,
            savings_habit_label: newPassport.savingsHabitLabel,
            passport_data: {
              profileCompleteness: newPassport.profileCompleteness,
              metrics: newPassport.metrics,
              trustScore,
              aiInsights: newPassport.aiInsights,
              supportingDocsSummary: newPassport.supportingDocsSummary
            },
            version: newPassport.version
          });

          if (passErr) {
            console.warn('[NEXUS Passport] Supabase passport insert notice:', passErr.message);
          }
        } catch (dbErr: any) {
          console.warn('[NEXUS Passport] Supabase passport insert exception:', dbErr?.message);
        }
      }

      setPassport(newPassport);
      return newPassport;
    } catch (err: any) {
      setError(err.message || 'Failed to generate passport.');
      return null;
    } finally {
      setIsGeneratingPassport(false);
    }
  };

  const createShareLink = async (options: {
    recipientLabel: string;
    includedFields: ('summary' | 'income_consistency' | 'expense_breakdown' | 'repayments' | 'actionable_suggestions' | 'trust_score')[];
    expiresInHours: number;
  }): Promise<{ shareUrl: string; shareToken: string; expiresAt: string } | null> => {
    setIsSharingPassport(true);
    setError(null);

    try {
      if (!passport) {
        throw new Error('Please generate your Financial Trust Passport before creating a share link.');
      }

      const res = await fetch('/api/passport/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passport,
          recipientLabel: options.recipientLabel,
          includedFields: options.includedFields,
          expiresInHours: options.expiresInHours
        })
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.message || 'Failed to generate share link.');
      }

      const data = await res.json();

      const newLink: PassportShareLink = {
        id: data.shareId,
        passportId: passport.id,
        shareToken: data.shareToken,
        recipientLabel: options.recipientLabel,
        includedFields: options.includedFields,
        expiresAt: data.expiresAt,
        isRevoked: false,
        accessCount: 0,
        createdAt: new Date().toISOString()
      };

      setShareLinks((prev) => [newLink, ...prev]);

      return {
        shareUrl: `${window.location.origin}/passport/shared/${data.shareToken}`,
        shareToken: data.shareToken,
        expiresAt: data.expiresAt
      };
    } catch (err: any) {
      setError(err.message || 'Error generating share link.');
      return null;
    } finally {
      setIsSharingPassport(false);
    }
  };

  const revokeShareLink = async (shareId: string, shareToken?: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/passport/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareId, shareToken })
      });

      if (!res.ok) {
        throw new Error('Failed to revoke share link.');
      }

      setShareLinks((prev) =>
        prev.map((l) =>
          l.id === shareId
            ? { ...l, isRevoked: true, revokedAt: new Date().toISOString() }
            : l
        )
      );

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to revoke link.');
      return false;
    }
  };

  const uploadDocument = async (
    file: File,
    documentType: SupportingDocument['documentType'],
    notes?: string
  ): Promise<boolean> => {
    try {
      const docId = isDemoMode ? `demo-doc-${Date.now()}` : generateSafeUUID();
      const currentUserId = user?.id || (isDemoMode ? currentDemoPersona?.profile.id : 'nexus_local_user') || 'demo-user';

      const docRecord: SupportingDocument = {
        id: docId,
        userId: currentUserId,
        fileName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type || 'application/pdf',
        documentType,
        status: 'Uploaded',
        notes: notes || '',
        uploadedAt: new Date().toISOString()
      };

      if (isDemoMode) {
        setDocuments((prev) => [docRecord, ...prev]);
        return true;
      }

      if (isSupabaseConfigured && user) {
        try {
          // Upload to private Supabase Storage bucket
          const storagePath = `${user.id}/${docId}_${file.name}`;
          const { error: uploadErr } = await supabase.storage
            .from('financial-documents')
            .upload(storagePath, file);

          if (uploadErr) {
            console.warn('[NEXUS Storage] Upload notice:', uploadErr.message);
          }

          // Insert metadata record
          const { error: insErr } = await supabase.from('supporting_documents').insert({
            id: docId,
            user_id: user.id,
            file_name: file.name,
            file_path: storagePath,
            file_size_bytes: file.size,
            mime_type: file.type || 'application/pdf',
            document_type: documentType,
            status: 'Uploaded',
            notes: notes || ''
          });

          if (insErr) {
            console.warn('[NEXUS Storage] Supporting docs insert notice:', insErr.message);
          }
        } catch (dbErr: any) {
          console.warn('[NEXUS Storage] Supabase exception:', dbErr?.message);
        }
      }

      setDocuments((prev) => [docRecord, ...prev]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Document upload failed.');
      return false;
    }
  };

  const deleteDocument = async (id: string): Promise<boolean> => {
    try {
      if (isDemoMode) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        return true;
      }

      if (isSupabaseConfigured && user) {
        await supabase.from('supporting_documents').delete().eq('id', id);
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        return true;
      }

      setDocuments((prev) => prev.filter((d) => d.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete document.');
      return false;
    }
  };

  const grantConsent = (type: 'financialAnalysis' | 'passportSharing' | 'dataStorage') => {
    setConsents((prev) => ({ ...prev, [type]: true }));
  };

  return (
    <FinancialContext.Provider
      value={{
        records,
        metrics,
        trustScore,
        analysis,
        passport,
        shareLinks,
        documents,
        consents,
        isAnalyzing,
        isGeneratingPassport,
        isSharingPassport,
        error,
        clearError,
        addRecord,
        updateRecord,
        deleteRecord,
        runAIAnalysis,
        askFollowUpQuestion,
        generatePassport,
        createShareLink,
        revokeShareLink,
        uploadDocument,
        deleteDocument,
        grantConsent
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
};
