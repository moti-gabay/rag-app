import React, { useState } from 'react';
import './App.css';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'Please upload a PDF file to start the conversation.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // States חדשים לניהול הקובץ
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // פונקציית העלאת קובץ ל-Backend
  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/api/upload', {
        method: 'POST',
        body: formData, // FormData שולח אוטומטית כ-multipart/form-data
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      setIsFileUploaded(true);
      setMessages([
        { id: Date.now().toString(), sender: 'bot', text: `Successfully loaded: "${selectedFile.name}". You can now ask me questions about it!` }
      ]);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // פונקציית שליחת ההודעה בצ'אט
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isFileUploaded) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text })
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.answer
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), sender: 'bot', text: 'Sorry, something went wrong. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <header className="chat-header">
        <h2>📚 Dynamic PDF RAG Chat</h2>
      </header>

      {/* אזור העלאת קובץ חדש */}
      <div className="upload-section">
        <form onSubmit={handleFileUpload} className="upload-form">
          <input 
            type="file" 
            accept=".pdf" 
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            disabled={isUploading}
          />
          <button type="submit" disabled={!selectedFile || isUploading}>
            {isUploading ? 'Processing...' : 'Upload PDF'}
          </button>
        </form>
      </div>

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
            <div className="message-bubble">
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message-wrapper bot">
            <div className="message-bubble loading">Thinking...</div>
          </div>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isFileUploaded ? "Ask a question about the PDF..." : "Please upload a PDF first..."}
          disabled={isLoading || !isFileUploaded}
        />
        <button type="submit" disabled={isLoading || !input.trim() || !isFileUploaded}>
          Send
        </button>
      </form>
    </div>
  );
}

export default App;