import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { ChatInput } from './components/ChatInput';
import { MessageList } from './components/MessageList';
import { ImageGenerator } from './components/ImageGenerator';
import { VideoGenerator } from './components/VideoGenerator';
import { LiveMasteryModal } from './components/LiveMasteryModal';
import { Message, ChatSession, AppTab, Model } from './types';
import { sendMessageToGemini } from './services/gemini';

import { sendMessageToOpenRouter } from './services/openrouter';
import { sendMessageToHuggingFace } from './services/huggingface';
import { sendMessageToGroq } from './services/groq';
import { exportToPDF } from './utils/exportUtils';
import { AlertTriangle, X } from 'lucide-react';

// Define available models
const CHAT_MODELS: Model[] = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Native)', provider: 'gemini' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Native)', provider: 'gemini' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Native)', provider: 'gemini' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 (Groq Hyper-Speed)', provider: 'groq' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Groq Instant)', provider: 'groq' },
  { id: 'puter-chat', name: 'Puter.js (Llama/GPT Fallback)', provider: 'puter' },
  { id: 'google/gemini-2.0-flash-lite-preview-02-05:free', name: 'Gemini 2.0 Flash Lite (Free)', provider: 'openrouter', isFree: true },
  { id: 'mistralai/mistral-small-24b-instruct-2501:free', name: 'Mistral Small 24B (Free)', provider: 'openrouter', isFree: true },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', provider: 'openrouter', isFree: true },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', provider: 'openrouter', isFree: true },
  { id: 'meta-llama/Meta-Llama-3-8B-Instruct', name: 'Llama 3 8B Instruct', provider: 'huggingface' },
  { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B Instruct', provider: 'huggingface' },
  { id: 'microsoft/Phi-3-mini-4k-instruct', name: 'Phi 3 Mini 4k', provider: 'huggingface' }
];

const IMAGE_MODELS: Model[] = [
  { id: 'gemini-2.5-flash-image', name: 'Gemini 2.5 Flash Image', provider: 'gemini' },
  { id: 'black-forest-labs/FLUX.1-schnell', name: 'Flux.1 Schnell (Quality)', provider: 'huggingface' },
  { id: 'stabilityai/stable-diffusion-xl-base-1.0', name: 'SDXL 1.0 (Classic)', provider: 'huggingface' },
  { id: 'runwayml/stable-diffusion-v1-5', name: 'SD 1.5 (Fast)', provider: 'huggingface' },
  { id: 'pollinations/flux', name: 'Flux Pro (Pollinations)', provider: 'huggingface' }, // Using HF as a proxy category for now or I can add POLLINATIONS
  { id: 'pollinations/turbo', name: 'Turbo Speed (Pollinations)', provider: 'huggingface' }
];

const VIDEO_MODELS: Model[] = [
  { id: 'veo-3.1-fast-generate-preview', name: 'Veo 3.1 Fast (Preview)', provider: 'gemini' },
  { id: 'veo-3.1-high-quality', name: 'Veo 3.1 HQ (Cine)', provider: 'gemini' }
];

