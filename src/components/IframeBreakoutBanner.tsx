import { useState, useEffect } from 'react';
import { ExternalLink, Sparkles, X } from 'lucide-react';

export default function IframeBreakoutBanner() {
  const [inIframe, setInIframe] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      // Detect if window is framed
      if (window.self !== window.top) {
        setInIframe(true);
      }
    } catch (e) {
      setInIframe(true);
    }
  }, []);

  if (!inIframe || dismissed) return null;

  return (
    <div id="iframe-breakout-banner" className="bg-gradient-to-r from-amber-600 to-pink-600 text-white py-2.5 px-4 flex items-center justify-between text-xs sm:text-sm font-sans shadow-md relative z-50 animate-fade-in">
      <div className="flex items-center gap-2 mx-auto sm:mx-0">
        <Sparkles className="w-4 h-4 animate-pulse text-amber-200 shrink-0" />
        <span className="font-medium">
          Running in Sandbox Preview. For unrestricted Sign-In, prompts, and best performance:
        </span>
        <a 
          href={window.location.href}
          target="_blank" 
          rel="noopener noreferrer" 
          className="inline-flex items-center gap-1 bg-white text-slate-950 font-bold px-3 py-1 rounded-full shadow-sm hover:bg-slate-100 transition-colors ml-2"
        >
          Open in New Tab <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
      <button 
        onClick={() => setDismissed(true)} 
        className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 absolute right-3 top-1/2 -translate-y-1/2 sm:static sm:translate-y-0"
        aria-label="Dismiss banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
