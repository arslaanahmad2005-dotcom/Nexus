import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'http';

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class MockGoogleGenAI {
      models = {
        generateContent: vi.fn().mockImplementation(async ({ contents }: { contents: string }) => {
          if (contents.includes('financial_strengths')) {
            return {
              text: JSON.stringify({
                summary: 'Your financial profile demonstrates disciplined earning and expenses.',
                financial_strengths: ['Consistent income record', 'Active savings buffer'],
                financial_risks: ['Moderate expense concentration in living costs'],
                improvement_recommendations: ['Build emergency reserve', 'Log on-time bills'],
                suggested_actions: ['Track daily expenses', 'Upload rent receipts'],
                confidence_limitations: ['Educational guidance only']
              })
            };
          }
          if (contents.includes('Week 1: Financial Awareness')) {
            return {
              text: JSON.stringify({
                title: '30-Day Financial Health Roadmap',
                overallGoal: 'Strengthen financial discipline and cushion',
                weeks: [
                  {
                    weekNumber: 1,
                    theme: 'Financial Awareness',
                    objective: 'Track expenses',
                    tasks: [{ id: 'w1-t1', title: 'Daily logging', description: 'Log spending', completed: false }],
                    recommendations: ['Review purchases daily']
                  },
                  {
                    weekNumber: 2,
                    theme: 'Expense Management',
                    objective: 'Reduce leaks',
                    tasks: [{ id: 'w2-t1', title: 'Set budget cap', description: 'Cap dining out', completed: false }],
                    recommendations: ['Automate savings']
                  },
                  {
                    weekNumber: 3,
                    theme: 'Financial Stability',
                    objective: 'Build cushion',
                    tasks: [{ id: 'w3-t1', title: 'Bill check', description: 'Pay utility bills', completed: false }],
                    recommendations: ['Pay on time']
                  },
                  {
                    weekNumber: 4,
                    theme: 'Financial Improvement Review',
                    objective: 'Evaluate progress',
                    tasks: [{ id: 'w4-t1', title: 'Review progress', description: 'Compare metrics', completed: false }],
                    recommendations: ['Update passport']
                  }
                ]
              })
            };
          }
          return { text: 'Based on your records, you are managing your money well.' };
        })
      };
    }
  };
});

import app from '../server/index';

describe('Gemma 4 Copilot API Endpoints', () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    await new Promise<void>((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://localhost:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      if (server && server.closeAllConnections) {
        server.closeAllConnections();
      }
      server.close(() => resolve());
    });
  });

  it('GET /api/health returns Gemma 4 model details and open-weight status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('healthy');
    expect(data.model).toBeDefined();
    expect(data.isOpenWeight).toBe(true);
  });

  it('POST /api/copilot/chat rejects requests without message', async () => {
    const res = await fetch(`${baseUrl}/api/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('INVALID_MESSAGE');
  });

  it('POST /api/copilot/chat responds successfully with message and records', async () => {
    const res = await fetch(`${baseUrl}/api/copilot/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'How can I improve my savings rate?',
        records: [
          {
            id: '1',
            userId: 'u1',
            recordType: 'Income',
            amount: 50000,
            recordDate: '2026-10-01',
            category: 'Salary',
            description: '',
            isRecurring: true,
            createdAt: '',
            updatedAt: ''
          }
        ],
        profile: { occupation: 'Salaried' }
      })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.reply).toBeDefined();
    expect(data.modelInformation).toBeDefined();
    expect(data.modelInformation.model_name).toContain('gemma-4');
  });

  it('POST /api/copilot/explain-profile rejects requests without consent', async () => {
    const res = await fetch(`${baseUrl}/api/copilot/explain-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [],
        consents: { financialAnalysis: false }
      })
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('CONSENT_REQUIRED');
  });

  it('POST /api/copilot/explain-profile returns structured explanation with consent', async () => {
    const res = await fetch(`${baseUrl}/api/copilot/explain-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [
          {
            id: '1',
            userId: 'u1',
            recordType: 'Income',
            amount: 75000,
            recordDate: '2026-10-01',
            category: 'Freelance Work',
            description: 'UI Design',
            isRecurring: false,
            createdAt: '',
            updatedAt: ''
          }
        ],
        profile: { occupation: 'Freelancer' },
        consents: { financialAnalysis: true }
      })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.explanation).toBeDefined();
    expect(data.explanation.summary).toBeDefined();
    expect(Array.isArray(data.explanation.financial_strengths)).toBe(true);
  });

  it('POST /api/copilot/improvement-plan generates 4-week roadmap with consent', async () => {
    const res = await fetch(`${baseUrl}/api/copilot/improvement-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        records: [],
        profile: { occupation: 'Student' },
        consents: { financialAnalysis: true }
      })
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.plan).toBeDefined();
    expect(data.plan.weeks).toHaveLength(4);
  });
});
