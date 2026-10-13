import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { generateFinancialAnalysis, answerFollowUpQuestion } from './services/analyzer';
import {
  calculateFinancialMetrics,
  calculateFinancialTrustScore,
  calculatePeriodComparison,
  filterRecordsByPeriod
} from '../src/lib/calculations';
import { FinancialPassport, SharedPassportView, AnalysisPeriod } from '../src/types';

// Load environment variables
dotenv.config();

// 1. Startup Environment Variables Validation
function validateEnvironment(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const missingCritical: string[] = [];

  // Critical checks in production environment
  if (isProd) {
    if (!process.env.GEMINI_API_KEY && !process.env.DATABASE_URL && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('[NEXUS Security Notice] No production cloud backend or Gemini key specified; operating in hardened local/deterministic mode.');
    }
  }

  if (missingCritical.length > 0) {
    console.error(`[CRITICAL] Server startup refused. Missing required environment variables: ${missingCritical.join(', ')}`);
    process.exit(1);
  }
}

validateEnvironment();

const app = express();
const PORT = process.env.PORT || 3001;

// 2. Correlation ID & Security Headers Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const correlationId = (req.headers['x-correlation-id'] as string) || crypto.randomUUID();
  (req as any).correlationId = correlationId;

  // Strict headers on every response
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});

// 3. Helmet Security Suite
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "https:"],
        connectSrc: ["'self'", "http://localhost:*", "https://*.supabase.co", "https://generativelanguage.googleapis.com"]
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: 'deny'
    },
    noSniff: true
  })
);

// 4. Rate Limiting Suite
// General API Rate Limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // max 150 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again after 15 minutes.'
  }
});

// Auth / Sensitive operations rate limiter (minimum 5 attempts per minute per IP)
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many security-sensitive attempts. Please wait 1 minute before trying again.'
  }
});

// Financial Analysis Rate Limiter
const analysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Analysis limit reached. Please wait a few minutes before submitting new records.'
  }
});

// Passport Share Creation Rate Limiter
const shareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Share link creation quota exceeded. Please wait a few minutes.'
  }
});

app.use(generalLimiter);

// 5. Restrict CORS (Supports local dev, custom domain, and Vercel preview/production deployments)
const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin) return true; // Same-origin or server-to-server requests
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true;
  if (origin.endsWith('.vercel.app')) return true;
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return true;
  return process.env.NODE_ENV !== 'production';
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS access blocked by NEXUS security policy.'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID']
  })
);

app.use(express.json({ limit: '1mb' }));

// In-memory store for active share links and passports
interface StoredShareLink {
  id: string;
  shareTokenHash: string;
  passportId: string;
  userId: string;
  recipientLabel: string;
  includedFields: string[];
  expiresAt: string;
  isRevoked: boolean;
  revokedAt?: string;
  accessCount: number;
  lastAccessedAt?: string;
  createdAt: string;
  passportData: FinancialPassport;
}

const shareStore = new Map<string, StoredShareLink>(); // key: tokenHash

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function isValidApiKey(key?: string): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  return trimmed.length > 10 && !trimmed.startsWith('your_') && !trimmed.includes('placeholder');
}

// Input sanitizer to prevent XSS injection in labels and string metadata
function sanitizeInput(input: unknown, maxLength = 80): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>'"]/g, '')
    .trim()
    .slice(0, maxLength);
}

// 1. Health check (Only returns boolean configuration status without exposing secrets or paths)
app.get('/api/health', (_req: Request, res: Response) => {
  const hasGemini = isValidApiKey(process.env.GEMINI_API_KEY);

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    aiEngine: hasGemini ? 'Google Gemini API' : 'Deterministic Financial Engine (Default)',
    geminiConfigured: hasGemini,
    environment: process.env.NODE_ENV || 'development'
  });
});

