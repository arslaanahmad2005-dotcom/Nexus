# NEXUS — Open-Weight AI-Powered Financial Identity & Trust Network

[![License: MIT](https://img.shields.io/badge/License-MIT-teal.svg)](LICENSE)
[![AI Model: Google Gemma 4](https://img.shields.io/badge/AI%20Model-Google%20Gemma%204%20(26B)-0D9488.svg)](AI_MODEL.md)
[![Provider: Gemini API Host](https://img.shields.io/badge/Provider-Google%20Gemini%20API-0284C7.svg)](https://ai.google.dev)
[![Architecture: Open--Weight AI + Deterministic Math](https://img.shields.io/badge/Architecture-Open--Weight%20AI%20%2B%20Deterministic-emerald.svg)](#system-architecture)

> **"Your financial story deserves to be seen."**  
> NEXUS empowers students, freelancers, gig workers, and small business owners to transform everyday financial discipline into an auditable **Digital Financial Trust Passport**, powered by **Google's Gemma 4 open-weight model** via the official Gemini API.

---

## Table of Contents
- [1. Overview & Problem Statement](#1-overview--problem-statement)
- [2. The NEXUS Solution](#2-the-nexus-solution)
- [3. Key Features](#3-key-features)
- [4. AI Model Information: Google Gemma 4](#4-ai-model-information-google-gemma-4)
- [5. System Architecture](#5-system-architecture)
- [6. Technology Stack](#6-technology-stack)
- [7. Quickstart & Installation](#7-quickstart--installation)
- [8. Environment Configuration](#8-environment-configuration)
- [9. 3-Minute Hackathon Demo Mode](#9-3-minute-hackathon-demo-mode)
- [10. API Documentation](#10-api-documentation)
- [11. Privacy, Security & Disclaimers](#11-privacy-security--disclaimers)
- [12. Testing & Quality Assurance](#12-testing--quality-assurance)
- [13. Limitations & Future Roadmap](#13-limitations--future-roadmap)
- [14. Contributing & License](#14-contributing--license)

---

## 1. Overview & Problem Statement

Traditional credit rating bureaus (such as CIBIL, Experian, Equifax) rely almost exclusively on formal institutional debts—past bank loans and credit cards. Consequently, over 500 million financially responsible individuals across developing economies—including independent freelancers with steady monthly retainers, gig workers, students managing academic stipends, and artisanal small business owners—are labeled "credit invisible" or denied fair loan terms because they have no prior formal borrowing record.

---

## 2. The NEXUS Solution

NEXUS establishes an open-source, alternative financial identity protocol:
1. **Captures Everyday Cashflow Discipline:** Inflows, living costs, savings reserves, and on-time bill/rent/EMI receipts.
2. **Deterministic Calculation Guard:** All arithmetic totals, savings rate %, Debt-to-Income (DTI) ratios, and the 4-pillar Financial Trust Score (0–100) are computed mathematically by code. The AI is never permitted to hallucinate or modify numbers.
3. **Google Gemma 4 Open-Weight Intelligence:** Replaces black-box proprietary score generators with Google's open-weight Gemma 4 model (`gemma-4-26b-a4b-it`) hosted via the official Gemini API to generate personalized plain-language explanations, multilingual conversational assistance, and 30-day improvement plans.
4. **Consent-Governed Cryptographic Passports:** Users generate time-bound, revocable, field-filtered share links (`/passport/shared/:token`) that prove financial trustworthiness to landlords and lenders without exposing private transaction details or bank logins.

---

## 3. Key Features

### 🤖 1. NEXUS AI Financial Health Copilot (Chat Assistant)
- Conversational financial clarity assistant powered by Google Gemma 4 (`gemma-4-26b-a4b-it`).
- Grounded strictly in authorized ledger metrics (income, expenses, cash cushion, DTI, repayment consistency).
- **Multilingual Support:** Seamlessly toggles between English and Hindi / Hinglish.
- Suggested quick follow-up chips ("Why is my financial health score low?", "How can I improve my savings rate?", "How can I manage irregular income?").
- Session context memory, loading skeletons, and retry state handling.

### 📊 2. Explain My Financial Profile
- One-click plain-English translation of complex financial indicators.
- Analyzes monthly income, expenses, savings rate, income stability, DTI ratio, and repayment discipline.
- Displays:
  - **Overall Financial Narrative**
  - **Verified Financial Strengths**
  - **Potential Risks & Margin Flags**
  - **Actionable Strategic Next Steps**
  - **Attribution & Transparency Notice**

### 🗓️ 3. 30-Day Financial Improvement Plan
- Generates a personalized 4-week roadmap based on actual monthly cashflow:
  - **Week 1: Financial Awareness** (Audit daily spends, identify unnecessary leaks)
  - **Week 2: Expense Management** (Set category caps, automate first-day savings)
  - **Week 3: Financial Stability** (Schedule on-time bills, upload proof documents)
  - **Week 4: Improvement Review** (Compare cushion growth, refresh Financial Passport)
- Interactive task completion checkboxes with real-time progress bar.
- Client and local storage persistence.

### 🛡️ 4. Verifiable Financial Trust Passport
- Compiles verified records into an authenticated visual passport card.
- Deterministic 4-pillar Financial Trust Score:
  1. *Income Consistency (30 pts)*
  2. *Savings Habits (25 pts)*
  3. *Repayment Discipline (25 pts)*
  4. *Expense Management (20 pts)*
- Cryptographic SHA-256 tokenized sharing with field-level visibility controls and instant one-click revocation.

### 🎭 5. Hackathon Judge Demo Mode (3 Synthetic Personas)
- **Profile A: Student (Aarav Patel)** — Limited income (₹20k/mo tutoring), small savings, building first credit history.
- **Profile B: Freelancer (Priya Sharma)** — Irregular income (₹62k/mo retainer + milestones), variable expenses, 100% on-time equipment EMI.
- **Profile C: Small Business Owner (Vikram Malhotra)** — High turnover (₹1.4L/mo café), commercial lease & operating costs, active MSME equipment loan.

---

## 4. AI Model Information: Google Gemma 4

NEXUS is designed around open-source AI principles. We integrate **Google Gemma 4** open-weight models through the Gemini API:

| Component | Detail |
| :--- | :--- |
| **Model Name** | Google Gemma 4 |
| **Model Identifier** | `gemma-4-26b-a4b-it` (Preferred) |
| **Alternative Model** | `gemma-4-31b-it` / `gemini-2.5-flash` |
| **Model Type** | Open-Weight Instruction-Tuned (`-it`) |
| **API Provider** | Google Gemini API (Hosted Endpoint) |
| **SDK** | Official `@google/genai` (Node.js SDK) |
| **Execution Architecture** | Server-side only (zero browser API key exposure) |

For complete documentation on model terms, architecture separation, and safety limits, see [AI_MODEL.md](AI_MODEL.md).

---

## 5. System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   NEXUS Client (Browser)               │
│       React 19 + TypeScript + Vite + Tailwind CSS      │
│   • Dashboard        • My Money (Ledger)               │
│   • Financial Copilot • Financial Passport             │
│   • 30-Day Roadmap    • Shared Passport Reader         │
└───────────────────────────┬────────────────────────────┘
                            │ (POST /api/copilot/*)
┌───────────────────────────▼────────────────────────────┐
│                  NEXUS Express 5 Server                │
│  • Input Sanitizer & Prompt Injection Defense          │
│  • Rate Limiter (Helmet, RateLimit, nosniff, CSP)      │
│  • Correlation ID Tracking (X-Correlation-ID)          │
│  • Deterministic Financial Engine                      │
│    (Computes Totals, Savings %, DTI, Trust Score)      │
│  • Anonymization & Data Minimization Pipeline          │
└───────────────────────────┬────────────────────────────┘
                            │ (Aggregated Metrics Only)
┌───────────────────────────▼────────────────────────────┐
│            Google Gemma 4 (Gemini API Host)            │
│   Model: gemma-4-26b-a4b-it                            │
│   Role: Explanations, Conversational Q&A, Roadmaps     │
│   Fallback: Deterministic Clarity Engine               │
└────────────────────────────────────────────────────────┘
```

---

## 6. Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router v7, Recharts, Lucide Icons.
- **Backend Server:** Express 5, Node.js, `@google/genai` (Google GenAI SDK), `helmet`, `express-rate-limit`, `cors`, `dotenv`, `crypto`.
- **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS) policies.
- **Open-Weight AI:** Google Gemma 4 (`gemma-4-26b-a4b-it`) via Gemini API.
- **Testing:** Vitest automated test suite covering deterministic financial calculations, DTI, Copilot endpoints, and token hashing.

---

## 7. Quickstart & Installation

### Prerequisites
- Node.js `v18+` (v20+ or v24+ recommended)
- npm `v9+`

### 1. Clone the Repository
```bash
git clone https://github.com/arslaanahmad2005-dotcom/Nexus.git
cd Nexus
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```
Add your credentials to `.env`:
```env
PORT=3001
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
GEMMA_MODEL=gemma-4-26b-a4b-it
AI_PROVIDER=gemma
AI_REQUEST_TIMEOUT_MS=30000
```
*(Note: If `GEMINI_API_KEY` is not provided, NEXUS operates seamlessly in local deterministic mode!)*

### 4. Run Locally
```bash
npm run dev
```
- Frontend application: **`http://localhost:5173`**
- Backend API server: **`http://localhost:3001`**
- Server health check: **`http://localhost:3001/api/health`**

---

## 8. Environment Configuration

| Variable | Required | Context | Description |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Recommended | Server-only | API key from Google AI Studio to call Gemma 4. |
| `GEMMA_MODEL` | Optional | Server-only | Gemma 4 model identifier (default: `gemma-4-26b-a4b-it`). |
| `AI_PROVIDER` | Optional | Server-only | AI provider identifier (default: `gemma`). |
| `AI_REQUEST_TIMEOUT_MS` | Optional | Server-only | Timeout in ms for model requests (default: `30000`). |
| `PORT` | Optional | Server-only | Express backend port (default: `3001`). |
| `VITE_SUPABASE_URL` | Optional | Client | Supabase project URL for cloud database sync. |
| `VITE_SUPABASE_ANON_KEY` | Optional | Client | Supabase public anonymous key. |

---

## 9. 3-Minute Hackathon Demo Mode

For an exact minute-by-minute judge walkthrough, see [DEMO.md](DEMO.md).

1. Open `http://localhost:5173`.
2. In the top banner or hero bar, select a synthetic profile:
   - **Profile A (Student - Aarav Patel)**
   - **Profile B (Freelancer - Priya Sharma)**
   - **Profile C (Small Business - Vikram Malhotra)**
3. View the **AI Financial Health Copilot** on the Dashboard and ask questions in English or Hindi.
4. Explore the **30-Day Financial Improvement Plan** and toggle task checkboxes.
5. Visit **Financial Passport** (`/passport`), click **"Explain My Profile"**, and test creating a secure share link.

---

## 10. API Documentation

| Method | Endpoint | Description | Rate Limit |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health, active Gemma 4 model, open-weight status | General |
| `POST` | `/api/copilot/chat` | Contextual conversational assistance powered by Gemma 4 | 20 / 15m |
| `POST` | `/api/copilot/explain-profile` | Plain-English profile analysis (strengths, risks, actions) | 20 / 15m |
| `POST` | `/api/copilot/improvement-plan` | 4-week structured financial improvement roadmap | 20 / 15m |
| `POST` | `/api/passport/share` | Creates a cryptographic, expiring share link | 20 / 15m |
| `GET` | `/api/passport/shared/:token` | Public view of permitted passport indicators | General |
| `POST` | `/api/passport/revoke` | Instantly revokes an active passport share link | 5 / 1m |

---

## 11. Privacy, Security & Disclaimers

### Security Controls
- **Zero API Key Leakage:** Credentials remain exclusively server-side.
- **Anonymization & Minimization:** Names, emails, passwords, and account IDs are never included in AI prompts.
- **Deterministic Math:** Financial scores and metrics are calculated mathematically and cannot be hallucinated.
- **Cryptographic Share Tokens:** Token hashes are computed using SHA-256 (`crypto.createHash('sha256')`).
- **Owner Revocation & Right to be Forgotten:** Users can revoke share links or purge all server data at any second.

### Educational Disclaimer
> **NEXUS provides educational financial insights.** Its AI-generated recommendations and Financial Trust Scores are not professional financial advice, official statutory credit bureau scores (e.g., CIBIL/Experian), or legally binding loan approval decisions.

---

## 12. Testing & Quality Assurance

Run the automated test suite with Vitest:
```bash
npm test
```
Run linter:
```bash
npm run lint
```
Build the production bundle:
```bash
npm run build
```

---

## 13. Limitations & Future Roadmap

- **Current Limitations:** Multi-month trend comparisons require users to maintain records across at least 3 distinct calendar months.
- **Future Roadmap:**
  - Account Aggregator (AA) framework integration for automated verified bank statements (RBI-approved).
  - WebAssembly (Wasm) local inference support for Gemma on high-spec client devices.
  - Integration with micro-lending partners for alternative credit underwritings.

---

## 14. Contributing & License

- **Contributing:** See [CONTRIBUTING.md](CONTRIBUTING.md) for pull request, branching, and issue reporting guidelines.
- **Security:** See [SECURITY.md](SECURITY.md) for responsible disclosure procedures.
- **License:** Project source code is licensed under the [MIT License](LICENSE). Third-party Gemma 4 model weights are governed by Google's [Gemma Terms of Use](https://ai.google.dev/gemma/terms).
