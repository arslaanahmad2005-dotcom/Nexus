# AI Model Architecture & Specification: Google Gemma 4

NEXUS integrates Google's state-of-the-art **Gemma 4** open-weight model family to provide transparent, explainable financial clarity and educational guidance without proprietary vendor lock-in.

---

## 1. Model Overview

| Parameter | Specification |
| :--- | :--- |
| **Model Family** | Google Gemma (Open-Weight Models) |
| **Model Identifier** | `gemma-4-26b-a4b-it` (Preferred) |
| **Alternative Fallback Model** | `gemma-4-31b-it` / `gemini-2.5-flash` |
| **Model Nature** | Open-Weight Instruction-Tuned (`-it`) |
| **AI Provider / Host** | Google Gemini API (Hosted Endpoint) |
| **SDK Used** | Official `@google/genai` (Node.js SDK) |
| **Primary Purpose** | Financial narrative explanation, conversational assistance, and 30-day improvement planning |

> **Clarification:** While Gemma 4 is an open-weight model whose weights are openly available to the research and developer community, in NEXUS it is accessed via Google's hosted Gemini API endpoints. This enables high-speed serverless inference without requiring heavy on-premise GPU clusters. The Gemini API itself is a cloud platform service and not open source.

---

## 2. Integration Architecture

NEXUS enforces a strict two-layer architecture separating mathematical calculation from generative explanation:

```
┌────────────────────────────────────────────────────────┐
│                   NEXUS Client (Browser)               │
│   • Dashboard     • Financial Passport    • Copilot    │
└───────────────────────────┬────────────────────────────┘
                            │ (POST /api/copilot/*)
┌───────────────────────────▼────────────────────────────┐
│                  NEXUS Express 5 Server                │
│  1. Input Sanitization & Prompt Injection Filters      │
│  2. Deterministic Calculation Engine                   │
│     - Total Income & Expense Totals                    │
│     - Savings Rate % & Monthly Buffer                  │
│     - Debt-to-Income (DTI) Ratio                       │
│     - Financial Trust Score (0 - 100)                  │
│  3. Anonymization & Data Minimization                  │
│     (Strips names, emails, account IDs)                │
└───────────────────────────┬────────────────────────────┘
                            │ (Aggregated Metrics Only)
┌───────────────────────────▼────────────────────────────┐
│          Google Gemini API / Gemma 4 Engine            │
│   Model: gemma-4-26b-a4b-it (Open-Weight)              │
│   Outputs: Plain-English Summaries & Roadmaps          │
└────────────────────────────────────────────────────────┘
```

### Deterministic Financial Guard
- **Zero Hallucination of Numbers:** Language models are prone to arithmetic errors and hallucinated scores. In NEXUS, all arithmetic is computed by deterministic TypeScript code in `src/lib/calculations.ts`.
- **Explanatory Role Only:** Gemma 4 receives the pre-calculated metrics and explains what influenced the score, where spending is concentrated, and how to improve. It cannot override or calculate the score itself.

---

## 3. Server-Side Configuration

Configure Gemma 4 in your server `.env`:
```env
# Google Gemini API Key used to call Gemma 4
GEMINI_API_KEY=your_actual_gemini_api_key

# Exact Model Identifier
GEMMA_MODEL=gemma-4-26b-a4b-it

# AI Provider Identifier
AI_PROVIDER=gemma

# Request Timeout (in milliseconds)
AI_REQUEST_TIMEOUT_MS=30000
```

---

## 4. Privacy & Minimization Controls

Financial records contain highly sensitive personal information. NEXUS applies strict minimization before transmitting any prompt:
- **No PII Sent to Model:** User full name, email address, physical location, bank account numbers, IFSC codes, PAN, and Aadhaar numbers are never sent to Gemma.
- **Aggregated Numbers Only:** The prompt receives only aggregated figures (e.g. `Total Income: ₹62,000`, `Savings Rate: 31%`, `Top Category: Food & Groceries (35%)`, `Occupation: Freelancer`).
- **Prompt Injection Defense:** Inputs are filtered against system prompt overrides and delimiter tampering prior to inclusion in the prompt payload.

---

## 5. Fallback Behavior (High Availability)

If the API key is not configured, or if the Gemini API encounters rate limits or network timeouts:
1. The server automatically falls back to the **NEXUS Deterministic Clarity Engine** (`server/services/gemmaService.ts`).
2. The deterministic engine generates rule-based, grammatically sound financial explanations and a 4-week structured roadmap based on exact user ledger data.
3. The response is flagged with `is_open_weight: false` and `model_name: nexus-deterministic-engine-v1` for total transparency.
4. The user is never blocked from using the application.

---

## 6. Official Documentation & Terms

- **Gemma Open Models Documentation:** [https://ai.google.dev/gemma](https://ai.google.dev/gemma)
- **Gemma Terms of Use:** [https://ai.google.dev/gemma/terms](https://ai.google.dev/gemma/terms)
- **Google Generative AI SDK:** [https://www.npmjs.com/package/@google/genai](https://www.npmjs.com/package/@google/genai)

---

## 7. Known Limitations & Educational Disclaimer

1. **Non-Statutory Assessment:** NEXUS insights and Gemma 4 outputs are educational and do not constitute an official credit bureau score (e.g., CIBIL, Experian) or a legally binding loan sanction.
2. **Dependent on Record Completeness:** When a user logs fewer than 3 months of records, the AI explicitly alerts the user that cashflow comparisons require additional longitudinal data.
3. **No Financial Advisory Liability:** Recommendations provided by Gemma 4 are suggestions for financial discipline and should not replace advice from a certified financial planner.