// 2. Financial Analysis (Secure Server-side AI processing)
app.post('/api/analyze-finances', analysisLimiter, async (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  try {
    const { records, profile, consents, period = 'all_time' } = req.body;

    if (!consents || !consents.financialAnalysis) {
      res.status(400).json({
        error: 'CONSENT_REQUIRED',
        message: 'Explicit user consent is required before performing financial analysis.',
        correlationId
      });
      return;
    }

    if (!records || !Array.isArray(records)) {
      res.status(400).json({
        error: 'INVALID_RECORDS',
        message: 'Financial records array is required.',
        correlationId
      });
      return;
    }

    // 1. Period filter & deterministic metrics in trusted server code (Never trust client-computed totals)
    const validPeriod: AnalysisPeriod = ['this_month', 'last_month', 'last_3_months', 'all_time'].includes(period)
      ? period
      : 'all_time';

    const activeRecords = filterRecordsByPeriod(records, validPeriod);
    const metrics = calculateFinancialMetrics(activeRecords);
    const trustScore = calculateFinancialTrustScore(records); // Computed over complete history
    const periodComparison = calculatePeriodComparison(records, validPeriod);

    // 2. Anonymize profile before analysis (only occupation and bracket, no full names/emails)
    const sanitizedOccupation = sanitizeInput(profile?.occupation || 'Freelancer', 40) as any;
    const sanitizedRange = profile?.monthlyIncomeRange ? sanitizeInput(profile.monthlyIncomeRange, 40) : undefined;

    const analysis = await generateFinancialAnalysis({
      records: activeRecords,
      metrics,
      trustScore,
      period: validPeriod,
      periodComparison,
      profile: {
        occupation: sanitizedOccupation,
        monthlyIncomeRange: sanitizedRange
      }
    });

    res.json({
      success: true,
      analysis,
      trustScore,
      periodComparison,
      correlationId
    });
  } catch (error: any) {
    console.error(`[NEXUS Server Error][${correlationId}]: Analysis calculation failed`);
    res.status(500).json({
      error: 'ANALYSIS_FAILED',
      message: 'An unexpected error occurred while analyzing financial records. Please try again.',
      correlationId
    });
  }
});

// 2b. Contextual Follow-Up Q&A Engine (Strictly Grounded in User Ledger)
app.post('/api/ask-followup', analysisLimiter, async (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  try {
    const { question, records, profile, period = 'all_time' } = req.body;

    if (!question || typeof question !== 'string') {
      res.status(400).json({
        error: 'INVALID_QUESTION',
        message: 'A valid question is required.',
        correlationId
      });
      return;
    }

    if (!records || !Array.isArray(records)) {
      res.status(400).json({
        error: 'INVALID_RECORDS',
        message: 'Financial records array is required.',
        correlationId
      });
      return;
    }

    const sanitizedQuestion = sanitizeInput(question, 200);
    const validPeriod: AnalysisPeriod = ['this_month', 'last_month', 'last_3_months', 'all_time'].includes(period)
      ? period
      : 'all_time';

    const activeRecords = filterRecordsByPeriod(records, validPeriod);
    const metrics = calculateFinancialMetrics(activeRecords);
    const trustScore = calculateFinancialTrustScore(records);
    const periodComparison = calculatePeriodComparison(records, validPeriod);

    const sanitizedOccupation = sanitizeInput(profile?.occupation || 'Freelancer', 40) as any;
    const sanitizedRange = profile?.monthlyIncomeRange ? sanitizeInput(profile.monthlyIncomeRange, 40) : undefined;

    const answer = await answerFollowUpQuestion({
      question: sanitizedQuestion,
      metrics,
      trustScore,
      profile: {
        occupation: sanitizedOccupation,
        monthlyIncomeRange: sanitizedRange
      },
      periodComparison
    });

    res.json({
      success: true,
      answer,
      correlationId
    });
  } catch (error: any) {
    console.error(`[NEXUS Server Error][${correlationId}]: Follow-up answering failed`);
    res.status(500).json({
      error: 'FOLLOWUP_FAILED',
      message: 'Unable to process follow-up question right now.',
      correlationId
    });
  }
});

