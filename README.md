<div align="center">
  <img src="https://img.icons8.com/color/96/000000/finance-document.png" alt="FinSense Logo" />
  <br>
  <h1>FinSense AI</h1>
  <p><b>The Next-Generation Autonomous Financial Intelligence Platform</b></p>
  <br>
</div>

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com/)

FinSense is a cutting-edge, AI-native personal finance SaaS product. By replacing manual data entry and static charts with autonomous categorization and conversational intelligence, FinSense redefines how users interact with their financial data. 

Powered by **Google Gemini** LLMs, FinSense leverages advanced architectural patterns like Retrieval-Augmented Generation (RAG) and Multi-Step Agents to deliver unparalleled financial insights.

---

## 🌟 Premium Features

### 🧠 Autonomous Financial Agent
- **Multi-Step Budget Health Analyst**: Rather than relying on simple API calls, our Budget Agent operates autonomously. It observes your spending, decides which tools to invoke, retrieves contextual data, and generates actionable financial recommendations—all in a loop that caps at an optimal 5 steps.
- **Intelligent RAG Retrieval**: Say goodbye to basic keyword searches. FinSense generates 768-dimensional semantic embeddings of every transaction using Gemini's text-embedding models. When you ask questions, it computes cosine similarities to retrieve perfectly contextualized data.

### ⚡ Real-Time & Streaming
- **Server-Sent Events (SSE)**: Experience ultra-fast, word-by-word streaming responses from the AI.
- **WebSocket Synchronization**: Live, bi-directional sync across all connected devices. Add an expense on your phone, and watch it instantly appear on your desktop dashboard without a refresh.
- **Redis In-Memory Caching**: 60-second aggressive caching for heavily queried endpoints, falling back to PostgreSQL seamlessly if Redis is offline. 

### 🔐 Enterprise-Grade Architecture
- **Dual-Database System**: A highly normalized **PostgreSQL** schema (via Prisma) ensures absolute ACID compliance for monetary data, while a flexible **MongoDB** (via Mongoose) document store handles unstructured chat histories and high-dimensional vector embeddings.
- **Secure Authentication**: Multi-layered auth supporting traditional bcrypt hashing, JWT issuance, and **Google OAuth 2.0**.
- **Monetization Engine**: Integrated **Razorpay** checkout flow for "Pro" plan upgrades.
- **Background Jobs**: Automated `node-cron` workers aggregate daily spending digests in the background.

---

## 🏗️ Technical Architecture

FinSense is built on a scalable, cloud-native microservices topology.

| Layer | Technology |
| --- | --- |
| **Frontend** | React 18, Next.js (SSR enabled), Tailwind CSS |
| **Backend API** | Node.js, Express.js |
| **Relational DB** | PostgreSQL (Prisma ORM) |
| **Vector & Document DB**| MongoDB (Mongoose) |
| **In-Memory Cache** | Redis |
| **AI Infrastructure** | Google Gemini (Structured JSON Outputs, Tool Calling, Vector Embeddings) |
| **Infrastructure** | Docker, Docker Compose |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- Docker Desktop
- [Google Gemini API Key](https://aistudio.google.com/apikey)
- [MongoDB Atlas URI](https://www.mongodb.com/cloud/atlas/register) (Or run locally via Docker)

### Quick Start (Dockerized Environment)

We recommend using Docker for a seamless setup experience. This will spin up PostgreSQL, MongoDB, Redis, the Node.js API, and the Next.js frontend in isolated containers.

1. **Clone & Configure**
   ```bash
   git clone https://github.com/<your-username>/finsense.git
   cd finsense
   cp .env.example .env
   ```
2. **Add Credentials**
   Open `.env` and configure your API keys:
   ```env
   JWT_SECRET=your_super_secret_key_here
   GEMINI_API_KEY=your_gemini_api_key
   ```
3. **Launch the Cluster**
   ```bash
   docker compose up --build
   ```
4. **Access the Application**
   - **Frontend:** http://localhost:5173
   - **Backend API:** http://localhost:5000/api

---

## 🛡️ Security & Performance

- **Injection Defenses:** Prompts are rigorously designed to treat user financial entries strictly as data, neutralizing prompt injection attacks.
- **Validation:** All incoming network requests are sanitized and validated using **Zod** schemas.
- **Rate Limiting:** Dedicated rate limiters protect expensive LLM execution paths from brute-force and DDoS attempts.
- **Token Analytics:** The system autonomously logs token usage and computes real-time USD cost estimates for all AI generation tasks.

---
<div align="center">
  <i>FinSense — Smarter Money, Powered by AI.</i>
</div>
