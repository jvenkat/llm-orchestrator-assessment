# 🤖 LLM Interview Orchestrator & Health Monitor

A resilient, dual-service architecture designed for real-time AI interview simulations. This system features a **Node.js Control Plane** for state management and a **Python Data Plane** for high-concurrency execution with automatic model failover.

---

## 🌟 Key Features

- **Real-time Streaming:** WebSocket-based communication to support low-latency Speech-to-Text (STT) simulation.
- **Hybrid Health Monitoring:** Combines **Active Monitoring** (scheduled background pings) with **Passive Monitoring** (real-time failure reporting from execution nodes).
- **Circuit Breaker & Quarantine:** Automatically quarantines failing providers after 3 consecutive errors to prevent resource waste and API spamming.
- **Stateless Execution:** Mid-interview model swapping without losing conversation context, as history is managed within the socket lifecycle.

---

## 🏗️ Architecture & Responsibility Separation

The system follows a strict **Control Plane / Data Plane** separation:

1. **Orchestrator (Node.js / Express)**  
   The *Source of Truth*.  
   - Tracks LLM provider health  
   - Calculates latency and error rates  
   - Manages circuit breaker and quarantine states  

2. **Execution Agent (Python / FastAPI)**  
   The *Muscle*.  
   - Manages WebSocket lifecycles  
   - Maintains per-interview conversation history  
   - Executes LLM calls and handles failover logic  

---

## 🚀 Getting Started

### 1️⃣ State Manager (Node.js)

```bash
Runs on: http://localhost:3000

Health Dashboard: GET /api/models/health

Best Model Selector: GET /api/models/best

State Manager (Node.js)

cd orchestrator-express
npm install
npm start
```

### 2️⃣ Execution Agent (Python)

```
Execution Agent (Python)

cd llm-interview-handler

python -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn requests websockets
fastapi dev main.py


Runs on: http://localhost:8000

WebSocket Entry:

ws://localhost:8000/interview/stream/{candidate_id}
```

## 🧪 Testing Resilience (Chaos Test)

This section validates the system’s **self-healing behavior** and **circuit breaker logic** under simulated failure conditions.

### Scenario: Automatic Provider Failover

1. **Connect a Client**  
   Launch a WebSocket client (for example, `test_client.py`) and initiate an interview session.

2. **Trigger Failure**  
   The Python Execution Agent selects the current *Best* model (e.g., GPT-4) based on health and latency.

3. **Simulated Crash**  
   An exception is intentionally thrown during the LLM request to emulate provider instability or downtime.

4. **Failure Reporting**  
   - The Python service catches the exception.  
   - It reports the failure to the Control Plane via:  
     ```
     POST /api/models/{model_id}/report-failure
     ```

5. **Circuit Breaker Activation**  
   - The Node.js Orchestrator increments the failure count.  
   - After **3 consecutive failures**, the provider is **quarantined for 5 minutes**.

6. **Automatic Failover**  
   - The Execution Agent immediately requests the next healthiest model  
     (e.g., Claude 3).  
   - The interview flow resumes using the fallback provider.

### ✅ Result

The interview continues **seamlessly**, with no visible interruption or error from the candidate’s perspective, demonstrating robust resilience and fault tolerance.

## 📈 Design Trade-offs & Future TODOs

This section outlines the key architectural decisions made to balance **simplicity, performance, and scalability**, along with planned improvements as the system evolves.

---

### 1️⃣ State Persistence

- **Current Approach:**  
  Health metrics, latency data, and circuit breaker states are stored **in-memory** within the Node.js Orchestrator to ensure `O(1)` access and minimal latency during live interviews.

- **Trade-off:**  
  - ✅ Extremely fast reads/writes  
  - ❌ State is lost on process restart  
  - ❌ Not shareable across multiple orchestrator instances

- **Future Improvement:**  
  - Migrate state to **Redis** to enable horizontal scaling and shared health awareness across multiple Control Plane instances.

---

### 2️⃣ WebSocket Scaling

- **Current Approach:**  
  Conversation history is maintained **locally within each WebSocket connection** in the Python Execution Agent.

- **Trade-off:**  
  - ✅ Simple implementation  
  - ✅ No external dependency during interviews  
  - ❌ Limits horizontal scaling when connections exceed a single node’s capacity

- **Future Improvement:**  
  - Introduce **Redis Pub/Sub** for distributed session coordination, or  
  - Use **sticky sessions** at the load balancer to preserve socket affinity while scaling execution nodes.

---

### 3️⃣ Advanced Model Routing

- **Current Approach:**  
  Requests are routed to the **lowest-latency healthy model** to optimize response time during interviews.

- **Trade-off:**  
  - ✅ Fast responses  
  - ❌ Does not account for cost or task complexity

- **Future Improvement:**  
  - Implement **cost-aware and capability-aware routing**, such as:  
    - Using lightweight models (e.g., GPT-4o-mini) for warm-up or small talk  
    - Escalating to advanced models (e.g., GPT-4) for complex reasoning  
    - Dynamically balancing **latency, cost, and quality** to optimize overall API spend