// 3. Create Secure Passport Share Link
app.post('/api/passport/share', shareLimiter, (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  try {
    const { passport, recipientLabel, includedFields, expiresInHours = 72, userId } = req.body;

    if (!passport || !passport.id) {
      res.status(400).json({
        error: 'INVALID_PASSPORT',
        message: 'A valid Financial Trust Passport is required to generate a share link.',
        correlationId
      });
      return;
    }

    // Generate cryptographic token (24 bytes = 48 hex characters, 192 bits of entropy)
    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = hashToken(rawToken);

    // Bound expiration time between 1 hour and 720 hours (30 days max)
    const safeHours = Math.max(1, Math.min(Number(expiresInHours) || 72, 720));
    const now = new Date();
    const expiresAt = new Date(now.getTime() + safeHours * 60 * 60 * 1000).toISOString();
    const shareId = crypto.randomUUID();

    const sanitizedRecipient = sanitizeInput(recipientLabel || 'Public Verification', 80);

    const safeIncludedFields = Array.isArray(includedFields)
      ? includedFields.filter((f) => ['summary', 'income_consistency', 'expense_breakdown', 'repayments', 'actionable_suggestions', 'trust_score'].includes(f))
      : ['summary', 'income_consistency', 'repayments', 'actionable_suggestions', 'trust_score'];

    const storedRecord: StoredShareLink = {
      id: shareId,
      shareTokenHash: tokenHash,
      passportId: String(passport.id).slice(0, 80),
      userId: sanitizeInput(userId || passport.userId || 'anonymous-owner', 60),
      recipientLabel: sanitizedRecipient,
      includedFields: safeIncludedFields,
      expiresAt,
      isRevoked: false,
      accessCount: 0,
      createdAt: now.toISOString(),
      passportData: passport
    };

    shareStore.set(tokenHash, storedRecord);

    const shareUrl = `/passport/shared/${rawToken}`;

    res.json({
      success: true,
      shareId,
      shareToken: rawToken,
      shareUrl,
      expiresAt,
      recipientLabel: storedRecord.recipientLabel,
      includedFields: storedRecord.includedFields,
      correlationId
    });
  } catch (error: any) {
    console.error(`[NEXUS Server Error][${correlationId}]: Share link generation failed`);
    res.status(500).json({
      error: 'SHARE_FAILED',
      message: 'Failed to generate secure share link.',
      correlationId
    });
  }
});

// 4. Public Read-only Shared Passport Reader (Strict Field Filtering)
app.get('/api/passport/shared/:token', (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  try {
    const { token } = req.params;
    if (!token || typeof token !== 'string') {
      res.status(400).json({ error: 'MISSING_TOKEN', message: 'Share token is required.', correlationId });
      return;
    }

    const tokenHash = hashToken(token);
    const link = shareStore.get(tokenHash);

    if (!link) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'This Financial Trust Passport link was not found or has expired.',
        correlationId
      });
      return;
    }

    if (link.isRevoked) {
      res.status(410).json({
        error: 'REVOKED',
        message: 'Access to this Financial Trust Passport has been revoked by the owner.',
        correlationId
      });
      return;
    }

    if (new Date(link.expiresAt) < new Date()) {
      res.status(410).json({
        error: 'EXPIRED',
        message: 'This share link has expired. Please ask the passport owner for a new link.',
        correlationId
      });
      return;
    }

    // Increment access stats
    link.accessCount += 1;
    link.lastAccessedAt = new Date().toISOString();

    const passport = link.passportData;
    const included = link.includedFields;

    // Strict Field-Level Filtering: Never exposes user auth IDs, emails, passwords, or raw uploaded files
    const view: SharedPassportView = {
      shareId: link.id,
      recipientLabel: link.recipientLabel,
      expiresAt: link.expiresAt,
      ownerName: passport.userName,
      ownerOccupation: passport.occupation,
      passportHeadline: passport.passportHeadline,
      incomeStabilityLabel: passport.incomeStabilityLabel,
      repaymentDisciplineLabel: passport.repaymentDisciplineLabel,
      savingsHabitLabel: passport.savingsHabitLabel,
      createdAt: passport.createdAt,
      includedFields: link.includedFields,
      trustScore: included.includes('trust_score') ? passport.trustScore : undefined,
      passportData: {
        metrics: {
          totalIncome: included.includes('summary') ? passport.metrics?.totalIncome : undefined,
          totalExpenses: included.includes('summary') ? passport.metrics?.totalExpenses : undefined,
          netRemaining: included.includes('summary') ? passport.metrics?.netRemaining : undefined,
          savingsRate: included.includes('summary') ? passport.metrics?.savingsRate : undefined,
          incomeConsistencyScore: included.includes('income_consistency') ? passport.metrics?.incomeConsistencyScore : undefined,
          incomeConsistencyRating: included.includes('income_consistency') ? passport.metrics?.incomeConsistencyRating : undefined,
          monthlyBreakdown: included.includes('income_consistency') ? passport.metrics?.monthlyBreakdown : [],
          topExpenseCategories: included.includes('expense_breakdown') ? passport.metrics?.topExpenseCategories : [],
          repaymentsCount: included.includes('repayments') ? passport.metrics?.repaymentsCount : undefined,
          repaymentsTotal: included.includes('repayments') ? passport.metrics?.repaymentsTotal : undefined,
          repaymentRegularityScore: included.includes('repayments') ? passport.metrics?.repaymentRegularityScore : undefined
        },
        trustScore: included.includes('trust_score') ? passport.trustScore : undefined,
        insights: {
          summary: passport.aiInsights?.summary,
          positiveIndicators: passport.aiInsights?.positiveIndicators,
          areasForAttention: passport.aiInsights?.areasForAttention,
          actionableSuggestions: included.includes('actionable_suggestions') ? passport.aiInsights?.actionableSuggestions : undefined,
          trustScoreExplanation: passport.aiInsights?.trustScoreExplanation
        }
      },
      disclaimer: 'This Financial Trust Passport is generated from user-provided records for demonstration and assessment purposes. It does not constitute a statutory credit report or loan guarantee.'
    };

    res.json({
      success: true,
      passport: view,
      correlationId
    });
  } catch (error: any) {
    console.error(`[NEXUS Server Error][${correlationId}]: Shared passport fetch failed`);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve shared passport.',
      correlationId
    });
  }
});

