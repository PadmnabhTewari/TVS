# 🚀 TVS-SAATHI — Intelligent Customer Support Platform

TVS-SAATHI is an **AI-powered customer support and engagement platform** designed to assist both **customers** and **support agents** in managing queries, resolving issues, and accessing services seamlessly.  

The project demonstrates how **agentic AI workflows**, **memory management**, and **tool integrations** can create a next-gen support assistant for enterprises like TVS.

---

## 🌟 Vision
To build an **intelligent, multi-channel assistant** that:
- Enhances **customer satisfaction** with instant and contextual responses
- Improves **agent efficiency** by automating routine tasks
- Provides **actionable insights** from past interactions
- Works **before, during, and after** customer queries for complete lifecycle support

---

## ✨ Key Features
- **Agentic AI Assistant**
  - Natural Language Understanding (NLU)
  - Planner for deciding steps and calling tools
  - Tool execution (loan details, payments, profile updates, ticketing, etc.)
  - Synthesized responses for end-users

- **Tooling Layer**
  - Mocked APIs for loan management, payments, profile handling, and ticket creation
  - Gateway interface for easy integration with real APIs in future

- **Memory Management**
  - Short-term & long-term memory of conversations
  - Memory persistence across sessions
  - Memory viewer & clearing options

- **User Experience**
  - Multi-page responsive web UI
  - Dark/Light theme toggle
  - Dashboard, Agent, Tools, Memory, Settings, Roadmap, and About pages
  - Logs & planner inspector for debugging

- **Scalable Architecture**
  - Built modularly for plugging into real systems
  - No backend required for prototype (runs entirely in browser)
  - Future-ready for API integration, authentication, and role-based access

---

## 🛠️ Tech Stack
- **Frontend**: React + Vite + TailwindCSS  
- **Agent Logic**: Vanilla JavaScript (mocked planner, tools, memory)  
- **Persistence**: Browser LocalStorage  
- **Deployment**: Works offline (single HTML file) or hosted (Netlify / Vercel)

---

## 🚀 Getting Started

### Option 1: Run Single-File Prototype
1. Download `Prototype.html`  
2. Open it in any modern browser — no setup required

### Option 2: Run Vite + React Version
1. Clone repo and install dependencies:
   ```bash
   git clone https://github.com/PadmnabhTewari/TVS.git
   cd tvs-saathi
   npm install
