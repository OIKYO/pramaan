# Pramaan

Pramaan checks every poster made by the branches of a multi-branch organisation before it is published. Our demo is a fictional coaching institute chain, Northfield Academy.

Branch staff upload a poster. Pramaan reads it, runs 17 checks against head office's brand kit, approved facts, a consent-backed toppers register and a rule pack based on the CCPA Guidelines for Prevention of Misleading Advertisement in Coaching Sector, 2024, and shows each problem on the poster with a suggested fix. A regional manager reviews it, then head office gives final approval. The AI never approves anything.

Team HEISEN-DE-BUG, CodeNexus India 2026, problem statement: Brand Governance by Inkloom AI.

> Work in progress for Round 2 (6–9 Nov 2026). Live links and demo accounts will be added here.

## Run locally (Windows 11)

```powershell
# backend
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env    # then fill it in
uvicorn app.main:app --reload --port 8000
pytest

# frontend
cd frontend
npm install
copy .env.example .env    # then fill it in
npm run dev
npm run check
```
