import React, { useState, useRef } from 'react';
import { Send, Mic, Paperclip, X, FileText, Image as ImageIcon, Loader2, Square } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string, file?: File) => void;
  onStop: () => void;
  loading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onStop, loading }) => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !file) || loading) return;
    onSendMessage(text, file || undefined);
    setText('');
    setFile(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      setText(prev => prev + (prev ? ' ' : '') + speechResult);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto px-2 md:px-0">
      {/* File Preview */}
      {file && (
        <div className="absolute -top-14 left-4 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white px-3 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg animate-in slide-in-from-bottom-2">
          {file.type.startsWith('image/') ? <ImageIcon size={14} className="text-indigo-500 dark:text-indigo-400" /> : <FileText size={14} className="text-indigo-500 dark:text-indigo-400" />}
          <span className="max-w-[120px] md:max-w-[150px] truncate font-medium">{file.name}</span>
          <button
            type="button"
            onClick={() => setFile(null)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors ml-1"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="bg-white dark:bg-zinc-900 border border-cyan-500/50 dark:border-cyan-400/50 rounded-[1.5rem] md:rounded-[2rem] flex items-center p-1 md:p-2 shadow-[0_0_15px_rgba(6,182,212,0.3)] dark:shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] dark:hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] focus-within:ring-2 focus-within:ring-cyan-400/50 focus-within:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all duration-300">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 md:p-3 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 dark:text-gray-400 dark:hover:text-cyan-400 dark:hover:bg-cyan-900/20 rounded-full transition-colors shrink-0"
          >
            <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.txt,.md"
          />

          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isListening ? "Listening..." : "What's up, What's on your mind today?"}
            className="flex-1 bg-transparent border-none focus:outline-none text-gray-900 dark:text-white px-2 md:px-4 placeholder-gray-400 dark:placeholder-zinc-500 h-9 md:h-10 text-sm md:text-base min-w-0"
            disabled={loading}
          />

          <div className="flex items-center gap-0.5 md:gap-1 pr-1 shrink-0">
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-2 md:p-3 rounded-full transition-colors ${isListening
                ? 'text-red-500 bg-red-50 dark:bg-red-500/10 animate-pulse'
                : 'text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 dark:text-gray-400 dark:hover:text-cyan-400 dark:hover:bg-cyan-900/20'
                }`}
            >
              <Mic className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {loading ? (
              <button
                type="button"
                onClick={onStop}
                className="p-2 md:p-3 bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-white rounded-full hover:bg-gray-300 dark:hover:bg-zinc-700 transition-colors shadow-sm"
                title="Stop generation"
              >
                <Square size={14} className="fill-current w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!text.trim() && !file}
                className={`p-2 md:p-3 rounded-full transition-all flex items-center justify-center ${text.trim() || file
                  ? 'bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:bg-cyan-400 hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(6,182,212,0.7)]'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 cursor-not-allowed'
                  }`}
              >
                <Send className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};