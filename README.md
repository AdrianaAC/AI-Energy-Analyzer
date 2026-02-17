# 🌿 Energy Intelligence Dashboard  
AI-Enabled Frontend & Agentic Workflow MVP  

This project was developed as part of the technical challenge for the **AI-Enabled Frontend & Development Accelerator** role.

It demonstrates the ability to:

- Rapidly build a modern frontend interface
- Integrate AI-powered workflows
- Implement agent tools with execution capabilities
- Orchestrate deterministic business logic + LLM reasoning

---

## 🚀 Overview

The application allows users to:

1. Upload energy reports (CSV or JSON)
2. Automatically normalize and validate data
3. Interact with an AI agent to:
   - Detect anomalies in energy consumption
   - Generate actionable recommendations
   - Draft an email to a facility manager

The system combines deterministic data processing with AI-driven reasoning to simulate an agentic workflow.

---

## 🧠 Architecture

### High-Level Flow


### Frontend
- Next.js (App Router)
- TypeScript
- TailwindCSS (v4)
- Responsive 2-column layout
- Structured results panel with tool proof

### Backend (API Route)
- Next.js API Route (`/api/agent`)
- Zod schema validation
- Deterministic business logic
- OpenAI-compatible model via OpenRouter
- Vercel AI SDK

### AI Model
- Provider: OpenRouter
- Model: `openai/gpt-4o-mini`
- OpenAI-compatible interface

---

## 🛠 Agent & Tools

### Tool 1 — detectAnomalies

Purpose:
- Detect energy consumption anomalies using a statistical threshold (130% of average consumption)

Returns:
- Average consumption
- Threshold
- Anomaly list
- Summary

This tool ensures deterministic and auditable business logic.

---

### Tool 2 — draftEmailToFacilityManager

Purpose:
- Draft a structured email based on detected anomalies
- Simulates execution of an external communication action

Returns:
- Email subject
- Email body

This demonstrates tool execution capability beyond simple analysis.

---

## 🔁 Agentic Workflow Design

To ensure stability and transparency:

1. The agent can call tools based on user intent.
2. Tool outputs are captured and logged.
3. A final LLM "writer step" generates a structured human-readable response.
4. UI displays:
   - Tools used
   - Tool outputs
   - Final AI answer

This hybrid deterministic + LLM approach improves reliability and auditability.

---

## 📊 Data Handling

The system includes:

- CSV delimiter auto-detection (`;` or `,`)
- Type coercion (string → number)
- Smart header normalization:
  - `Date`, `Month`, `Mês` → `month`
  - `Energy`, `kWh`, `Consumo` → `consumption`
  - `Cost`, `Price`, `Custo` → `cost`

This ensures robustness for real-world datasets.

---

## 🎨 UI Design

Design direction: **Corporate + Sustainable**

- Clean layout
- Soft eco-inspired accent color
- Structured card system
- Clear separation between:
  - Agent answer
  - Tool outputs
  - Raw JSON (debug transparency)

The interface emphasizes clarity, trust, and operational insight.

---

## ⚙️ Setup Instructions

### 1️⃣ Install dependencies

```bash
npm install
```

### 2️⃣ Configure environment variables

Create a .env.local file:
```bash
OPENAI_API_KEY=your_openrouter_key
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-4o-mini
```

### 3️⃣ Run locally

```bash
npm run dev
```

Visit: 
http://localhost:3000


## 🧪 Example Usage

1.Click Use sample data

2.Choose quick prompt:
“Find anomalies and draft an email”

3.Click Analyze

You will see:
 - Tools used
 - Tool outputs
 - AI summary 
 - Email draft preview


## 🧾 AI Usage Report
The development process leveraged AI tools to accelerate implementation:

- ChatGPT for architectural planning and workflow structuring
- AI assistance for refining tool schemas and agent prompts
- Model experimentation via OpenRouter
- Iterative debugging with structured prompt engineering
- All generated code was manually reviewed and validated

## 📦 Potential Improvements
Future enhancements could include:

 - Unit testing for tools
 - Docker containerization
 - Structured JSON response mode
 - External API integration (e.g., real email service)
 - Role-based access control
 - Persistent storage