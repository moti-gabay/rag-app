

# Dynamic PDF RAG Chat Application

A Full-Stack Retrieval-Augmented Generation (RAG) web application that allows users to upload any PDF document and have an interactive, context-aware chat conversation about its contents. 

The application ensures data privacy by restricting the AI's responses strictly to the facts extracted from the uploaded document, eliminating hallucinations.

---

## 🏗️ Architecture & Tech Stack

### Backend
* **Python 3.10+**
* **FastAPI:** High-performance, asynchronous web framework for building the API endpoints.
* **LangChain:** Orchestration framework used to manage the RAG pipeline (Document Loading, Text Splitting, and Chain Creation).
* **Chroma DB:** An in-memory vector database used to store text embeddings and perform fast similarity searches.
* **OpenAI (GPT-4o-mini & Text-Embedding-3-Small):** Used for generating vector embeddings and processing semantic, fact-based answers.

### Frontend
* **React (Vite)**
* **TypeScript**
* **CSS3:** Clean, responsive ChatGPT-style messaging UI.

---

## 🚀 Getting Started

### Prerequisites
* Python 3.10 or higher installed
* Node.js (v18+) and npm installed
* An OpenAI API Key

---

### 1. Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd rag-backend

2. Create a clean Virtual Environment and activate it:
```bash
python3 -m venv venv
source venv/bin/activate

```


3. Upgrade pip and install the required packages:
```bash
pip install --upgrade pip
pip install langchain langchain-openai chromadb fastapi uvicorn python-dotenv python-multipart pypdf tiktoken

```


4. Create a `.env` file in the `rag-backend` folder:
```env
OPENAI_API_KEY=your_actual_openai_api_key_here
ANONYMOUS_TELEMETRY=False

```


5. Run the FastAPI server:
```bash
python3 main.py

```


*The server will start running on `http://localhost:8000*`

---

### 2. Frontend Setup (React + Vite)

1. Open a new terminal window and navigate to the frontend directory:
```bash
cd rag-frontend

```


2. Install the node modules:
```bash
npm install

```


3. Start the Vite development server:
```bash
npm run dev

```


*The client application will be available at `http://localhost:5173*`

---

## 🛠️ Troubleshooting & Core Fixes

### Virtual Environment (bad interpreter) Fix

If you encounter a `-bash: ... venv/bin/pip: ... bad interpreter: No such file or directory` error due to moving project folders, clear the corrupted environment and rebuild it using:

```bash
deactivate
rm -rf venv
python3 -m venv venv
source venv/bin/activate

```

### Form Data Error

If FastAPI throws a `RuntimeError: Form data requires "python-multipart" to be installed`, ensure you have activated your `venv` and run:

```bash
pip install python-multipart

```

---

## 📖 How It Works (The RAG Flow)

1. **File Upload (`/api/upload`):** The user uploads a PDF from the React UI. FastAPI saves it temporarily, and `PyPDFLoader` extracts the raw text.
2. **Chunking & Embedding:** `RecursiveCharacterTextSplitter` breaks the text into 500-character pieces. `OpenAIEmbeddings` transforms these text chunks into high-dimensional vectors.
3. **Vector Vectorization:** The vectors are stored inside `Chroma`.
4. **Context-Aware Querying (`/api/chat`):** When a user sends a message, the system searches Chroma for the top 3 most textually relevant chunks, embeds them into a system prompt, and forwards them to `gpt-4o-mini` to deliver a fully grounded answer.

