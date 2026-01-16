import React, { useState, useRef, useEffect } from 'react';
import { ChatSession, AppTab, Model, AIProvider } from '../types';
import { MessageSquare, Plus, Image, Video, MoreHorizontal, Edit2, Trash, Download, X, Check, ChevronDown, Github, Linkedin, Globe, Pin, FileText, FileJson, FileType2 } from 'lucide-react';
import { exportToPDF, exportToWord, exportToText, exportToJSON } from '../utils/exportUtils';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onNewChat: () => void;
  onLoadSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onDeleteSession: (id: string) => void;
  onPinSession: (id: string) => void;
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
  onPinSession,
  currentModelId,
  onSetModelId,
  availableModels,
  onCloseMobile
}) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [exportOpenId, setExportOpenId] = useState<string | null>(null);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
        setExportOpenId(null);
        setModelSelectorOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = (type: 'pdf' | 'word' | 'txt' | 'json', session: ChatSession) => {
    if (type === 'pdf') exportToPDF(session);
    if (type === 'word') exportToWord(session);
    if (type === 'txt') exportToText(session);
    if (type === 'json') exportToJSON(session);
    setMenuOpenId(null);
    setExportOpenId(null);
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
    let group = 'Fallback';
    if (model.provider === 'gemini') group = 'Native Gemini';
    else if (model.provider === 'huggingface') group = 'Neural Core';
    else if (model.provider === 'openrouter') group = 'OpenRouter Free';

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
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg text-[10px] font-medium transition-all gap-1 ${activeTab === tab.id
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
          <div className="relative group" ref={menuRef}>
            <button
              onClick={(e) => { e.stopPropagation(); setModelSelectorOpen(!modelSelectorOpen); }}
              className="w-full flex items-center justify-between bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs py-2.5 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <span className="truncate mr-2">
                {availableModels.find(m => m.id === currentModelId)?.name || "Select Model"}
              </span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${modelSelectorOpen ? 'rotate-180' : ''}`} />
            </button>

            {modelSelectorOpen && (
              <div className="absolute top-full left-0 w-[120%] -ml-[10%] mt-2 z-50 max-h-80 overflow-y-auto rounded-xl border border-gray-200 dark:border-white/10 shadow-2xl bg-white/80 dark:bg-black/80 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200 p-2">
                {Object.entries(groupedModels).map(([group, models]) => (
                  <div key={group} className="mb-2 last:mb-0">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1.5 sticky top-0 bg-white/50 dark:bg-black/50 backdrop-blur-sm z-10 rounded">
                      {group}
                    </div>
                    {models.map(model => (
                      <button
                        key={model.id}
                        onClick={() => { onSetModelId(model.id); setModelSelectorOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg mb-0.5 transition-all duration-200 group/item relative overflow-hidden ${currentModelId === model.id
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] dark:hover:shadow-[0_0_15px_rgba(99,102,241,0.2)] hover:scale-105 hover:z-10 border border-transparent hover:border-indigo-500/30'
                          }`}
                      >
                        <span className="relative z-10">{model.name}</span>
                        {/* Glow Effect Layer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300" />
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
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
                className={`group relative flex items-center gap-3 w-full p-3 rounded-xl text-sm transition-all cursor-pointer border ${currentSessionId === session.id
                  ? 'bg-gray-100 border-gray-200 text-gray-900 dark:bg-zinc-800/80 dark:border-white/10 dark:text-white shadow-sm'
                  : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200'
                  }`}
                onClick={() => onLoadSession(session.id)}
              >
                {session.pinned && <Pin size={12} className="absolute top-2 left-2 text-indigo-500 fill-indigo-500 z-10" />}
                <MessageSquare size={16} className={`shrink-0 opacity-70 ${session.pinned ? 'text-indigo-500' : ''}`} />

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
                  className={`p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 ${menuOpenId === session.id ? 'opacity-100 bg-black/5 dark:bg-white/10' : ''}`}
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

                    <button onClick={() => { onPinSession(session.id); setMenuOpenId(null); }} className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/10 flex items-center gap-2">
                      <Pin size={12} className={session.pinned ? "fill-current" : ""} /> {session.pinned ? "Unpin Chat" : "Pin Chat"}
                    </button>

                    <div className="relative">
                      <button
                        onClick={(e) => { e.stopPropagation(); setExportOpenId(exportOpenId === session.id ? null : session.id); }}
                        className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/10 flex items-center justify-between group/export"
                      >
                        <span className="flex items-center gap-2"><Download size={12} /> Export</span>
                        <ChevronDown size={10} className={`transform transition-transform ${exportOpenId === session.id ? '-rotate-90' : ''}`} />
                      </button>
                      {/* Submenu */}
                      {exportOpenId === session.id && (
                        <div className="bg-gray-50 dark:bg-black/40 border-y border-gray-200 dark:border-white/5 py-1">
                          <button onClick={() => handleExport('pdf', session)} className="w-full text-left px-6 py-1.5 text-[10px] text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-white flex items-center gap-2">
                            <FileText size={10} /> PDF
                          </button>
                          <button onClick={() => handleExport('word', session)} className="w-full text-left px-6 py-1.5 text-[10px] text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 flex items-center gap-2">
                            <FileType2 size={10} /> Word
                          </button>
                          <button onClick={() => handleExport('txt', session)} className="w-full text-left px-6 py-1.5 text-[10px] text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 flex items-center gap-2">
                            <FileText size={10} /> Text
                          </button>
                          <button onClick={() => handleExport('json', session)} className="w-full text-left px-6 py-1.5 text-[10px] text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 flex items-center gap-2">
                            <FileJson size={10} /> JSON
                          </button>
                        </div>
                      )}
                    </div>

                    <button onClick={() => { onDeleteSession(session.id); setMenuOpenId(null); }} className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-gray-100 dark:border-white/5 group/delete">
                      <div className="p-1 rounded-full group-hover/delete:bg-red-500/10 transition-colors duration-300">
                        <Trash size={12} />
                      </div>
                      Delete
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