const MissingKeyToast: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed z-50 max-w-sm duration-300 top-4 right-4 animate-in slide-in-from-right fade-in">
    <div className="relative flex gap-3 p-4 border shadow-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-amber-500/30 rounded-xl">
      <div className="p-2 rounded-lg bg-amber-500/10 h-fit shrink-0">
        <AlertTriangle size={20} className="text-amber-500" />
      </div>
      <div>
        <h4 className="mb-1 text-sm font-medium text-gray-900 dark:text-white">Setup Required</h4>
        <p className="mb-2 text-xs leading-relaxed text-gray-500 dark:text-zinc-400">
          API keys are missing from your environment. The app has switched to <b>Fallback Mode</b> (Puter.js).
        </p>
        <p className="text-gray-600 dark:text-zinc-500 text-[10px] font-mono bg-gray-100 dark:bg-black/30 p-1.5 rounded border border-gray-200 dark:border-white/5">
          See .env.example
        </p>
      </div>
      <button
        onClick={onClose}
        className="absolute p-1 text-gray-400 transition-colors top-2 right-2 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('chat');
  const [currentModelId, setCurrentModelId] = useState<string>(CHAT_MODELS[0].id);
  const [currentImageModelId, setCurrentImageModelId] = useState<string>(IMAGE_MODELS[0].id);
  const [currentVideoModelId, setCurrentVideoModelId] = useState<string>(VIDEO_MODELS[0].id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>(Date.now().toString());
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [darkMode, setDarkMode] = useState(true);
  const [showMissingKeyToast, setShowMissingKeyToast] = useState(false);
  const [isLiveModeOpen, setIsLiveModeOpen] = useState(false);
  const [userApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY || '');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize and check API Key
  useEffect(() => {
    // Access keys safely via optional chaining on import.meta.env
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
    const openRouterKey = import.meta.env.VITE_OPENROUTER_KEY;

    // Check if keys are placeholders or missing
    const isGeminiMissing = !geminiKey || geminiKey.includes("PLACE_YOUR_KEY") || geminiKey.includes("ENTER_YOUR_KEY");
    const isOpenRouterMissing = !openRouterKey || openRouterKey.includes("PLACE_YOUR_KEY") || openRouterKey.includes("ENTER_YOUR_KEY");

    if (isGeminiMissing && isOpenRouterMissing) {
      setCurrentModelId('puter-chat');
      setShowMissingKeyToast(true);
    } else if (isGeminiMissing && !isOpenRouterMissing) {
      // Default to an OpenRouter model if only Gemini is missing
      setCurrentModelId('deepseek/deepseek-v3:free');
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

      const selectedModel = CHAT_MODELS.find(m => m.id === currentModelId);
      const provider = selectedModel?.provider || 'puter';

      console.info(`[Model Router] Routing request via provider: ${provider.toUpperCase()}, modelId: ${currentModelId || 'default'}`);

      if (provider === 'gemini') {
        await sendMessageToGemini({ text, file, signal: abortControllerRef.current.signal }, onStream);
      } else if (provider === 'openrouter') {
        await sendMessageToOpenRouter({ text, file, modelId: currentModelId, signal: abortControllerRef.current.signal }, onStream);
      } else if (provider === 'huggingface') {
        await sendMessageToHuggingFace(
          { text, modelId: currentModelId, signal: abortControllerRef.current.signal },
          onStream,
          (status) => {
            // Handle 503 status updates by injecting a system message or updating the last bot message temporary
            setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: `_${status}_` } : m));
          }
        );
      } else if (provider === 'groq') {
        await sendMessageToGroq({ text, file, modelId: currentModelId, signal: abortControllerRef.current.signal }, onStream);
      } else {
          try {
            console.info('[Lazy Load] Loading Puter service...');
            const puterModule = await import('./services/puter');
            await puterModule.sendMessageToPuter(
              { text, file },
              onStream
            );
          } catch (err) {
            console.error('[Puter] Failed to load service:', err);

            throw new Error(
              err instanceof Error
                ? err.message
                : 'Failed to initialize Puter service'
            );
          }
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
            ? {
              ...m,
              content: `⚠️ Neural Link Interrupted. Attempting fallback... \n\nError: ${error.message || "Service unavailable."}`,
              isStreaming: false,
              isError: true
            }
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

  const pinSession = (id: string) => {
    setSessions(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, pinned: !s.pinned } : s);
      // Sort: Pinned first, then by lastUpdated desc
      return updated.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return b.lastUpdated - a.lastUpdated;
      });
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
    const session = sessions.find(s => s.id === currentSessionId);
    if (session) {
      exportToPDF(session);
    }
  };

  // Contextual Model Helpers
  const currentTabModels = activeTab === 'chat' ? CHAT_MODELS : activeTab === 'image' ? IMAGE_MODELS : VIDEO_MODELS;
  const currentTabModelId = activeTab === 'chat' ? currentModelId : activeTab === 'image' ? currentImageModelId : currentVideoModelId;
  const setTabModelId = activeTab === 'chat' ? setCurrentModelId : activeTab === 'image' ? setCurrentImageModelId : setCurrentVideoModelId;
  const currentTabSelectedModelName = currentTabModels.find(m => m.id === currentTabModelId)?.name || 'Neural Link';

  return (
    <div className={`flex h-screen w-full transition-colors duration-300 font-outfit ${darkMode ? 'dark bg-black' : 'bg-gray-50'} overflow-hidden`}>
      {/* Toast Notification */}
      {showMissingKeyToast && <MissingKeyToast onClose={() => setShowMissingKeyToast(false)} />}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden backdrop-blur-sm"
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
          onPinSession={pinSession}
          currentModelId={currentTabModelId}
          onSetModelId={setTabModelId}
          availableModels={currentTabModels}
          onCloseMobile={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="relative flex flex-col flex-1 w-full h-full">
        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          provider={currentTabModels.find(m => m.id === currentTabModelId)?.provider || 'puter'}
          modelName={currentTabSelectedModelName}
          onClearChat={clearCurrentChat}
          onDownloadChat={downloadCurrentChat}
          onLiveMode={() => setIsLiveModeOpen(true)}
          currentSession={sessions.find(s => s.id === currentSessionId)}
          darkMode={darkMode}
          toggleTheme={toggleTheme}
        />

        {/* Content Area */}
        <div className={`flex-1 overflow-hidden flex flex-col relative transition-colors duration-300 ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-700">
                <MessageList
                  messages={messages}
                  onDelete={handleMessageDelete}
                  onRegenerate={handleRegenerate}
                  onEdit={handleMessageEdit}
                  onFeedback={handleFeedback}
                />
                <div ref={messagesEndRef} className="h-4" />
              </div>
              <div className={`p-4 transition-colors duration-300 ${darkMode ? 'bg-gradient-to-t from-black to-transparent' : 'bg-white'}`}>
                <ChatInput onSendMessage={handleSendMessage} onStop={handleStop} loading={loading} />
                <p className={`text-center text-[10px] mt-2 ${darkMode ? 'text-zinc-600' : 'text-zinc-400'}`}>
                  Models can hallucinate. Check important info.
                </p>
              </div>
            </>
          )}

          {activeTab === 'image' && (
            <div className="flex-1 overflow-y-auto">
              <ImageGenerator selectedModelId={currentImageModelId} />
            </div>
          )}
          {activeTab === 'video' && (
            <div className="flex-1 overflow-y-auto">
              <VideoGenerator selectedModelId={currentVideoModelId} />
            </div>
          )}
        </div>
      </div>

      <LiveMasteryModal
        isOpen={isLiveModeOpen}
        onClose={() => setIsLiveModeOpen(false)}
        apiKey={userApiKey}
      />
    </div>
  );
};

export default App;

