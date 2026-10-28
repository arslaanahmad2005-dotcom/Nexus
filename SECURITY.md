# Security Policy

At NEXUS, we take the security and privacy of financial information seriously. This policy outlines our security practices, responsible disclosure process, and guidelines for protecting user records.

---

## Supported Versions

We actively maintain and provide security updates for the current major branch:

| Version | Supported          |
| ------- | ------------------ |
| `main`  | :white_check_mark: |

---

## Reporting a Vulnerability

If you discover a security vulnerability within NEXUS, please report it responsibly. **Do not create public GitHub issues for sensitive security vulnerabilities.**

### How to Report
1. Email your finding to: **security@nexus-network.org** (or contact repository maintainers privately via GitHub Security Advisories).
2. Include the following details:
   - Type of vulnerability (e.g. prompt injection, unauthorized data access, RLS bypass, CORS misconfiguration).
   - Step-by-step reproduction instructions or a minimal proof-of-concept.
   - Potential impact on user privacy or system availability.
   - Any proposed remediation or patch.

### Response Timeline
- **Initial acknowledgment:** Within 48 hours.
- **Triage & severity assessment:** Within 5 business days.
- **Resolution & patch deployment:** Dependent on complexity, typically within 14 business days.

---

## Core Security Controls in NEXUS

1. **Server-Side API Key Retention**:
   - `GEMINI_API_KEY` and backend secrets are never prefixed with `VITE_` and never included in frontend client bundles.
   - Model inference is mediated exclusively via authenticated server endpoints (`/api/copilot/*`).

2. **Zero Financial PII in AI Prompts**:
   - Names, phone numbers, email addresses, and account numbers are stripped before payloads are sent to external AI endpoints.
   - Gemma receives only anonymized, aggregated totals (income, expenses, ratio percentages, occupation).

3. **Grounded Deterministic Engine**:
   - Numerical scores and metrics are calculated mathematically using deterministic functions in `src/lib/calculations.ts`.
   - The generative AI model is strictly prohibited from fabricating or altering financial trust scores.

4. **Cryptographic Share Links**:
   - Shared passport access tokens are hashed on the server using SHA-256 (`crypto.createHash('sha256')`).
   - All shared links enforce time-bound expiration (1 to 720 hours) and instant owner revocation.

5. **Defense-in-Depth HTTP Security**:
   - Helmet suite with strict Content Security Policy (CSP), HTTP Strict Transport Security (HSTS), and X-Frame-Options `DENY`.
   - Rate limiting across all API endpoints with strict quotas on financial analysis and share link generation.
