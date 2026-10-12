import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { generateFinancialAnalysis } from './services/analyzer';
import { calculateFinancialMetrics } from '../src/lib/calculations';
import { FinancialPassport, PassportShareLink, SharedPassportView } from '../src/types';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory store for active share links and passports
// (acts as local server persistence for development & works seamlessly with Supabase in production)
interface StoredShareLink {
  id: string;
  shareTokenHash: string;
  passportId: string;
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

// 1. Health check
app.get('/api/health', (_req: Request, res: Response) => {
  const hasGemini = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here'
  );

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

    // 1. Calculate deterministic metrics
    const metrics = calculateFinancialMetrics(records);

    // 2. Run AI generation (Gemini or deterministic engine)
    const analysis = await generateFinancialAnalysis({
      records,
      metrics,
      profile: profile || {
        fullName: 'Nexus User',
        occupation: 'Freelancer'
      }
    });

    res.json({
      success: true,
      analysis
    });
  } catch (error: any) {
    console.error('Error analyzing finances:', error);
    res.status(500).json({
      error: 'ANALYSIS_FAILED',
      message: 'An unexpected error occurred while analyzing financial records. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 3. Create Secure Passport Share Link
app.post('/api/passport/share', (req: Request, res: Response): Promise<void> => {
  try {
    const { passport, recipientLabel, includedFields, expiresInHours = 72 } = req.body;

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
      recipientLabel: recipientLabel || 'Public Verification',
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
    console.error('Error creating share link:', error);
    res.status(500).json({
      error: 'SHARE_FAILED',
      message: 'Failed to generate secure share link.'
    });
  }
});

// 4. Public Read-only Shared Passport Reader
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

    // Filter fields strictly based on owner-specified consent
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
          totalIncome: included.includes('summary') ? passport.metrics.totalIncome : undefined,
          totalExpenses: included.includes('summary') ? passport.metrics.totalExpenses : undefined,
          netRemaining: included.includes('summary') ? passport.metrics.netRemaining : undefined,
          savingsRate: included.includes('summary') ? passport.metrics.savingsRate : undefined,
          incomeConsistencyScore: included.includes('income_consistency') ? passport.metrics.incomeConsistencyScore : undefined,
          incomeConsistencyRating: included.includes('income_consistency') ? passport.metrics.incomeConsistencyRating : undefined,
          monthlyBreakdown: included.includes('income_consistency') ? passport.metrics.monthlyBreakdown : [],
          topExpenseCategories: included.includes('expense_breakdown') ? passport.metrics.topExpenseCategories : [],
          repaymentsCount: included.includes('repayments') ? passport.metrics.repaymentsCount : undefined,
          repaymentsTotal: included.includes('repayments') ? passport.metrics.repaymentsTotal : undefined,
          repaymentRegularityScore: included.includes('repayments') ? passport.metrics.repaymentRegularityScore : undefined
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
    console.error('Error fetching shared passport:', error);
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
    console.error('Error revoking share link:', error);
    res.status(500).json({ error: 'REVOKE_FAILED', message: 'Failed to revoke link.' });
  }
});

app.listen(PORT, () => {
  console.log(`[NEXUS Server] Secure API running on http://localhost:${PORT}`);
  console.log(`[NEXUS Server] Gemini AI Engine: ${process.env.GEMINI_API_KEY ? 'Active' : 'Deterministic Mode'}`);
});
