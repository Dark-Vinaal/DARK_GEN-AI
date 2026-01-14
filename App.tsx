import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { ImageGenerator } from './components/ImageGenerator';
import { VideoGenerator } from './components/VideoGenerator';
import { Message, ChatSession, AIProvider, AppTab } from './types';
import { sendMessageToGemini } from './services/gemini';
import { sendMessageToPuter } from './services/puter';
import jsPDF from 'jspdf';

const App: React.FC = () => {
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [activeTab, setActiveTab] = useState<AppTab>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>(Date.now().toString());
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [darkMode, setDarkMode] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize and check API Key
  useEffect(() => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'ENTER_YOUR_KEY_HERE') {
      setProvider('puter');
    }
    
    const savedSessions = localStorage.getItem('chat_history');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
    
    // Theme init
    if (localStorage.getItem('theme') === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(sessions));
  }, [sessions]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false, content: m.content + ' [Stopped]' } : m));
    }
  };

  const handleSendMessage = async (text: string, file?: File) => {
    if (!text.trim() && !file) return;

    // Abort previous if any
    if (loading) handleStop();
    abortControllerRef.current = new AbortController();

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      file: file ? { name: file.name, type: file.type } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      let responseText = '';
      const botMsgId = (Date.now() + 1).toString();
      
      setMessages(prev => [...prev, {
        id: botMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true
      }]);

      const onStream = (chunk: string) => {
        responseText += chunk;
        setMessages(prev => prev.map(m => 
          m.id === botMsgId 
            ? { ...m, content: responseText }
            : m
        ));
        scrollToBottom();
      };

      if (provider === 'gemini') {
        await sendMessageToGemini({ text, file, signal: abortControllerRef.current.signal }, onStream);
      } else {
        await sendMessageToPuter({ text, file }, onStream);
      }

      setMessages(prev => prev.map(m => 
        m.id === botMsgId ? { ...m, isStreaming: false } : m
      ));

      updateSessionHistory(userMsg, { 
        id: botMsgId, 
        role: 'assistant', 
        content: responseText, 
        timestamp: Date.now() 
      });

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error("Error sending message:", error);
        setMessages(prev => prev.map(m => 
          m.isStreaming 
            ? { ...m, content: "Error: Service unavailable or request failed.", isStreaming: false, isError: true } 
            : m
        ));
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const updateSessionHistory = (userMsg: Message, botMsg: Message) => {
    setSessions(prev => {
      const existingSessionIndex = prev.findIndex(s => s.id === currentSessionId);
      if (existingSessionIndex >= 0) {
        const updated = [...prev];
        const session = updated[existingSessionIndex];
        session.messages.push(userMsg, botMsg);
        session.lastUpdated = Date.now();
        // Update preview only if it's the first exchange
        if (session.messages.length <= 2) {
            session.preview = userMsg.content.substring(0, 40) + '...';
            session.title = userMsg.content.substring(0, 30);
        }
        return updated;
      } else {
        return [{
          id: currentSessionId,
          title: userMsg.content.substring(0, 30),
          messages: [userMsg, botMsg],
          lastUpdated: Date.now(),
          preview: userMsg.content.substring(0, 40) + '...'
        }, ...prev];
      }
    });
  };

  // Message Actions
  const handleMessageDelete = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
    // Also update history
    setSessions(prev => prev.map(s => 
      s.id === currentSessionId ? { ...s, messages: s.messages.filter(m => m.id !== id) } : s
    ));
  };

  const handleMessageEdit = (id: string, newContent: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, content: newContent } : m));
  };

  const handleRegenerate = (botMsgId: string) => {
    // Find the user message before this bot message
    const msgIndex = messages.findIndex(m => m.id === botMsgId);
    if (msgIndex > 0) {
        const userMsg = messages[msgIndex - 1];
        if (userMsg.role === 'user') {
            // Delete bot message and everything after (optional, but cleaner for regen)
            setMessages(prev => prev.slice(0, msgIndex));
            handleSendMessage(userMsg.content, undefined); // Re-trigger send
        }
    }
  };

  const handleFeedback = (id: string, type: 'like' | 'dislike') => {
    setMessages(prev => prev.map(m => 
        m.id === id ? { ...m, liked: type === 'like', disliked: type === 'dislike' } : m
    ));
  };

  // Session Management
  const startNewChat = () => {
    setCurrentSessionId(Date.now().toString());
    setMessages([]);
    setActiveTab('chat');
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const loadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      setActiveTab('chat');
      if (window.innerWidth < 768) setSidebarOpen(false);
    }
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id));
    if (currentSessionId === id) {
        startNewChat();
    }
  };

  const renameSession = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  // Global Actions
  const clearCurrentChat = () => {
    if (confirm("Are you sure you want to clear this chat?")) {
        setMessages([]);
        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: [] } : s));
    }
  };

  const downloadCurrentChat = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Chat Export", 10, 10);
    doc.setFontSize(12);
    let y = 20;
    messages.forEach(msg => {
      const text = doc.splitTextToSize(`${msg.role.toUpperCase()}: ${msg.content}`, 180);
      if (y + text.length * 7 > 280) { doc.addPage(); y = 10; }
      doc.text(text, 10, y);
      y += text.length * 7 + 5;
    });
    doc.save(`chat-${currentSessionId}.pdf`);
  };

  return (
    <div className={`flex h-screen w-full ${darkMode ? 'bg-black text-gray-100' : 'bg-gray-50 text-gray-900'} overflow-hidden relative font-sans transition-colors duration-300`}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-30 h-full w-72 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}
      `}>
        <Sidebar 
          sessions={sessions}
          currentSessionId={currentSessionId}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onNewChat={startNewChat}
          onLoadSession={loadSession}
          onRenameSession={renameSession}
          onDeleteSession={deleteSession}
          provider={provider}
          onSetProvider={setProvider}
          onCloseMobile={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative w-full">
        <Navbar 
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          provider={provider}
          modelName={provider === 'gemini' ? 'Gemini 3 Flash' : 'Puter.js (Llama)'}
          onClearChat={clearCurrentChat}
          onDownloadChat={downloadCurrentChat}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />

        {/* Content Area */}
        <div className={`flex-1 overflow-hidden flex flex-col relative ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
                <MessageList 
                    messages={messages} 
                    onDelete={handleMessageDelete}
                    onRegenerate={handleRegenerate}
                    onEdit={handleMessageEdit}
                    onFeedback={handleFeedback}
                />
                <div ref={messagesEndRef} className="h-4" />
              </div>
              <div className={`p-4 ${darkMode ? 'bg-gradient-to-t from-black to-transparent' : 'bg-white'}`}>
                <ChatInput onSendMessage={handleSendMessage} onStop={handleStop} loading={loading} />
                <p className={`text-center text-[10px] mt-2 ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                   Models can hallucinate. Check important info.
                </p>
              </div>
            </>
          )}

          {activeTab === 'image' && <ImageGenerator />}
          {activeTab === 'video' && <VideoGenerator />}
        </div>
      </div>
    </div>
  );
};

export default App;