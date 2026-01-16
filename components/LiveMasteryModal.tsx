import React, { useEffect, useState, useRef } from 'react';
import { X, Mic, MicOff, Power, Activity } from 'lucide-react';
import { GeminiLiveClient } from '../services/liveGemini';

interface LiveMasteryModalProps {
  apiKey: string;
  isOpen: boolean;
  onClose: () => void;
}

export const LiveMasteryModal: React.FC<LiveMasteryModalProps> = ({ apiKey, isOpen, onClose }) => {
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'speaking'>('disconnected');
  const [isMuted, setIsMuted] = useState(false);
  const clientRef = useRef<GeminiLiveClient | null>(null);

  useEffect(() => {
    if (isOpen && apiKey) {
      if (!clientRef.current) {
        clientRef.current = new GeminiLiveClient();

        clientRef.current.on('connected', () => setStatus('connected'));
        clientRef.current.on('disconnected', () => setStatus('disconnected'));
        clientRef.current.on('speaking', (speaking) => setStatus(speaking ? 'speaking' : 'connected'));
        clientRef.current.on('error', (err) => console.error(err));
      }
      setStatus('connecting');
      clientRef.current.connect(apiKey);
    } else {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    }

    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [isOpen, apiKey]);

  const handleDisconnect = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] flex flex-col items-center justify-center">

        {/* Header */}
        <div className="absolute top-8 w-full px-8 flex justify-between items-center text-white/50">
          <div className="flex items-center gap-2">
            <Activity size={18} className={status === 'speaking' ? 'text-indigo-400 animate-pulse' : ''} />
            <span className="text-xs font-mono uppercase tracking-widest">
              Neural Bridge {status === 'connected' ? 'ACTIVE' : status === 'speaking' ? 'TRANSMITTING' : 'INITIALIZING...'}
            </span>
          </div>
          <button onClick={handleDisconnect} className="hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Visualizer */}
        <div className="relative flex items-center justify-center mb-12">
          {/* Core Orb */}
          <div className={`w-32 h-32 rounded-full blur-2xl transition-all duration-500
                ${status === 'connected' ? 'bg-indigo-500/20 scale-100' : ''}
                ${status === 'speaking' ? 'bg-pink-500/40 scale-150 animate-pulse' : ''}
                ${status === 'connecting' ? 'bg-yellow-500/20 scale-90' : ''}
                ${status === 'disconnected' ? 'bg-gray-500/10' : ''}
            `} />

          <div className={`absolute w-48 h-48 border border-white/10 rounded-full animate-[spin_10s_linear_infinite] transition-opacity duration-500 ${status === 'speaking' ? 'opacity-100 border-pink-500/30' : 'opacity-20'}`} />
          <div className={`absolute w-64 h-64 border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse] transition-opacity duration-500 ${status === 'speaking' ? 'opacity-100 border-indigo-500/30' : 'opacity-20'}`} />

          <div className="absolute z-10 flex flex-col items-center gap-4">
            <div className={`text-4xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 transition-all duration-300 ${status === 'speaking' ? 'scale-110' : ''}`}>
              DARK AI
            </div>
            <div className="text-xs text-indigo-400 font-mono">
              {status === 'speaking' ? 'Processing Voice Stream...' : 'Listening...'}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-4 rounded-full border transition-all duration-300 ${isMuted ? 'bg-red-500/20 border-red-500/50 text-red-100' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
          >
            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          </button>

          <button
            onClick={handleDisconnect}
            className="p-4 rounded-full bg-red-900/20 border border-red-500/30 text-red-400 hover:bg-red-600 hover:text-white hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] transition-all duration-300"
          >
            <Power size={24} />
          </button>
        </div>

      </div>
    </div>
  );
};
