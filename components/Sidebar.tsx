import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, AppTab, AIProvider } from '../types';
import { MessageSquare, Plus, Image, Video, MoreHorizontal, Edit2, Trash, Download, X, Check } from 'lucide-react';
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
  provider: AIProvider;
  onSetProvider: (p: AIProvider) => void;
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
  provider,
  onSetProvider,
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

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-white/10">
      {/* Mobile Close */}
      <div className="md:hidden flex justify-end p-4 pb-0">
        <button onClick={onCloseMobile} className="p-2 text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Main Tabs */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
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
                  ? 'bg-zinc-800 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Model Toggle */}
        <div className="flex items-center justify-between bg-zinc-900 border border-white/10 rounded-lg p-1">
          <button
            onClick={() => onSetProvider('gemini')}
            className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
              provider === 'gemini' ? 'bg-indigo-600/20 text-indigo-300' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Gemini
          </button>
          <button
            onClick={() => onSetProvider('puter')}
            className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${
              provider === 'puter' ? 'bg-indigo-600/20 text-indigo-300' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Puter.js
          </button>
        </div>

        {activeTab === 'chat' && (
          <button
            onClick={onNewChat}
            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all font-medium shadow-lg shadow-indigo-900/20"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-zinc-800">
        {activeTab === 'chat' ? (
          <div className="space-y-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Recent Chats</h3>
            {sessions.map(session => (
              <div 
                key={session.id} 
                className={`group relative flex items-center gap-3 w-full p-3 rounded-xl text-sm transition-all cursor-pointer border ${
                  currentSessionId === session.id
                    ? 'bg-zinc-800/80 border-white/10 text-white shadow-sm'
                    : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-gray-200'
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
                      className="w-full bg-black/50 border border-indigo-500/50 rounded px-1 text-white text-xs py-1 focus:outline-none"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && saveRename()}
                    />
                    <button onClick={saveRename} className="text-green-400 hover:text-green-300"><Check size={14} /></button>
                  </div>
                ) : (
                  <span className="truncate flex-1">{session.title || session.preview || "Empty Chat"}</span>
                )}

                {/* Context Menu Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(menuOpenId === session.id ? null : session.id);
                  }}
                  className={`p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity ${menuOpenId === session.id ? 'opacity-100' : ''}`}
                >
                  <MoreHorizontal size={14} />
                </button>

                {/* Dropdown Menu */}
                {menuOpenId === session.id && (
                  <div 
                    ref={menuRef}
                    className="absolute right-2 top-10 z-50 w-32 bg-zinc-900 border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                    onClick={e => e.stopPropagation()}
                  >
                    <button onClick={() => startRename(session)} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2">
                      <Edit2 size={12} /> Rename
                    </button>
                    <button onClick={() => handleDownload(session)} className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-white/10 flex items-center gap-2">
                      <Download size={12} /> Download
                    </button>
                    <button onClick={() => { onDeleteSession(session.id); setMenuOpenId(null); }} className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 flex items-center gap-2">
                      <Trash size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-center px-4">
             <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
               {activeTab === 'image' ? <Image size={24} /> : <Video size={24} />}
             </div>
             <p className="text-sm">
               {activeTab === 'image' ? 'Create stunning visuals' : 'Generate creative videos'}
             </p>
             <p className="text-xs text-gray-600 mt-1">
               Select this tab to use the generator tool.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};