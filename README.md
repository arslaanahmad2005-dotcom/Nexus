# NEXUS — AI-Powered Financial Identity & Trust Network

> **"Your financial story deserves to be seen."**  
> NEXUS empowers students, freelancers, gig workers, and first-time borrowers to prove responsible money management through an easy-to-understand **Financial Trust Passport**, even with limited or zero traditional credit history.

---

## 1. Product Vision & Problem Solved

Traditional credit bureaus (CIBIL, Experian, Equifax) rely almost exclusively on past bank loans and credit cards. Consequently, millions of financially responsible individuals in India—freelancers earning consistent client retainers, gig delivery partners, students managing stipends, and small shopkeepers—are shut out or penalized for having "no credit history".

**NEXUS bridges this gap by:**
1. Transforming everyday cashflow records (income inflows, living costs, savings, and on-time rent/bill/EMI payments) into transparent financial indicators.
2. Generating a verifiable **Digital Financial Trust Passport** using deterministic financial calculations paired with Google Gemini AI plain-language explanations.
3. Enabling **consent-controlled sharing** where users create expiring, revocable, cryptographic share links without exposing private documents, passwords, or raw database IDs.

> **Important Regulatory Disclosure:** NEXUS is an alternative assessment and financial clarity platform built for evaluation and demonstration. It does not claim to be a statutory credit rating bureau, perform KYC without an accredited partner, guarantee loan approvals, or produce official credit scores.

---

## 2. System Architecture & Tech Stack

```
┌──────────────────────────────────────────────────────────┐
│                   NEXUS Frontend Web Client              │
│       React 19 + TypeScript + Vite + Tailwind CSS        │
│       Recharts + Lucide Icons + React Hook Form + Zod    │
└────────────────────────────┬─────────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│       Secure Backend API      │ │    Supabase Cloud Backend     │
│       Express 5 + TypeScript  │ │    PostgreSQL Database + RLS  │
│   • Google Gemini 2.5 Flash   │ │    Supabase Auth (JWT/Email)  │
│   • Deterministic Engine      │ │    Storage (Documents Bucket) │
│   • Token Hashing (SHA-256)   │ │    Edge Functions (Deno)      │
└───────────────────────────────┘ └───────────────────────────────┘
```

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, React Router v7, Recharts, Lucide React.
- **Backend & AI Server:** Node.js, Express, `@google/genai` (Google Gemini API), `dotenv`, `crypto`.
- **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS) policies, triggers, and stored procedures.
- **Testing:** Vitest automated test suite covering deterministic financial calculations, AI fallback logic, and cryptographic token verification.

---

## 3. Quickstart & Local Installation

### Prerequisites
- Node.js `v18+` (v20+ or v24+ recommended)
- npm `v9+`

### Installation Steps

