import os
import shutil
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import Chroma
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()
os.environ["ANONYMOUS_TELEMETRY"] = "False"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# הגדרת תיקייה זמנית לשמירת הקבצים המועלים
UPLOAD_DIR = "./uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# משתנים גלובליים שיחזיקו את ה-Chain וה-DB לאחר העלאת הקובץ
vector_store = None
rag_chain = None

# הגדרת רכיבי ה-LLM והפרומפט מראש
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
system_prompt = (
    "You are a helpful assistant. Answer the user's question based ONLY on the following context derived from a PDF document. "
    "If you don't know the answer, say that you don't know.\n\n"
    "Context:\n{context}"
)
prompt_template = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "{input}"),
])
question_answer_chain = create_stuff_documents_chain(llm, prompt_template)


# --- 1. Endpoint חדש להעלאת קובץ ---
@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    global vector_store, rag_chain
    
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    # שמירת הקובץ מקומית בשרת
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # עיבוד ה-PDF בזמן אמת (RAG Ingestion Pipeline)
        loader = PyPDFLoader(file_path)
        docs = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        chunks = text_splitter.split_documents(docs)
        
        embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
        
        # בנייה מחדש של ה-Vector DB עם המסמך החדש
        vector_store = Chroma.from_documents(chunks, embeddings)
        retriever = vector_store.as_retriever(search_kwargs={"k": 3})
        
        # עדכון ה-Chain הגלובלי
        rag_chain = create_retrieval_chain(retriever, question_answer_chain)
        
        return {"status": "success", "message": f"File '{file.filename}' processed and ready for chat."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")


# --- 2. Endpoint ה-Chat הקיים (עם בדיקת הגנה) ---
class ChatRequest(BaseModel):
    message: str

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    global rag_chain
    
    # הגנה: אם המשתמש מנסה לדבר לפני שהוא העלה קובץ
    if rag_chain is None:
        raise HTTPException(status_code=400, detail="Please upload a PDF file first before starting the chat.")
        
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    
    try:
        response = rag_chain.invoke({"input": request.message})
        return {"answer": response["answer"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)