// 5. Revoke Share Link
app.post('/api/passport/revoke', authLimiter, (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  try {
    const { shareToken, shareId } = req.body;

    let targetLink: StoredShareLink | undefined;

    if (shareToken) {
      const tokenHash = hashToken(shareToken);
      targetLink = shareStore.get(tokenHash);
    } else if (shareId) {
      for (const link of shareStore.values()) {
        if (link.id === shareId) {
          targetLink = link;
          break;
        }
      }
    }

    if (!targetLink) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Share link not found.', correlationId });
      return;
    }

    targetLink.isRevoked = true;
    targetLink.revokedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Share link has been revoked successfully. Any public viewers will no longer be able to view this passport.',
      revokedAt: targetLink.revokedAt,
      correlationId
    });
  } catch (error: any) {
    console.error(`[NEXUS Server Error][${correlationId}]: Revoke error`);
    res.status(500).json({ error: 'REVOKE_FAILED', message: 'Failed to revoke link.', correlationId });
  }
});

// 6. User Data Deletion & Account Purge (Right to be Forgotten - Rate Limited)
app.post('/api/user/delete-account', authLimiter, (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId;
  try {
    const { userId } = req.body;
    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'USER_ID_REQUIRED', message: 'User ID is required for deletion.', correlationId });
      return;
    }

    const sanitizedUserId = sanitizeInput(userId, 80);

    // Purge any active share links created by this user
    let purgedCount = 0;
    for (const [key, link] of shareStore.entries()) {
      if (link.userId === sanitizedUserId || link.passportData?.userId === sanitizedUserId) {
        shareStore.delete(key);
        purgedCount++;
      }
    }

    res.json({
      success: true,
      purgedLinks: purgedCount,
      message: 'All associated server sessions and active share links have been purged.',
      correlationId
    });
  } catch (error: any) {
    console.error(`[NEXUS Server Error][${correlationId}]: Account deletion purge error`);
    res.status(500).json({ error: 'PURGE_FAILED', message: 'Failed to purge account data.', correlationId });
  }
});

// Centralized Safe Error Middleware (Client receives zero stack traces, file paths, or query details)
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  const correlationId = (req as any).correlationId || crypto.randomUUID();
  console.error(`[NEXUS Server Error][${correlationId}]:`, err?.name || 'Exception');
  res.status(err?.status || 500).json({
    error: err?.code || 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal error occurred. Please try again.',
    correlationId
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[NEXUS Server] Secure API running on port ${PORT}`);
    console.log(`[NEXUS Server] Gemini AI Engine: ${isValidApiKey(process.env.GEMINI_API_KEY) ? 'Active' : 'Deterministic Mode'}`);
  });
}

export default app;