1. **Clone or navigate to the repository:**
   ```bash
   cd Nexus
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   *(Note: The app is designed to run seamlessly out of the box even before you enter external keys. When keys are empty, it uses the local deterministic AI engine and the Judge Demo profile!)*

4. **Start the application (Frontend + Backend API concurrently):**
   ```bash
   npm run dev
   ```

5. **Open in your browser:**
   - Web Application: [http://localhost:5173](http://localhost:5173)
   - Secure API Health Check: [http://localhost:3001/api/health](http://localhost:3001/api/health)

---

## 4. 3-Minute Judge Demonstration Walkthrough

NEXUS includes a built-in **Judge Demo Mode** pre-loaded with realistic financial profiles. Judges can evaluate the complete user journey in under 3 minutes without typing demo transactions:

1. **Open the Landing Page:** Visit [http://localhost:5173](http://localhost:5173). Notice the value proposition, 3-step workflow, and plain English comparison table.
2. **Launch Demo Mode:** Click **"Explore Demo (Instant Access)"** or select **"Priya (Freelancer, ₹62k/mo)"**.
3. **Inspect the Dashboard:**
   - View Priya Sharma's monthly income (`₹62,000`), expenses (`₹38,000`), net cash cushion (`₹24,000`), and on-time repayment records (`3`).
   - Examine the Recharts cashflow visualization showing income, expenses, and savings trajectory.
4. **Manage Financial Records ("My Money"):**
   - Click **"My Money"** in the top navigation.
   - Filter records by type (`Income`, `Expense`, `Repayment`, `Savings`) or search for transactions.
   - Click **"Add Financial Record"**, add a new entry (e.g., `₹15,000` Freelance Work), and observe dashboard totals recalculate immediately.
5. **Generate AI Clarity Analysis ("Understand My Money"):**
   - Navigate to **"Understand My Money"**.
   - Click **"Analyze My Money"** (or Refresh).
   - Review the structured feedback: plain-language summary, demonstrated disciplines, areas needing attention, and practical suggestions.
6. **Review the Financial Trust Passport:**
   - Navigate to **"Financial Passport"**.
   - Review the official authenticated passport card, income stability indicator, and audit summary.
   - Click **"Print / Save PDF"** to preview the clean document layout.
7. **Test Consent-Based Passport Sharing:**
   - Click **"Share My Passport"**.
   - Select permitted fields (e.g., include `summary` and `repayments`, exclude raw breakdown) and set an expiry period (e.g., 72 hours).
   - Click **"Generate Share Link"**.
   - Open the generated public link in a separate tab (`/passport/shared/:token`). Notice that **only** permitted fields are shown and internal user IDs remain hidden.
8. **Test Instant Revocation:**
   - Back on the Passport page, under **Active Passport Share Links**, click **"Revoke"**.
   - Refresh the public view tab: it now returns a security notice stating **"Access Revoked by Owner"**.

---

## 5. Supabase Database Schema & Setup

The complete SQL schema with Row Level Security (RLS) policies is located at:
📁 `supabase/migrations/20261012_init_nexus.sql`

### Database Tables:
1. `profiles`: User account details, occupation, monthly income bracket, location, onboarding status.
2. `user_consents`: Explicit user consents for financial analysis and data storage.
3. `financial_records`: User ledger entries (`Income`, `Expense`, `Savings`, `Repayment`) with amounts in INR, categories, and recurring flags.
4. `financial_analyses`: Historical audit log of AI analyses, metrics, and models used.
5. `financial_passports`: Compiled trust passports with stability labels, completeness score, and metadata.
6. `passport_share_links`: Cryptographic token hashes (`SHA-256`), recipient labels, permitted fields, and expiration timestamps.
7. `supporting_documents`: Metadata for user-uploaded proof files.

### Applying Migrations:
- **Via Supabase Dashboard:** Open your Supabase project -> SQL Editor -> paste `supabase/migrations/20261012_init_nexus.sql` -> Run.
- **Via Supabase CLI:**
  ```bash
  npx supabase db push
  ```

---

## 6. Google Gemini AI Integration

### How It Works
- All AI calls originate from the server-side API handler (`server/services/analyzer.ts`) or Supabase Edge Function (`supabase/functions/analyze-finances/index.ts`).
- **The Gemini API key is never exposed to the frontend browser bundle.**
- Numerical calculations (cashflow, consistency index, category percentages) are **always computed deterministically** first in trusted code. Gemini is tasked with explaining the results in accessible, jargon-free English.
- If `GEMINI_API_KEY` is not provided or API limits are reached, the system automatically uses an intelligent deterministic financial clarity engine as a graceful fallback.

### Adding your Gemini API Key
1. Get an API key from [Google AI Studio](https://aistudio.google.com).
2. Add it to your `.env` file:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
3. Restart the dev server (`npm run dev`). The server log will display:
   ```
   [NEXUS Server] Gemini AI Engine: Active
   ```

---

## 7. Security & Privacy Design Principles

- **Row Level Security (RLS):** Every PostgreSQL table enforces user-level isolation (`auth.uid() = user_id`).
- **Zero Sensitive Credential Requests:** NEXUS never asks for net-banking passwords, UPI PINs, Aadhaar numbers, or OTPs.
- **Cryptographic Share Tokens:** Share links use 256-bit random tokens (`crypto.randomBytes(24)`). Only the SHA-256 hash is stored in the database.
- **Privacy by Default:** Raw supporting documents are never linked to public share URLs unless explicitly requested.
- **Owner Revocation & Data Deletion:** The owner can revoke any share link instantly, and perform a full account purge (Right to be Forgotten) that erases all records, passports, and documents.

> [!WARNING]
> ### ⚠️ Security & Git History Notice: Rotate Any Previously Hardcoded Secrets Immediately
> If any API keys, database connection strings, or service tokens were ever committed or stored in git history or unencrypted files in the past, consider them potentially compromised. **Rotate any active keys immediately** in your cloud provider consoles:
> 1. **Google Gemini API Key:** If exposed, regenerate the key in [Google AI Studio](https://aistudio.google.com).
> 2. **Supabase Anon & Service Role Keys:** Rotate JWT secrets in your Supabase Dashboard (`Project Settings -> API`).
> 3. Ensure `.env` is strictly ignored in `.gitignore` (never commit live credentials). Only `.env.example` with blank placeholders should be committed.


---

## 8. Automated Testing

Run the test suite using Vitest:
```bash
npm run test
```

Test coverage includes:
- `tests/calculations.test.ts`: Deterministic cashflow calculations, multi-month groupings, edge cases (empty history, 0 totals), and INR formatting.
- `tests/analyzer.test.ts`: Deterministic AI clarity engine behavior for positive and tight margins.
- `tests/sharing.test.ts`: Cryptographic token generation, SHA-256 hash integrity, expiration logic, and privacy field filtering.

To build the production bundle:
```bash
npm run build
```

---

## 9. Deployment Guide

### Frontend Deployment (Vercel / Netlify)
1. Connect your repository to Vercel.
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Set Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Backend / Server-side Deployment
- **Option A (Supabase Edge Functions):**
  ```bash
  npx supabase functions deploy analyze-finances
  npx supabase secrets set GEMINI_API_KEY=your_key
  ```
- **Option B (Node.js API on Render / Railway):**
  - Run `tsx server/index.ts`
  - Set `GEMINI_API_KEY`, `PORT=3001`
