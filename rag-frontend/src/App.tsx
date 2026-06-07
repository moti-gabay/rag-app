import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL;

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function App() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'Upload a PDF file to get started. I\'ll read it and answer any questions you have.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Upload failed');
      }

      setIsFileUploaded(true);
      setMessages([
        { id: Date.now().toString(), sender: 'bot', text: `"${selectedFile.name}" has been loaded successfully. What would you like to know?` }
      ]);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isFileUploaded) return;

    const userMessage: Message = { id: Date.now().toString(), sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.text })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: data.answer }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'bot', text: 'Something went wrong. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as any);
    }
  };

  const uploadZoneClass = `upload-zone${isFileUploaded ? ' uploaded' : selectedFile ? ' has-file' : ''}`;

  return (
    <div className="app-shell">

      {/* Header */}
      <header className="app-header">
        <div className="header-icon">📄</div>
        <div className="header-text">
          <h1>PDF RAG Chat</h1>
          <p>Ask anything about your document</p>
        </div>
        <span className={`header-badge${isFileUploaded ? ' active' : ''}`}>
          {isFileUploaded ? '● Ready' : '○ No file'}
        </span>
      </header>

      {/* Upload */}
      <div className="upload-section">
        <form onSubmit={handleFileUpload}>
          <div className={uploadZoneClass}>
            <span className="upload-icon">
              {isFileUploaded ? '✅' : selectedFile ? '📎' : '📁'}
            </span>
            <div className="upload-info">
              <span>
                {isFileUploaded
                  ? selectedFile?.name
                  : selectedFile
                  ? selectedFile.name
                  : 'No file selected'}
              </span>
              <small>
                {isFileUploaded ? 'Document indexed' : 'PDF files supported'}
              </small>
            </div>
            <div className="upload-actions">
              {!isFileUploaded && (
                <label className="btn-choose">
                  Browse
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                    disabled={isUploading}
                  />
                </label>
              )}
              {!isFileUploaded && (
                <button className="btn-upload" type="submit" disabled={!selectedFile || isUploading}>
                  {isUploading ? 'Processing…' : 'Upload'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className={`message-row ${msg.sender}`}>
            <div className={`avatar ${msg.sender}`}>
              {msg.sender === 'bot' ? '✦' : '↑'}
            </div>
            <div className="bubble">{msg.text}</div>
          </div>
        ))}

        {isLoading && (
          <div className="message-row bot">
            <div className="avatar bot">✦</div>
            <div className="bubble">
              <div className="typing-dots">
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-bar">
        <form onSubmit={handleSendMessage}>
          <div className="input-wrapper">
            <input
              className="chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isFileUploaded ? 'Ask a question about the PDF…' : 'Upload a PDF first…'}
              disabled={isLoading || !isFileUploaded}
            />
            <button
              className="btn-send"
              type="submit"
              disabled={isLoading || !input.trim() || !isFileUploaded}
            >
              <SendIcon />
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

export default App;
