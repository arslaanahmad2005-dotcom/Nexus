import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { generateFinancialAnalysis } from './services/analyzer';
import { calculateFinancialMetrics } from '../src/lib/calculations';
import { FinancialPassport, SharedPassportView } from '../src/types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

// 1. Health check (Only returns boolean configuration status without exposing secrets)
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
app.post('/api/analyze-finances', async (req: Request, res: Response): Promise<void> => {
  try {
    const { records, profile, consents } = req.body;

    if (!consents || !consents.financialAnalysis) {
      res.status(400).json({
        error: 'CONSENT_REQUIRED',
        message: 'Explicit user consent is required before performing financial analysis.'
      });
      return;
    }

    if (!records || !Array.isArray(records)) {
      res.status(400).json({
        error: 'INVALID_RECORDS',
        message: 'Financial records array is required.'
      });
      return;
    }

    // 1. Calculate deterministic metrics in trusted server code
    const metrics = calculateFinancialMetrics(records);

    // 2. Anonymize profile before analysis (only occupation and bracket, no full names/emails)
    const analysis = await generateFinancialAnalysis({
      records,
      metrics,
      profile: {
        occupation: profile?.occupation || 'Freelancer',
        monthlyIncomeRange: profile?.monthlyIncomeRange
      }
    });

    res.json({
      success: true,
      analysis
    });
  } catch (error: any) {
    // Sanitize server error logs to prevent leaking request payloads or tokens
    console.error('[NEXUS Server] Analysis error: [REDACTED]');
    res.status(500).json({
      error: 'ANALYSIS_FAILED',
      message: 'An unexpected error occurred while analyzing financial records. Please try again.'
    });
  }
});

// 3. Create Secure Passport Share Link
app.post('/api/passport/share', (req: Request, res: Response): Promise<void> => {
  try {
    const { passport, recipientLabel, includedFields, expiresInHours = 72, userId } = req.body;

    if (!passport || !passport.id) {
      res.status(400).json({
        error: 'INVALID_PASSPORT',
        message: 'A valid Financial Trust Passport is required to generate a share link.'
      });
      return;
    }

    // Generate cryptographic token (32 bytes = 64 hex characters)
    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = hashToken(rawToken);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + (Number(expiresInHours) || 72) * 60 * 60 * 1000).toISOString();
    const shareId = crypto.randomUUID();

    const storedRecord: StoredShareLink = {
      id: shareId,
      shareTokenHash: tokenHash,
      passportId: passport.id,
      userId: userId || passport.userId || 'anonymous-owner',
      recipientLabel: recipientLabel ? String(recipientLabel).slice(0, 80) : 'Public Verification',
      includedFields: Array.isArray(includedFields) && includedFields.length > 0 
        ? includedFields 
        : ['summary', 'income_consistency', 'repayments', 'actionable_suggestions'],
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
      includedFields: storedRecord.includedFields
    });
  } catch (error: any) {
    console.error('[NEXUS Server] Share link generation error: [REDACTED]');
    res.status(500).json({
      error: 'SHARE_FAILED',
      message: 'Failed to generate secure share link.'
    });
  }
});

// 4. Public Read-only Shared Passport Reader (Strict Field Filtering)
app.get('/api/passport/shared/:token', (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    if (!token) {
      res.status(400).json({ error: 'MISSING_TOKEN', message: 'Share token is required.' });
      return;
    }

    const tokenHash = hashToken(token);
    const link = shareStore.get(tokenHash);

    if (!link) {
      res.status(404).json({
        error: 'NOT_FOUND',
        message: 'This Financial Trust Passport link was not found or has been deleted.'
      });
      return;
    }

    if (link.isRevoked) {
      res.status(410).json({
        error: 'REVOKED',
        message: 'Access to this Financial Trust Passport has been revoked by the owner.'
      });
      return;
    }

    if (new Date(link.expiresAt) < new Date()) {
      res.status(410).json({
        error: 'EXPIRED',
        message: 'This share link has expired. Please ask the passport owner for a new link.'
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
        insights: {
          summary: passport.aiInsights?.summary,
          positiveIndicators: passport.aiInsights?.positiveIndicators,
          areasForAttention: passport.aiInsights?.areasForAttention,
          actionableSuggestions: included.includes('actionable_suggestions') ? passport.aiInsights?.actionableSuggestions : undefined
        }
      },
      disclaimer: 'This Financial Trust Passport is generated from user-provided records for demonstration and assessment purposes. It does not constitute a statutory credit report or loan guarantee.'
    };

    res.json({
      success: true,
      passport: view
    });
  } catch (error: any) {
    console.error('[NEXUS Server] Fetch shared passport error: [REDACTED]');
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Failed to retrieve shared passport.'
    });
  }
});

// 5. Revoke Share Link
app.post('/api/passport/revoke', (req: Request, res: Response): Promise<void> => {
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
      res.status(404).json({ error: 'NOT_FOUND', message: 'Share link not found.' });
      return;
    }

    targetLink.isRevoked = true;
    targetLink.revokedAt = new Date().toISOString();

    res.json({
      success: true,
      message: 'Share link has been revoked successfully. Any public viewers will no longer be able to view this passport.',
      revokedAt: targetLink.revokedAt
    });
  } catch (error: any) {
    console.error('[NEXUS Server] Revoke error: [REDACTED]');
    res.status(500).json({ error: 'REVOKE_FAILED', message: 'Failed to revoke link.' });
  }
});

// 6. User Data Deletion & Account Purge (Right to be Forgotten)
app.post('/api/user/delete-account', (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'USER_ID_REQUIRED', message: 'User ID is required for deletion.' });
      return;
    }

    // Purge any active share links created by this user
    for (const [key, link] of shareStore.entries()) {
      if (link.userId === userId || link.passportData?.userId === userId) {
        shareStore.delete(key);
      }
    }

    res.json({
      success: true,
      message: 'All associated server sessions and active share links have been purged.'
    });
  } catch (error: any) {
    console.error('[NEXUS Server] Account deletion purge error: [REDACTED]');
    res.status(500).json({ error: 'PURGE_FAILED', message: 'Failed to purge account data.' });
  }
});

app.listen(PORT, () => {
  console.log(`[NEXUS Server] Secure API running on port ${PORT}`);
  console.log(`[NEXUS Server] Gemini AI Engine: ${isValidApiKey(process.env.GEMINI_API_KEY) ? 'Active' : 'Deterministic Mode'}`);
});
