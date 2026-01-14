import React from 'react';
import { ChatSession, AIProvider } from '../types';
import { MessageSquare, Plus, Download, Moon, Sun, Monitor, X } from 'lucide-react';
import jsPDF from 'jspdf';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string;
  onNewChat: () => void;
  onLoadSession: (id: string) => void;
  provider: AIProvider;
  onSetProvider: (p: AIProvider) => void;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sessions,
  currentSessionId,
  onNewChat,
  onLoadSession,
  provider,
  onSetProvider,
  onCloseMobile
}) => {
  
  const handleDownload = () => {
    const doc = new jsPDF();
    const currentSession = sessions.find(s => s.id === currentSessionId);
    
    if (!currentSession) return;

    doc.setFontSize(16);
    doc.text("Chat Export", 10, 10);
    doc.setFontSize(12);
    
    let y = 20;
    currentSession.messages.forEach(msg => {
      const role = msg.role.toUpperCase();
      const text = doc.splitTextToSize(`${role}: ${msg.content}`, 180);
      
      if (y + text.length * 7 > 280) {
        doc.addPage();
        y = 10;
      }
      
      doc.text(text, 10, y);
      y += text.length * 7 + 5;
    });

    doc.save(`chat-export-${currentSessionId}.pdf`);
  };

  return (
    <div className="flex flex-col h-full p-4">
      {/* Mobile Close Button */}
      <div className="md:hidden flex justify-end mb-4">
        <button onClick={onCloseMobile} className="p-2 text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition-all shadow-lg hover:shadow-indigo-500/20 mb-6 font-medium"
      >
        <Plus size={18} />
        <span>New Chat</span>
      </button>

      {/* Provider Toggle */}
      <div className="mb-6 bg-glass p-1 rounded-lg flex border border-glassBorder">
        <button
          onClick={() => onSetProvider('gemini')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
            provider === 'gemini' 
              ? 'bg-gray-700 text-white shadow-sm' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Gemini Flash
        </button>
        <button
          onClick={() => onSetProvider('puter')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
            provider === 'puter' 
              ? 'bg-blue-900/50 text-blue-100 shadow-sm' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Puter.js
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-800">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">History</h3>
        <div className="space-y-1">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => onLoadSession(session.id)}
              className={`w-full text-left p-3 rounded-lg text-sm transition-all flex items-start gap-3 group ${
                currentSessionId === session.id
                  ? 'bg-glass border border-glassBorder text-white'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`}
            >
              <MessageSquare size={16} className="mt-0.5 shrink-0" />
              <span className="truncate">{session.preview || 'Empty Chat'}</span>
            </button>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-10 text-gray-600 text-sm">
              No chat history yet.
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-4 pt-4 border-t border-glassBorder space-y-2">
        <button 
          onClick={handleDownload}
          className="flex items-center gap-3 w-full p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
        >
          <Download size={18} />
          <span>Download Chat</span>
        </button>
        <div className="flex items-center gap-3 w-full p-2.5 rounded-lg text-gray-400 text-sm">
           <Monitor size={18} />
           <span>System: Dark Mode</span>
        </div>
      </div>
    </div>
  );
};