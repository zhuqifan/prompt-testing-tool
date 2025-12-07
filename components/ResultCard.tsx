import React from 'react';
import { Copy, Check, AlertCircle, Loader2, Eye, X } from 'lucide-react';
import { GenerationResult } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface ResultCardProps {
  result: GenerationResult;
  index: number;
}

// Content Modal Component
interface ContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  index: number;
}

const ContentModal: React.FC<ContentModalProps> = ({ isOpen, onClose, content, index }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col transform transition-all scale-100 opacity-100 border border-slate-100" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Result #{index + 1} - Full Content
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-white">
          <pre className="text-sm font-mono whitespace-pre-wrap break-words text-slate-800 leading-relaxed">
            {content}
          </pre>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Content'}
          </button>
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const ResultCard: React.FC<ResultCardProps> = ({ result, index }) => {
  const [copied, setCopied] = React.useState(false);
  const [showContentModal, setShowContentModal] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Process content to preserve single line breaks and highlight <msg> tags
  const processContent = (content: string) => {
    // First, highlight <msg> tags by converting them to HTML spans with purple color
    // Only show the inner text, not the <msg> tags themselves
    let processed = content.replace(/<msg>(.*?)<\/msg>/g, (match, innerText) => {
      // Escape HTML special characters in inner text to prevent XSS
      const escaped = innerText
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      // Return as HTML span with purple color, only showing the inner text
      return `<span style="color: #6b21a8; font-weight: 500;">${escaped}</span>`;
    });
    
    // Replace single newlines with double newlines to ensure ReactMarkdown treats them as breaks
    // First, protect existing double+ newlines by temporarily replacing them
    const placeholder = '___DOUBLE_NEWLINE___';
    const protectedContent = processed.replace(/\n\n+/g, placeholder);
    // Replace all remaining single newlines with double newlines
    processed = protectedContent.replace(/\n/g, '\n\n');
    // Restore the original double+ newlines
    return processed.replace(new RegExp(placeholder, 'g'), '\n\n');
  };

  return (
    <>
      <ContentModal 
        isOpen={showContentModal}
        onClose={() => setShowContentModal(false)}
        content={result.content}
        index={index}
      />
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
             {result.status !== 'loading' && result.status !== 'error' && result.content && (
               <>
                 <button
                   onClick={() => setShowContentModal(true)}
                   className="text-slate-400 hover:text-primary transition-colors p-1 rounded"
                   title="View full content"
                 >
                   <Eye className="w-3 h-3" />
                 </button>
                 <button
                   onClick={handleCopy}
                   className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded"
                   title="Copy output"
                 >
                   {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                 </button>
               </>
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
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {processContent(result.content)}
              </ReactMarkdown>
            </div>
          ) : (
             <span className="text-slate-300 italic">Empty response</span>
          )
        )}
      </div>
      </div>
    </>
  );
};