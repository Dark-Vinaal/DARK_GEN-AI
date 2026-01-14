import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { Message, ChatSession, AIProvider } from './types';
import { sendMessageToGemini } from './services/gemini';
import { sendMessageToPuter } from './services/puter';
import { Menu, Zap, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [provider, setProvider] = useState<AIProvider>('gemini');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>(Date.now().toString());
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize and check API Key
  useEffect(() => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'ENTER_YOUR_KEY_HERE') {
      console.warn("Gemini API Key missing. Switching to Puter.js fallback.");
      setProvider('puter');
    }
    
    const savedSessions = localStorage.getItem('chat_history');
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(sessions));
  }, [sessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string, file?: File) => {
    if (!text.trim() && !file) return;

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
      
      // Initial bot message placeholder
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
        await sendMessageToGemini({ text, file }, onStream);
      } else {
        await sendMessageToPuter({ text, file }, onStream);
      }

      setMessages(prev => prev.map(m => 
        m.id === botMsgId ? { ...m, isStreaming: false } : m
      ));

      // Update session history
      updateSessionHistory(userMsg, { 
        id: botMsgId, 
        role: 'assistant', 
        content: responseText, 
        timestamp: Date.now() 
      });

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = provider === 'gemini' 
        ? "Gemini encountered an error. Try switching to Puter." 
        : "Puter service is currently unavailable.";
        
      setMessages(prev => prev.map(m => 
        m.isStreaming 
          ? { ...m, content: errorMessage, isStreaming: false, isError: true } 
          : m
      ));
    } finally {
      setLoading(false);
    }
  };

  const updateSessionHistory = (userMsg: Message, botMsg: Message) => {
    setSessions(prev => {
      const existingSessionIndex = prev.findIndex(s => s.id === currentSessionId);
      if (existingSessionIndex >= 0) {
        const updated = [...prev];
        updated[existingSessionIndex].messages.push(userMsg, botMsg);
        updated[existingSessionIndex].lastUpdated = Date.now();
        updated[existingSessionIndex].preview = userMsg.content.substring(0, 50) + '...';
        return updated;
      } else {
        return [{
          id: currentSessionId,
          messages: [userMsg, botMsg],
          lastUpdated: Date.now(),
          preview: userMsg.content.substring(0, 50) + '...'
        }, ...prev];
      }
    });
  };

  const startNewChat = () => {
    setCurrentSessionId(Date.now().toString());
    setMessages([]);
  };

  const loadSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      if (window.innerWidth < 768) setSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-charcoal text-gray-100 overflow-hidden relative">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-30 h-full w-72 bg-[#0a0a0a] border-r border-glassBorder 
        transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:hidden'}
      `}>
        <Sidebar 
          sessions={sessions}
          currentSessionId={currentSessionId}
          onNewChat={startNewChat}
          onLoadSession={loadSession}
          provider={provider}
          onSetProvider={setProvider}
          onCloseMobile={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative w-full">
        {/* Header */}
        <header className="h-14 border-b border-glassBorder flex items-center justify-between px-4 bg-[#121212]/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-glass rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg tracking-tight">
                {provider === 'gemini' ? 'Gemini 3 Flash' : 'Puter.js (Llama-3)'}
              </span>
              {provider === 'gemini' ? (
                <Zap size={14} className="text-yellow-400 fill-yellow-400" />
              ) : (
                <Zap size={14} className="text-blue-400 fill-blue-400" />
              )}
            </div>
          </div>
          
          {!process.env.API_KEY || process.env.API_KEY === 'ENTER_YOUR_KEY_HERE' ? (
             <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
               <AlertTriangle size={12} />
               <span>Fallback Mode</span>
             </div>
          ) : null}
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          <MessageList messages={messages} />
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gradient-to-t from-charcoal to-transparent">
          <div className="max-w-3xl mx-auto">
             <ChatInput onSendMessage={handleSendMessage} loading={loading} />
             <p className="text-center text-xs text-gray-500 mt-2">
               AI can make mistakes. Please verify important information.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;