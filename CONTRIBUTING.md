# Contributing to NEXUS

Thank you for your interest in contributing to **NEXUS — AI-Powered Financial Identity & Trust Network**! We welcome open-source contributions from developers, designers, financial engineers, and security researchers, especially during Hacktoberfest and beyond.

---

## Code of Conduct
We are committed to providing a welcoming, inclusive, and harassment-free environment for all contributors. Please be respectful and collaborative in all discussions and pull requests.

---

## Quickstart Development Workflow

### 1. Fork the Repository
Click the **Fork** button at the top right of the [NEXUS GitHub Repository](https://github.com/arslaanahmad2005-dotcom/Nexus). Clone your fork locally:
```bash
git clone https://github.com/<your-username>/Nexus.git
cd Nexus
```

### 2. Install Dependencies
Ensure you have **Node.js (v18 or higher)** and `npm` installed:
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and configure your credentials:
```env
# Client Configuration (Supabase optional for cloud sync; demo mode works out-of-the-box)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server Configuration & Google Gemma 4 Model Setup
PORT=3001
NODE_ENV=development
GEMINI_API_KEY=your_gemini_api_key_here
GEMMA_MODEL=gemma-4-26b-a4b-it
AI_PROVIDER=gemma
AI_REQUEST_TIMEOUT_MS=30000
```
> **Security Rule:** Never prefix `GEMINI_API_KEY` with `VITE_`. All model calls must remain server-side to protect your API keys from leaking into client JavaScript bundles.

### 4. Run the Project
Start both the Express API server and the Vite React frontend concurrently:
```bash
npm run dev
```
- Frontend client: `http://localhost:5173`
- Backend API: `http://localhost:3001`
- Server health check: `http://localhost:3001/api/health`

### 5. Running Tests & Linting
Run the automated test suite with Vitest:
```bash
npm test
```
Run linter:
```bash
npm run lint
```
Verify the production build:
```bash
npm run build
```

---

## Contribution Guidelines

### Branching Strategy
1. Always create a feature branch off `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
2. Keep commits concise, atomic, and descriptive:
   ```bash
   git commit -m "feat(copilot): add Hindi-language response formatting"
   ```

### Architecture Principles to Follow
- **Strict Separation of Math and AI:** All numerical calculations (inflows, outflows, savings rates, DTI, Trust Scores) must be computed deterministically in `src/lib/calculations.ts`. The AI model (Gemma 4) should only explain, interpret, and suggest habits—never invent or override numerical metrics.
- **Privacy by Design:** Never send raw bank account numbers, passwords, Aadhaar numbers, or PII into AI prompts. Anonymize user records before server analysis.
- **Resilient Fallbacks:** Any newly introduced AI feature must include a deterministic fallback mode so offline development and low-connectivity users are never blocked.

### Submitting a Pull Request (PR)
1. Push your branch to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
2. Open a Pull Request against the `main` branch of the official repository.
3. Describe the change, the motivation, and include screenshots or test results.
4. Ensure all unit tests pass (`npm test`).

### Reporting Issues
If you encounter a bug or have a feature proposal:
- Check existing issues to prevent duplicates.
- Open a GitHub Issue using the standard bug report or feature request template.
- For security vulnerabilities, please refer to our [Security Policy](SECURITY.md).
