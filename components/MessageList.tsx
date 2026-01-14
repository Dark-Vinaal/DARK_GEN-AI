import React, { useState } from 'react';
import { Message } from '../types';
import { Bot, User, FileText, Copy, ThumbsUp, ThumbsDown, RotateCw, Trash2, Edit2, Check } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
  onEdit: (id: string, newContent: string) => void;
  onFeedback: (id: string, type: 'like' | 'dislike') => void;
}

export const MessageList: React.FC<MessageListProps> = ({ 
  messages, onDelete, onRegenerate, onEdit, onFeedback 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const startEdit = (msg: Message) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
  };

  const saveEdit = (id: string) => {
    onEdit(id, editContent);
    setEditingId(null);
  };

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-8 text-center opacity-60">
        <div className="w-20 h-20 bg-gray-100 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-gray-200 dark:border-white/5 shadow-2xl">
          <Bot size={40} className="text-indigo-500" />
        </div>
        <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white tracking-tight">DARK AI</h2>
        <p className="max-w-md text-sm leading-relaxed text-gray-500 dark:text-zinc-400">
          Your advanced AI assistant powered by Gemini. Ask me anything, generate code, or analyze documents.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`group flex gap-5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === 'assistant' && (
            <div className="w-10 h-10 rounded-full bg-white dark:bg-indigo-600/20 border border-gray-200 dark:border-indigo-500/30 flex items-center justify-center shrink-0 shadow-lg mt-1">
              <Bot size={20} className="text-indigo-600 dark:text-indigo-400" />
            </div>
          )}

          <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div 
              className={`rounded-2xl p-5 shadow-sm backdrop-blur-sm border relative ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 border-indigo-600 text-white rounded-tr-sm dark:bg-zinc-800 dark:border-zinc-700/50' 
                  : 'bg-white border-gray-200 text-gray-800 rounded-tl-sm dark:bg-zinc-900/50 dark:border-white/5 dark:text-gray-200'
              } ${msg.isError ? 'border-red-500/50 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-200' : ''}`}
            >
              {msg.file && (
                 <div className={`flex items-center gap-2 mb-4 p-3 rounded-xl text-xs border ${
                    msg.role === 'user' 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-black/20 dark:border-indigo-500/20 dark:text-indigo-300'
                 }`}>
                   <FileText size={16} />
                   <span className="font-medium">Attached: {msg.file.name}</span>
                 </div>
              )}
              
              {editingId === msg.id ? (
                <div className="w-full min-w-[300px]">
                  <textarea 
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-white/10 dark:bg-black/30 border border-white/20 dark:border-indigo-500/50 rounded-lg p-2 text-inherit text-sm focus:outline-none min-h-[100px]"
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs opacity-70 hover:opacity-100">Cancel</button>
                    <button onClick={() => saveEdit(msg.id)} className="px-3 py-1 text-xs bg-white text-indigo-600 rounded-md shadow-sm font-medium hover:bg-gray-100 dark:bg-indigo-600 dark:text-white dark:hover:bg-indigo-500">Save</button>
                  </div>
                </div>
              ) : (
                <div className="whitespace-pre-wrap leading-7 text-[15px]">
                  {msg.content}
                  {msg.isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 align-middle bg-current animate-pulse opacity-70" />
                  )}
                </div>
              )}
            </div>

            {/* Message Actions */}
            {!msg.isStreaming && !editingId && (
              <div className={`flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity px-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <button onClick={() => handleCopy(msg.content)} className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:text-zinc-500 dark:hover:text-white dark:hover:bg-white/10 rounded-md transition-colors" title="Copy">
                  <Copy size={14} />
                </button>
                
                {msg.role === 'user' && (
                  <button onClick={() => startEdit(msg)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:text-zinc-500 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 rounded-md transition-colors" title="Edit">
                    <Edit2 size={14} />
                  </button>
                )}

                {msg.role === 'assistant' && (
                  <>
                    <button onClick={() => onRegenerate(msg.id)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:text-zinc-500 dark:hover:text-indigo-400 dark:hover:bg-indigo-500/10 rounded-md transition-colors" title="Regenerate">
                      <RotateCw size={14} />
                    </button>
                    <div className="w-px h-3 bg-gray-200 dark:bg-zinc-800 mx-1" />
                    <button 
                      onClick={() => onFeedback(msg.id, 'like')} 
                      className={`p-1.5 rounded-md transition-colors ${msg.liked ? 'text-green-500 dark:text-green-400' : 'text-gray-400 hover:text-green-500 hover:bg-green-50 dark:text-zinc-500 dark:hover:text-green-400 dark:hover:bg-green-500/10'}`}
                    >
                      <ThumbsUp size={14} />
                    </button>
                    <button 
                      onClick={() => onFeedback(msg.id, 'dislike')} 
                      className={`p-1.5 rounded-md transition-colors ${msg.disliked ? 'text-red-500 dark:text-red-400' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:text-zinc-500 dark:hover:text-red-400 dark:hover:bg-red-500/10'}`}
                    >
                      <ThumbsDown size={14} />
                    </button>
                  </>
                )}
                
                <button onClick={() => onDelete(msg.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:text-zinc-500 dark:hover:text-red-400 dark:hover:bg-red-500/10 rounded-md transition-colors" title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {msg.role === 'user' && (
            <div className="w-10 h-10 rounded-full bg-gray-200 border border-gray-300 dark:bg-zinc-800 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-1">
              <User size={20} className="text-gray-600 dark:text-zinc-400" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};