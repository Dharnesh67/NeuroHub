Here’s a polished, structured, and comprehensive `README.md` for **NeuroHub** that merges your old and new content seamlessly:  

---

# **🧠 NeuroHub – AI-Powered Codebase Assistant**  
**Accelerate code understanding, streamline meetings, and enhance collaboration with AI.**  

[![Demo Video](https://img.shields.io/badge/Demo-Video-blue?logo=playstation)](./Demo.mp4)  
[![GitHub Repo](https://img.shields.io/badge/GitHub-NeuroHub-blue?logo=github)](https://github.com/Dharnesh67/NeuroHub)  

---

## **🚀 Overview**  
NeuroHub is an AI-powered platform designed for **collaborative code understanding**, **smart meeting transcription**, and **seamless GitHub repository access**. Built with the **T3 Stack** and enhanced by cutting-edge AI, it helps developers:  
- **Understand codebases 85% faster** with RAG-powered Q&A.  
- **Extract actionable insights** from meetings using AI transcription.  
- **Securely access and query** private repositories.  

Trusted by **500+ developers** and integrated with top-tier APIs like Gemini, AssemblyAI, and GitHub.  

---

## **✨ Key Features**  

### **🔍 Contextual Codebase Q&A**  
- **RAG-powered search** (LangChain + Gemini) for precise answers.  
- **File references** show sources for transparency.  
- **Semantic search** retrieves top 10 relevant results from embeddings.  

### **🎙 Smart Meeting Assistant**  
- **Drag & drop uploads** → **Firebase Storage** → **AssemblyAI transcription**.  
- **Auto-generated summaries** with issues, action items, and decisions.  

### **⚡ Real-Time Repository Insights**  
- **Commit summaries** (Gemini API) with live updates.  
- **Positivity score** for repo health assessment.  
- **OAuth-secured GitHub access** for private repos.  

### **🖥 Intuitive Dashboard**  
- **Dark/light mode**, collapsible sidebar, Clerk authentication.  
- **Project switching** with real-time sync.  

---

## **🛠 Tech Stack**  
| Category          | Technologies                                                                 |  
|-------------------|-----------------------------------------------------------------------------|  
| **Frontend**      | Next.js, TailwindCSS, shadcn/ui                                             |  
| **Backend**       | tRPC, NextAuth.js, Drizzle ORM                                              |  
| **AI/ML**         | LangChain, Gemini API, AssemblyAI (STT)                                     |  
| **Database**      | PostgreSQL (Neon), Firebase Storage, Vector DB (embeddings)                 |  
| **DevOps**        | GitHub Actions, Vercel                                                      |  
| **Auth/Payments** | Clerk, Stripe                                                               |  

---

## **📦 Installation**  
### **Prerequisites**  
- Node.js `v18+`, PostgreSQL, Firebase account, Gemini/AssemblyAI API keys.  

### **Setup**  
```bash
# Clone the repo
git clone https://github.com/Dharnesh67/NeuroHub.git
cd NeuroHub

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env  # Fill in your API keys

# Run the app
npm run dev
```

---

## **📌 Usage Guide**  

### **1. Upload & Analyze Meetings**  
1. Drag/drop audio/video → **Firebase Storage**.  
2. AssemblyAI transcribes content → **issues/summary generated**.  
3. View insights in the **Meeting Tab**.  

### **2. Query Your Codebase**  
1. Link a GitHub repo via **OAuth**.  
2. Ask questions → **RAG retrieves answers** with file references.  
3. History tracks past queries.  

### **3. Monitor Repository**  
- **Real-time commit summaries** (Gemini).  
- **Positivity score** and activity trends.  

---

## **🔧 Project Structure**  
```plaintext
neurohub/  
├── src/  
│   ├── app/          # Next.js routes  
│   ├── components/   # UI (dashboard, sidebar)  
│   ├── lib/          # RAG, embeddings, API calls  
│   └── server/       # tRPC, auth, database  
├── prisma/           # Schema (Drizzle/Prisma)  
├── public/           # Assets  
└── .env.example      # API keys template  
```

---
