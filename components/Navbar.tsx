import React from 'react';
import { Menu, Zap, Download, Trash2, Moon, Sun, AlertTriangle, ChevronDown, FileText, FileJson, FileType2 } from 'lucide-react';
import { AIProvider, ChatSession } from '../types';
import { exportToPDF, exportToWord, exportToText, exportToJSON } from '../utils/exportUtils';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  provider: AIProvider;
  modelName: string;
  onClearChat: () => void;
  onDownloadChat: () => void;
  onLiveMode: () => void;
  currentSession?: ChatSession;
  darkMode: boolean;
  toggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  provider,
  modelName,
  onClearChat,
  onDownloadChat,
  onLiveMode,
  currentSession,
  darkMode,
  toggleTheme
}) => {
  const [exportOpen, setExportOpen] = React.useState(false);

  const handleExport = (type: 'pdf' | 'word' | 'txt' | 'json') => {
    if (!currentSession) return;
    if (type === 'pdf') exportToPDF(currentSession);
    if (type === 'word') exportToWord(currentSession);
    if (type === 'txt') exportToText(currentSession);
    if (type === 'json') exportToJSON(currentSession);
    setExportOpen(false);
  };

  return (
    <header className="h-16 border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-6 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md z-10 shrink-0 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              DARK AI
              <span className="text-xs font-normal text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10">
                {modelName}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {provider === 'puter' ? (
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-400/20 mr-2">
            <AlertTriangle size={12} />
            <span className="hidden sm:inline">Fallback Mode</span>
          </div>
        ) : null}

        <button
          onClick={onClearChat}
          className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
          title="Clear Chat"
        >
          <Trash2 size={18} />
        </button>

        <div className="relative">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-all flex items-center gap-1"
            title="Export Chat"
          >
            <Download size={18} />
            <ChevronDown size={12} />
          </button>

          {exportOpen && currentSession && (
            <div className="absolute right-0 top-12 z-50 w-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-xs text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/10 hover:scale-105 transition-all flex items-center gap-2 group">
                <FileText size={14} className="group-hover:text-indigo-500 group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all" /> Export Content
              </button>
              <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />
              <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-500 hover:scale-105 transition-all flex items-center gap-2 group">
                <FileText size={12} className="group-hover:drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]" /> PDF
              </button>
              <button onClick={() => handleExport('word')} className="w-full text-left px-4 py-2 text-xs text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 hover:scale-105 transition-all flex items-center gap-2 group">
                <FileType2 size={12} className="group-hover:drop-shadow-[0_0_5px_rgba(37,99,235,0.5)]" /> Word
              </button>
              <button onClick={() => handleExport('txt')} className="w-full text-left px-4 py-2 text-xs text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 hover:scale-105 transition-all flex items-center gap-2 group">
                <FileText size={12} className="group-hover:drop-shadow-[0_0_5px_rgba(22,163,74,0.5)]" /> Text File
              </button>
              <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-2 text-xs text-gray-500 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 hover:scale-105 transition-all flex items-center gap-2 group">
                <FileJson size={12} className="group-hover:drop-shadow-[0_0_5px_rgba(202,138,4,0.5)]" /> JSON
              </button>
            </div>
          )}
          {exportOpen && !currentSession && (
            <div className="absolute right-0 top-12 z-50 w-40 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-3 text-xs text-center text-gray-500">
              No active chat
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-white/10 mx-1"></div>

        <button
          onClick={onLiveMode}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-xs font-semibold shadow-[0_0_15px_rgba(99,102,241,0.5)] hover:shadow-[0_0_20px_rgba(99,102,241,0.7)] transition-all hover:scale-105 active:scale-95 group animate-pulse"
        >
          <Zap size={12} className="fill-current" />
          <span>LIVE</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-400/10 rounded-lg transition-all"
          title="Toggle Theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};