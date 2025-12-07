import React from 'react';
import { Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { GenerationResult } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ResultCardProps {
  result: GenerationResult;
  index: number;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, index }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-full overflow-hidden transition-all hover:shadow-md">
      <div className="bg-slate-50 px-3 py-2 border-b border-slate-100 flex justify-between items-center shrink-0">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          Result #{index + 1}
        </span>
        <div className="flex items-center gap-2">
           {result.status === 'streaming' && (
             <span className="text-[10px] text-primary flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"/> Generating
             </span>
           )}
           {result.status === 'completed' && (
             <span className="text-[10px] text-green-600 font-medium">
               {result.content.length} chars
             </span>
           )}
           {result.status !== 'loading' && result.status !== 'error' && (
            <button
              onClick={handleCopy}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded"
              title="Copy output"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
           )}
        </div>
      </div>
      
      <div className="p-4 text-sm leading-relaxed overflow-y-auto flex-1 h-[300px] min-h-[200px]">
        {result.status === 'loading' ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
            <span className="text-xs">Waiting for API...</span>
          </div>
        ) : result.status === 'error' ? (
           <div className="flex flex-col items-center justify-center h-full text-red-500 gap-2 p-4 text-center">
            <AlertCircle className="w-6 h-6" />
            <span className="text-xs">{result.error || "Generation failed"}</span>
          </div>
        ) : (
          result.content ? (
            <div className="markdown-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {result.content}
              </ReactMarkdown>
            </div>
          ) : (
             <span className="text-slate-300 italic">Empty response</span>
          )
        )}
      </div>
    </div>
  );
};