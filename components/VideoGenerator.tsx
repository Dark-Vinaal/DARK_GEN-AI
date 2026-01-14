import React, { useState } from 'react';
import { generateVideoWithVeo } from '../services/gemini';
import { Loader2, Download, Video, Film } from 'lucide-react';

export const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultVideo, setResultVideo] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError('');
    setResultVideo(null);

    try {
      // NOTE: Video generation takes time.
      const videoUri = await generateVideoWithVeo(prompt);
      setResultVideo(videoUri);
    } catch (err: any) {
      setError(err.message || "Failed to generate video. Ensure you have a paid key with Veo access.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto w-full p-6 overflow-y-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Film className="text-indigo-400" />
          Video Studio
        </h2>
        <p className="text-zinc-400">Generate 720p videos with Veo 3.1</p>
      </div>

      <div className="flex flex-col gap-8 items-center">
        {/* Controls */}
        <div className="w-full max-w-2xl space-y-4 bg-zinc-900/50 p-6 rounded-3xl border border-white/5">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A cinematic drone shot of a cyberpunk city at night..."
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500/50 h-24 resize-none"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !prompt}
              className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Video size={20} />}
              Generate Video
            </button>
          </form>
          {error && <div className="text-red-400 text-sm bg-red-900/10 p-3 rounded-lg border border-red-500/20">{error}</div>}
        </div>

        {/* Result */}
        {resultVideo && (
           <div className="w-full max-w-3xl mt-4 rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
             <video controls className="w-full aspect-video" src={resultVideo} autoPlay loop />
             <div className="p-4 bg-zinc-900 flex justify-between items-center">
               <span className="text-sm text-gray-400">Generated with Veo</span>
               <a href={resultVideo} download className="flex items-center gap-2 text-indigo-400 hover:text-white transition-colors">
                 <Download size={16} /> Download
               </a>
             </div>
           </div>
        )}
        
        {loading && (
          <div className="text-center py-12">
            <Loader2 size={40} className="animate-spin text-indigo-500 mx-auto mb-4" />
            <h3 className="text-white font-medium">Rendering Video</h3>
            <p className="text-zinc-500 text-sm mt-1">This may take a minute or two...</p>
          </div>
        )}
      </div>
    </div>
  );
};