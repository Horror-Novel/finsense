# Product Requirements Document (PRD)

## 1. Product Vision
**FinSense** is an autonomous, AI-native personal finance platform. It eliminates the friction of traditional budgeting apps—which require tedious manual data entry and category selection—by allowing users to log expenses using natural language. Through an integration with Google Gemini LLMs, the platform categorizes spending automatically, generates semantic vector embeddings for intelligent retrieval, and acts as a conversational financial advisor.

## 2. Problem Statement
Managing personal finances is often time-consuming. Users abandon budgeting apps because the manual data entry is tedious, and traditional static dashboards fail to provide nuanced, actionable insights. There is a need for a proactive system that understands natural language and can analyze spending habits dynamically.

## 3. Target Audience
* **Young Professionals:** Seeking effortless tracking of daily expenses.
* **Tech-Savvy Individuals:** Interested in leveraging AI to gain deeper financial insights.
* **Students:** Needing a free, simple way to monitor tight budgets and subscriptions.

## 4. Core User Stories
* **US1:** As a user, I want to type "Spent $12 on Starbucks" so that the AI automatically extracts the amount and categorizes it as "Dining".
* **US2:** As a user, I want to ask "How much did I spend on food this month?" so the system retrieves the correct transactions and gives a conversational answer.
* **US3:** As a user, I want my dashboard to update instantly across my phone and laptop without refreshing the page.
* **US4:** As a user, I want to receive a daily summary of my spending automatically.
* **US5:** As a user, I want the AI to analyze my overall budget health and proactively suggest areas where I can save money.

## 5. Functional Requirements
* **Authentication & Authorization:** 
  * JWT-based email/password authentication.
  * Google OAuth 2.0 integration for seamless login.
  * Role-based access (User vs. Admin).
* **AI Integration (Google Gemini):**
  * **Structured Outputs:** Parsing natural language into JSON format for database entry.
  * **Function Calling:** Allowing the AI to invoke backend tools (e.g., fetch summary, create transaction) during chat.
  * **RAG (Retrieval-Augmented Generation):** Semantic search against user transaction embeddings stored in MongoDB.
  * **Multi-Step Agent:** Autonomous "Budget Health Agent" capable of chained reasoning up to 5 steps.
* **Transaction Management:**
  * Full CRUD capabilities for transactions.
  * Categorization linked via Foreign Keys.
* **Real-time Synchronization:**
  * WebSocket integration (Socket.io) to push state changes to active clients immediately.
* **Subscription Model:**
  * Razorpay integration to process payments and grant "Pro" access.
* **Scheduled Jobs:**
  * A `node-cron` worker that runs daily to aggregate the last 24 hours of spending into a Digest.

## 6. Non-Functional Requirements
* **Performance:** High-traffic endpoints (like the dashboard summary) must be cached using Redis with a TTL of 60 seconds.
* **Scalability:** The architecture must be containerized (Docker) to allow the frontend and backend to scale independently.
* **Security:** 
  * Input sanitization via Zod to prevent NoSQL/SQL injections and prompt injections.
  * Passwords must be hashed using `bcrypt`.
  * Secrets must not be committed to source control.
* **Reliability:** Fallback mechanisms must exist if Redis is unavailable, defaulting to direct database queries.

## 7. Metrics for Success
* **User Engagement:** Average chat messages sent per session.
* **AI Accuracy:** High categorization accuracy, monitored via the internal LLM Evaluation suite (`evals/categorize.eval.js`).
* **Latency:** Dashboard load times under 300ms (achieved via Redis caching).
