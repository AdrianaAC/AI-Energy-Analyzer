# Energy Intelligence Dashboard — Technical Assessment (AI-Enabled Frontend & Agentic Workflow)”

AI-Enabled Frontend and Agentic Workflow MVP

This project was developed as part of the technical challenge for the AI-Enabled Frontend and Development Accelerator role.

It demonstrates rapid AI-assisted development, agent-based workflows, deterministic tool execution, and production-oriented frontend architecture.

---

## Deliverables

- Repository: `https://github.com/AdrianaAC/AI-Energy-Analyzer`
- Live application: `https://g2-c-challenge.vercel.app/`

---

## Project Goals

This MVP was designed to demonstrate:

- Accelerated frontend development using AI-assisted tooling
- Implementation of AI agents with tool execution capabilities
- Structured orchestration between UI, backend logic, and LLM reasoning
- Clear UX patterns for transparency and auditability
- Production-oriented architectural decisions

---

## High-Level Architecture

### Workflow Overview

User Upload  
-> Data Normalization (CSV/JSON parsing + header mapping)  
-> Frontend POST to `/api/agent`  
-> Agent Layer  
   - Tool Execution (deterministic)  
   - LLM Writer Step (reasoning + formatting)  
-> Structured JSON Response  
-> UI Rendering (answer + tool proof)

The architecture separates deterministic business logic from AI reasoning to ensure reliability, auditability, and transparency.

---

## Frontend Architecture

- Framework: Next.js (App Router)
- Language: TypeScript
- Styling: TailwindCSS v4
- Structure: Responsive two-column dashboard
- Design direction: Corporate + sustainable

### Key UI Principles

- Clear separation between:
  - Agent answer
  - Tools used
  - Tool outputs (debug proof)
- Visual transparency of AI actions
- Structured cards and interaction hierarchy
- Smart input validation before enabling agent actions

---

## Backend and Agent Layer

### API Route

- `/api/agent`
- Zod schema validation
- Deterministic tool execution
- OpenAI-compatible model integration
- Structured JSON response

### Model

- Provider: OpenRouter (OpenAI-compatible)
- Default model: `openai/gpt-4o-mini`
- SDK: Vercel AI SDK

---

## Tools Implementation

### Tool 1: `detectAnomalies`

Purpose:
Detect abnormal energy consumption using a threshold of 130% of the average.

Deterministic logic:

- Calculate average consumption
- Compute anomaly threshold
- Identify anomalous periods
- Return structured output

### Tool 2: `draftEmailToFacilityManager`

Purpose:
Generate a structured operational email based on detected anomalies.

Notes:

- Produces `subject` and `body`
- Represents a simulated action layer for workflow automation
- Only available when user intent explicitly asks for email drafting

---

## Agentic Workflow Strategy

To ensure robust behavior:

1. The planner step can call tools based on user intent.
2. Tool outputs are captured and stored.
3. A writer step synthesizes the final response.
4. The frontend displays final answer plus tool proof.

This hybrid deterministic + reasoning approach improves reliability and transparency.

---

## Data Processing and Validation

Current data handling includes:

- CSV delimiter auto-detection (`;` or `,`)
- Type coercion (string to number/boolean/null where valid)
- Header normalization, including:
  - `Date`, `Month`, `Mes`, `Mes` (PT) -> `month`
  - `Energy`, `kWh`, `Consumo` -> `consumption`
  - `Cost`, `Price`, `Custo` -> `cost`
- Zod schema validation at API level

---

## Setup Instructions

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create `.env.local`:

```bash
OPENAI_API_KEY=your_openrouter_key
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-4o-mini
```

### 3) Run locally

```bash
npm run dev
```

Open: `http://localhost:3000`

### 4) Run unit tests

```bash
npm test
```

### 5) Run with Docker

Build image:

```bash
docker build -t ai-energy-analyzer .
```

Run container:

```bash
docker run --rm -p 3000:3000 \
  -e OPENAI_API_KEY=your_openrouter_key \
  -e OPENAI_BASE_URL=https://openrouter.ai/api/v1 \
  -e OPENAI_MODEL=openai/gpt-4o-mini \
  ai-energy-analyzer
```

---

## Example Scenario

1. Load sample data
2. Select a prompt such as "Anomalies + email draft"
3. Click Analyze

The system will:

- Execute anomaly detection
- Optionally generate email draft output
- Return structured response
- Display tool proof in the UI

---

## Development Acceleration and AI Usage Report

AI was used to accelerate:

- Architecture planning and workflow structuring
- Tool schema refinement
- Prompt design for reliable tool calling
- Iterative debugging and UX refinements
- Model experimentation via OpenRouter

All generated code was manually reviewed and adapted.

---

## Architectural Decisions

Why deterministic tools?

- Reproducibility
- Auditability
- Reduced hallucination risk in analytical results

Why planner + writer steps?

- Some tool-call flows may return tool outputs without final prose
- Writer step guarantees stable, structured final text

Why structured JSON response?

- Simple and explicit UI rendering
- Easier integration with external systems
- Better future extensibility

---

## Future Improvements

- External integration for real email delivery
- Persistent storage
- Role-based access control
- More KPI dashboards and charts
- Streaming responses

---

## Conclusion

This MVP demonstrates:

- AI-enabled frontend acceleration
- Agent-based workflow orchestration
- Deterministic + LLM hybrid architecture
- Structured tool execution
- Production-oriented UI decisions

It balances speed, clarity, robustness, and architectural intent for the AI-Enabled Frontend and Agentic Workflow challenge.
