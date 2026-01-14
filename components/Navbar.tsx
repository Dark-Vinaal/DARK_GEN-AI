import React from 'react';
import { Menu, Zap, Download, Trash2, Moon, Sun, AlertTriangle } from 'lucide-react';
import { AIProvider } from '../types';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  provider: AIProvider;
  modelName: string;
  onClearChat: () => void;
  onDownloadChat: () => void;
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
  darkMode,
  toggleTheme
}) => {
  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-zinc-900/80 backdrop-blur-md z-10 shrink-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-white flex items-center gap-2">
              DARK AI
              <span className="text-xs font-normal text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full bg-indigo-500/10">
                {modelName}
              </span>
            </span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {!process.env.API_KEY || process.env.API_KEY === 'ENTER_YOUR_KEY_HERE' ? (
             <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20 mr-2">
               <AlertTriangle size={12} />
               <span className="hidden sm:inline">Fallback Mode</span>
             </div>
        ) : null}

        <button 
          onClick={onClearChat}
          className="p-2.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          title="Clear Chat"
        >
          <Trash2 size={18} />
        </button>

        <button 
          onClick={onDownloadChat}
          className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          title="Download PDF"
        >
          <Download size={18} />
        </button>

        <div className="w-px h-6 bg-white/10 mx-1"></div>

        <button 
          onClick={toggleTheme}
          className="p-2.5 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-all"
          title="Toggle Theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
};