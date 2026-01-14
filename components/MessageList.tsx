import React from 'react';
import { Message } from '../types';
import { Bot, User, FileText } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center opacity-60">
        <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mb-4 border border-glassBorder">
          <Bot size={32} className="text-indigo-400" />
        </div>
        <h2 className="text-xl font-semibold mb-2 text-white">How can I help you today?</h2>
        <p className="max-w-md text-sm">
          I can analyze documents, generate code, and answer complex questions using Gemini 1.5 Flash or Puter.js.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {messages.map((msg) => (
        <div 
          key={msg.id} 
          className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === 'assistant' && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg mt-1">
              <Bot size={16} className="text-white" />
            </div>
          )}

          <div 
            className={`max-w-[85%] rounded-2xl p-4 shadow-sm backdrop-blur-sm border ${
              msg.role === 'user' 
                ? 'bg-[#2a2a2a]/60 border-glassBorder text-white rounded-tr-sm' 
                : 'bg-glass border-glassBorder text-gray-100 rounded-tl-sm'
            } ${msg.isError ? 'border-red-500/50 bg-red-900/10' : ''}`}
          >
            {msg.file && (
               <div className="flex items-center gap-2 mb-3 p-2 bg-black/20 rounded-lg text-xs text-indigo-300 border border-indigo-500/20">
                 <FileText size={14} />
                 <span>Attached: {msg.file.name}</span>
               </div>
            )}
            
            <div className="whitespace-pre-wrap leading-relaxed text-sm">
              {msg.content}
              {msg.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 align-middle bg-indigo-500 animate-pulse" />
              )}
            </div>
          </div>

          {msg.role === 'user' && (
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-1">
              <User size={16} className="text-gray-300" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};