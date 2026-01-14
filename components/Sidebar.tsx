import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, AppTab, Model, AIProvider } from '../types';
import { MessageSquare, Plus, Image, Video, MoreHorizontal, Edit2, Trash, Download, X, Check, ChevronDown, Github, Linkedin, Globe } from 'lucide-react';
import jsPDF from 'jspdf';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onNewChat: () => void;
  onLoadSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  currentModelId: string;
  onSetModelId: (id: string) => void;
  availableModels: Model[];
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  activeTab,
  setActiveTab,
  onNewChat,
  onLoadSession,
  onRenameSession,
  onDeleteSession,
  currentModelId,
  onSetModelId,
  availableModels,
  onCloseMobile
}) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownload = (session: ChatSession) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Chat Export: ${session.title || 'Untitled'}`, 10, 10);
    doc.setFontSize(12);
    
    let y = 20;
    session.messages.forEach(msg => {
      const role = msg.role.toUpperCase();
      const text = doc.splitTextToSize(`${role}: ${msg.content}`, 180);
      if (y + text.length * 7 > 280) { doc.addPage(); y = 10; }
      doc.text(text, 10, y);
      y += text.length * 7 + 5;
    });
    doc.save(`chat-${session.id}.pdf`);
    setMenuOpenId(null);
  };

  const startRename = (session: ChatSession) => {
    setEditingId(session.id);
    setEditTitle(session.title || session.preview);
    setMenuOpenId(null);
  };

  const saveRename = () => {
    if (editingId) {
      onRenameSession(editingId, editTitle);
      setEditingId(null);
    }
  };

  // Group models by provider for display
  const groupedModels = availableModels.reduce((acc, model) => {
    const group = model.provider === 'gemini' ? 'Native Gemini' : 
                  model.provider === 'openrouter' ? 'OpenRouter Free' : 'Fallback';
    if (!acc[group]) acc[group] = [];
    acc[group].push(model);
    return acc;
  }, {} as Record<string, Model[]>);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] border-r border-gray-200 dark:border-white/10 transition-colors duration-300">
      {/* Mobile Close */}
      <div className="md:hidden flex justify-end p-4 pb-0">
        <button onClick={onCloseMobile} className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Main Tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5">
          {[
            { id: 'chat', icon: MessageSquare, label: 'Chat' },
            { id: 'image', icon: Image, label: 'Imagine' },
            { id: 'video', icon: Video, label: 'Video' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AppTab)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all gap-1 ${
                activeTab === tab.id 
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-zinc-800 dark:text-white' 
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/50 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Model Selector */}
        {activeTab === 'chat' && (
          <div className="relative group">
            <select
              value={currentModelId}
              onChange={(e) => onSetModelId(e.target.value)}
              className="w-full appearance-none bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs py-2.5 px-3 pr-8 rounded-lg focus:outline-none focus:border-indigo-500/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {Object.entries(groupedModels).map(([group, models]) => (
                <optgroup key={group} label={group} className="bg-white dark:bg-zinc-900 text-gray-500 dark:text-gray-400">
                  {models.map(model => (
                    <option key={model.id} value={model.id} className="text-gray-900 dark:text-white">
                      {model.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}

        {activeTab === 'chat' && (
          <button
            onClick={onNewChat}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all font-medium shadow-lg shadow-indigo-500/20 dark:shadow-indigo-900/20"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-zinc-800">
        {activeTab === 'chat' ? (
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Recent Chats</h3>
            {sessions.map(session => (
              <div 
                key={session.id} 
                className={`group relative flex items-center gap-3 w-full p-3 rounded-xl text-sm transition-all cursor-pointer border ${
                  currentSessionId === session.id
                    ? 'bg-gray-100 border-gray-200 text-gray-900 dark:bg-zinc-800/80 dark:border-white/10 dark:text-white shadow-sm'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
                }`}
                onClick={() => onLoadSession(session.id)}
              >
                <MessageSquare size={16} className="shrink-0 opacity-70" />
                
                {editingId === session.id ? (
                  <div className="flex-1 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-white dark:bg-black/50 border border-indigo-500/50 rounded px-1 text-gray-900 dark:text-white text-xs py-1 focus:outline-none"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && saveRename()}
                    />
                    <button onClick={saveRename} className="text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300"><Check size={14} /></button>
                  </div>
                ) : (
                  <span className="truncate flex-1 font-medium">{session.title || session.preview || "Empty Chat"}</span>
                )}

                {/* Context Menu Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === session.id ? null : session.id);
                  }}
                  className={`p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:text-gray-500 dark:hover:text-white dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity ${menuOpenId === session.id ? 'opacity-100' : ''}`}
                >
                  <MoreHorizontal size={14} />
                </button>

                {/* Dropdown Menu */}
                {menuOpenId === session.id && (
                  <div 
                    ref={menuRef}
                    className="absolute right-2 top-10 z-50 w-32 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                    onClick={e => e.stopPropagation()}
                  >
                    <button onClick={() => startRename(session)} className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/10 flex items-center gap-2">
                      <Edit2 size={12} /> Rename
                    </button>
                    <button onClick={() => handleDownload(session)} className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/10 flex items-center gap-2">
                      <Download size={12} /> Download
                    </button>
                    <button onClick={() => { onDeleteSession(session.id); setMenuOpenId(null); }} className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center gap-2">
                      <Trash size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-center px-4">
             <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
               {activeTab === 'image' ? <Image size={24} /> : <Video size={24} />}
             </div>
             <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
               {activeTab === 'image' ? 'Create stunning visuals' : 'Generate creative videos'}
             </p>
             <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
               Select this tab to use the generator tool.
             </p>
          </div>
        )}
      </div>

      {/* Social Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-transparent">
        <div className="flex justify-center gap-6">
          <a href="https://vinaalr.netlify.app/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 transition-colors" title="Portfolio">
            <Globe size={18} />
          </a>
          <a href="https://www.linkedin.com/in/vinaal/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 dark:text-gray-500 dark:hover:text-blue-500 transition-colors" title="LinkedIn">
            <Linkedin size={18} />
          </a>
          <a href="https://github.com/Dark-Vinaal" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black dark:text-gray-500 dark:hover:text-white transition-colors" title="GitHub">
            <Github size={18} />
          </a>
        </div>
      </div>
    </div>
  );
};