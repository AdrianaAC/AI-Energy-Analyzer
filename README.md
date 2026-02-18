# 🌿 Energy Intelligence Dashboard

AI-Enabled Frontend & Agentic Workflow MVP

This project was developed as part of the technical challenge for the **AI-Enabled Frontend & Development Accelerator** role.

It demonstrates rapid AI-assisted development, agent-based workflows, deterministic tool execution, and production-oriented frontend architecture.

---

## 🚀 Project Goals

This MVP was designed to demonstrate:

- Accelerated frontend development using AI-assisted tooling
- Implementation of AI agents with tool execution capabilities
- Structured orchestration between UI, backend logic, and LLM reasoning
- Clear UX patterns for transparency and auditability
- Production-oriented architectural decisions

---

## 🧠 High-Level Architecture

### Workflow Overview

User Upload
↓
Data Normalization (CSV/JSON parsing + header mapping)
↓
Frontend → /api/agent (POST)
↓
Agent Layer
├─ Tool Execution (deterministic)
└─ LLM Writer Step (reasoning & formatting)
↓
Structured JSON Response
↓
UI Rendering (Answer / Tools / Raw JSON)

The architecture separates deterministic business logic from AI reasoning to ensure reliability, auditability, and transparency.

---

## 🖥 Frontend Architecture

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS v4
- **Structure:** Responsive 2-column dashboard layout
- **Design Direction:** Corporate + Sustainable

### Key UI Principles

- Clear separation between:
  - Agent Answer
  - Tools Used
  - Tool Outputs
- Visual transparency of AI actions
- Structured cards and interaction hierarchy
- Smart input validation before enabling agent actions

The UI was designed to simulate a production SaaS dashboard rather than a technical demo.

---

## 🔧 Backend & Agent Layer

### API Route

- `/api/agent`
- Zod schema validation
- Deterministic tool execution
- OpenAI-compatible model integration
- Structured JSON response

### Model

- Provider: OpenRouter
- Model: `openai/gpt-4o-mini`
- Integrated via Vercel AI SDK

---

## 🛠 Tools Implementation

### Tool 1 — detectAnomalies

**Purpose:**  
Detect abnormal energy consumption based on statistical thresholding (130% of average).

**Deterministic Logic:**

- Calculate average consumption
- Compute anomaly threshold
- Identify anomalous months
- Return structured result

This tool ensures reproducibility and auditability.

---

### Tool 2 — draftEmailToFacilityManager

**Purpose:**  
Generate a structured operational email based on detected anomalies.

**Simulated Action Layer:**

- Produces subject + formatted body
- Designed to represent real-world workflow automation

This demonstrates tool execution beyond simple analytical responses.

---

## 🤖 Agentic Workflow Strategy

To ensure robustness and avoid unstable tool-only LLM responses:

1. The agent can call tools based on user intent.
2. Tool outputs are captured and stored.
3. A final "writer step" LLM call synthesizes results.
4. The frontend displays:
   - Tools used
   - Tool outputs
   - Final structured answer

This hybrid deterministic + reasoning approach improves reliability and transparency.

---

## 📊 Data Processing & Validation

Robust real-world handling includes:

- CSV delimiter auto-detection (`;` or `,`)
- Type coercion (string → number)
- Smart header normalization:
  - `Date`, `Month`, `Mês` → `month`
  - `Energy`, `kWh`, `Consumo` → `consumption`
  - `Cost`, `Price`, `Custo` → `cost`
- Zod schema validation at API level

This ensures dataset resilience and reduces runtime failure.

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

Visit: [http://localhost:3000](http://localhost:3000)

## 🧪 Example Scenario

1. Load sample data
2. Select prompt: “Find anomalies and draft an email”
3. Click Analyze

The system will:

- Execute anomaly detection
- Optionally generate a communication draft
- Return structured response
- Display tool proof in UI

## 📈 Development Acceleration & AI Usage Report

The development process leveraged AI to accelerate iteration and refinement:

- Architecture planning and workflow structuring
- Tool schema refinement
- Prompt design for reliable tool calling
- Iterative debugging
- Model experimentation via OpenRouter

All AI-generated code was manually reviewed, validated, and adapted to ensure clarity and maintainability.
The final implementation reflects intentional design decisions rather than raw generated output.

## 🏗 Architectural Decisions

Why deterministic tools?

- Ensures reproducibility
- Improves auditability
- Prevents hallucinated analytical results

Why hybrid tool + writer approach?
Some OpenAI-compatible tool flows may return tool-only responses.
The writer step guarantees a stable, structured final output.

Why structured JSON response?

- Enables clear UI rendering
- Facilitates future integration (external systems)
- Supports extensibility

## 🔮 Future Improvements

- Unit tests for deterministic tools
- Docker containerization
- External API integration (real email service)
- Persistent storage layer
- Role-based access control
- KPI dashboard metrics
- Streaming responses

## 🏁 Conclusion

This MVP demonstrates:

- AI-enabled frontend acceleration
- Agent-based workflow orchestration
- Deterministic + LLM hybrid architecture
- Structured tool execution
- Production-oriented UI thinking

It balances speed, clarity, robustness, and architectural intent, aligning with the goals of an AI-Enabled Frontend & Agentic Workflow Developer.
