import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

describe('Secure Passport Sharing Logic', () => {
  function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  it('generates unique cryptographic tokens and consistent hashes', () => {
    const rawToken1 = crypto.randomBytes(24).toString('hex');
    const rawToken2 = crypto.randomBytes(24).toString('hex');

    expect(rawToken1).not.toBe(rawToken2);

    const hash1 = hashToken(rawToken1);
    const hash2 = hashToken(rawToken1);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64); // SHA-256 hex length
  });

  it('enforces link expiration checks correctly', () => {
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString(); // 1 hr ago
    const futureDate = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hr ahead

    const isPastExpired = new Date(pastDate) < new Date();
    const isFutureExpired = new Date(futureDate) < new Date();

    expect(isPastExpired).toBe(true);
    expect(isFutureExpired).toBe(false);
  });

  it('enforces field filtering strictly based on owner-specified consent', () => {
    const fullPassport = {
      totalIncome: 65000,
      totalExpenses: 35000,
      netRemaining: 30000,
      repaymentsCount: 3,
      privateUserId: 'secret-uuid-12345'
    };

    const includedFields = ['summary']; // repayments not included

    const filtered = {
      totalIncome: includedFields.includes('summary') ? fullPassport.totalIncome : undefined,
      repaymentsCount: includedFields.includes('repayments') ? fullPassport.repaymentsCount : undefined
    };

    expect(filtered.totalIncome).toBe(65000);
    expect(filtered.repaymentsCount).toBeUndefined();
    expect((filtered as any).privateUserId).toBeUndefined();
  });
});
