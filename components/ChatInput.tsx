import React, { useState, useRef } from 'react';
import { Send, Mic, Paperclip, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (text: string, file?: File) => void;
  loading: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, loading }) => {
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
    if (!SpeechRecognition) {
      alert("Browser does not support speech recognition.");
      return;
    }

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

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      {/* File Preview Bubble */}
      {file && (
        <div className="absolute -top-12 left-0 bg-gray-800 border border-gray-700 text-white px-3 py-1.5 rounded-full text-xs flex items-center gap-2 shadow-lg animate-in slide-in-from-bottom-2">
          {file.type.startsWith('image/') ? <ImageIcon size={12} /> : <FileText size={12} />}
          <span className="max-w-[150px] truncate">{file.name}</span>
          <button 
            type="button" 
            onClick={() => setFile(null)}
            className="hover:text-red-400 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div className="bg-[#1e1e1e] border border-glassBorder rounded-2xl flex items-center p-2 shadow-2xl focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
        {/* File Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          title="Upload File"
        >
          <Paperclip size={20} />
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className="hidden" 
          accept="image/*,.pdf,.txt,.md"
        />

        {/* Text Input */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isListening ? "Listening..." : "Message Gemini..."}
          className="flex-1 bg-transparent border-none focus:outline-none text-white px-3 placeholder-gray-500"
          disabled={loading}
        />

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleVoice}
            className={`p-2.5 rounded-xl transition-colors ${
              isListening 
                ? 'text-red-500 bg-red-500/10 animate-pulse' 
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Mic size={20} />
          </button>

          <button
            type="submit"
            disabled={(!text.trim() && !file) || loading}
            className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${
              text.trim() || file 
                ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </form>
  );
};