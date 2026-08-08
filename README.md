# ⚡ Zero-Aura // OpenTrade PoC

A full-stack, hyper-gamified financial data pipeline and swipe-card mechanics library built specifically for the **67 Labs (OpenTrade YC S26)** ecosystem. Resumes are boring, so I built a piece of their actual product loop instead.

It transforms dense, low-aura corporate market data (SEC filings, earnings transcripts) into high-retention, interactive market swipe cards utilizing a custom AI prompting engine and ultra-fluid interface micro-interactions.

## 🚀 Core Features

- **🎰 The Swipe Arena:** An ultra-smooth, physics-based user interface using Next.js & Framer Motion. Handles dynamic velocity calculations, drag constraints, and multi-directional haptic-feedback triggers (Bullish vs. Bearish).
- **🧠 Brainrot Financial Analyst:** A backend Node.js microservice that intercepts financial raw feeds (via Polygon.io API) and routes them through an LLM orchestration layer.
- **⚡ Deterministic JSON Output:** The system prompt forces unstructured financial transcripts into raw structured JSON matching mobile card viewports natively.

## 🛠️ The Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Framer Motion, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript, Zod (Schema Validation)
- **AI/Data Layer:** OpenAI / Anthropic SDK, Polygon.io Financial API

## 📁 Repository Structure

```text
Zero-Aura/
├── backend/          # LLM Orchestration & Financial API Layer
└── frontend/         # Framer Motion Swipe Deck & Particle UI
```

---

*Built with high hunger and zero corporate fluff to scale OpenTrade to 1M users.*
