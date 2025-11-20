import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Sparkles, Loader2, Search, Brain, FileCheck, Check } from 'lucide-react';

interface Props {
  content: string;
  isActive: boolean;
}

const ResearchLog: React.FC<Props> = ({ content, isActive }) => {
  const [isOpen, setIsOpen] = useState(isActive);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when active and open
  useEffect(() => {
    if (isActive && isOpen && contentRef.current) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [content, isActive, isOpen]);

  // Auto-open logic: Open initially if active, close when done (Gemini behavior)
  useEffect(() => {
    if (isActive) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isActive]);

  const lines = content.split('\n').filter(l => l.trim() !== '');

  return (
    <div className="w-full my-2 font-sans group">
      {/* Header - Gemini Style Toggle */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[13px] font-medium text-slate-500 hover:text-slate-800 transition-colors py-1.5 select-none rounded-lg px-2 -ml-2 cursor-pointer w-fit max-w-full"
      >
        {isActive ? (
          <Sparkles className="w-4 h-4 text-brand-500 animate-pulse shrink-0" />
        ) : (
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-slate-400 grayscale" />
          </div>
        )}
        
        <span className="truncate">{isActive ? 'Thinking...' : 'Show thinking'}</span>
        
        {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
        ) : (
            <ChevronRight className="w-3.5 h-3.5 opacity-60 shrink-0" />
        )}
      </button>

      {/* Content - Gemini Left-Border Style */}
      {isOpen && (
        <div className="ml-0.5 pl-3 border-l-2 border-slate-200 space-y-1 mt-1 mb-3 animate-in fade-in slide-in-from-top-1 duration-200 w-full max-w-full overflow-hidden">
          <div 
            ref={contentRef}
            className="py-1 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1 w-full"
          >
            {lines.length === 0 && isActive && (
               <div className="flex items-center gap-2 text-slate-400 text-xs pl-1">
                 <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                 <span className="italic">Initializing thought process...</span>
               </div>
            )}

            {lines.map((line, idx) => {
              // Parse Step Type for Icon
              const lower = line.toLowerCase();
              let Icon = Check; 
              let colorClass = "text-slate-400";
              
              if (lower.includes('search') || lower.includes('搜索')) {
                Icon = Search;
                colorClass = "text-blue-500";
              } else if (lower.includes('analysis') || lower.includes('分析') || lower.includes('thinking')) {
                Icon = Brain;
                colorClass = "text-purple-500";
              } else if (lower.includes('check') || lower.includes('检查')) {
                Icon = FileCheck;
                colorClass = "text-emerald-500";
              }

              // Clean text formatting: remove > [Type] prefixes
              const cleanText = line
                .replace(/^[>*\- ]+/, '') // Remove bullets
                .replace(/^\[(Search|Analysis|Gap Analysis|Data Check|Gap|Competitor|Market|Tech|Data Synthesis|User Insight|Self Diagnosis|Strategic Positioning|Value Bottom Line|Roadmap Logic|Tech Trend Mapping|Competitor Deep Dive)\]:?/, '') // Remove tags
                .trim();

              return (
                <div key={idx} className="flex gap-2.5 items-start text-[13px] leading-relaxed w-full">
                  {/* Icon aligned with first line of text */}
                  <div className="mt-1 flex-shrink-0">
                    <Icon className={`w-3.5 h-3.5 ${colorClass}`} />
                  </div>
                  
                  {/* Text Content - Enforce Wrapping with whitespace-pre-wrap and break-words */}
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-600 whitespace-pre-wrap break-words break-all">
                      {cleanText}
                    </p>
                  </div>
                </div>
              );
            })}

            {isActive && (
               <div className="flex gap-1.5 items-center mt-2 pl-1 opacity-40">
                 <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                 <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-75" />
                 <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce delay-150" />
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchLog;