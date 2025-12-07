import React, { useState, useMemo } from 'react';
import { Clock, Book, Trash2, Edit2, Check, X, MessageSquare, ChevronLeft, Menu, Star } from 'lucide-react';
import { SavedPrompt, TestRun } from '../types';

interface SidebarProps {
  history: TestRun[];
  savedSystemPrompts: SavedPrompt[];
  savedUserPrompts: SavedPrompt[];
  onSelectHistory: (run: TestRun) => void;
  onDeleteHistory: (id: string) => void;
  onToggleHistoryFavorite: (id: string) => void;
  onSelectPrompt: (prompt: SavedPrompt) => void;
  onDeletePrompt: (id: string, type: 'system' | 'user') => void;
  onRenamePrompt: (id: string, type: 'system' | 'user', newTitle: string) => void;
  onTogglePromptFavorite: (id: string, type: 'system' | 'user') => void;
  isOpen: boolean;
  onToggle: () => void;
  activeTab: 'history' | 'prompts';
  setActiveTab: (tab: 'history' | 'prompts') => void;
  promptTypeTab: 'system' | 'user';
  setPromptTypeTab: (type: 'system' | 'user') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  history,
  savedSystemPrompts,
  savedUserPrompts,
  onSelectHistory,
  onDeleteHistory,
  onToggleHistoryFavorite,
  onSelectPrompt,
  onDeletePrompt,
  onRenamePrompt,
  onTogglePromptFavorite,
  isOpen,
  onToggle,
  activeTab,
  setActiveTab,
  promptTypeTab,
  setPromptTypeTab
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const startEditing = (prompt: SavedPrompt) => {
    setEditingId(prompt.id);
    setEditTitle(prompt.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const saveEditing = (id: string, type: 'system' | 'user') => {
    if (editTitle.trim()) {
      onRenamePrompt(id, type, editTitle.trim());
    }
    setEditingId(null);
  };

  // Sort logic: Favorites first, then date
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
        if (a.isFavorite === b.isFavorite) {
            return b.timestamp - a.timestamp;
        }
        return (a.isFavorite ? -1 : 1);
    });
  }, [history]);

  const currentPrompts = promptTypeTab === 'system' ? savedSystemPrompts : savedUserPrompts;
  const sortedPrompts = useMemo(() => {
      return [...currentPrompts].sort((a, b) => {
          if (a.isFavorite === b.isFavorite) {
              return b.createdAt - a.createdAt;
          }
          return (a.isFavorite ? -1 : 1);
      });
  }, [currentPrompts]);

  if (!isOpen) {
    return (
      <div className="h-full bg-white border-r border-slate-200 w-12 shrink-0 flex flex-col items-center py-4">
        <button 
          onClick={onToggle}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-primary transition-colors mb-4"
          title="Open Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex-1 flex flex-col gap-4 items-center">
             <button onClick={() => { onToggle(); setActiveTab('history'); }} className={`p-2 hover:text-slate-600 ${activeTab === 'history' ? 'text-primary' : 'text-slate-400'}`}>
               <Clock className="w-5 h-5" />
             </button>
             <button onClick={() => { onToggle(); setActiveTab('prompts'); }} className={`p-2 hover:text-slate-600 ${activeTab === 'prompts' ? 'text-primary' : 'text-slate-400'}`}>
               <Book className="w-5 h-5" />
             </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-80 shrink-0 transition-all duration-300">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-primary" />
          Prompt Lab
        </h1>
        <button 
          onClick={onToggle}
          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Main Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === 'history' 
              ? 'text-primary border-b-2 border-primary bg-blue-50/50' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          History
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === 'prompts' 
              ? 'text-primary border-b-2 border-primary bg-blue-50/50' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Book className="w-4 h-4" />
          Library
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'history' ? (
          <div className="divide-y divide-slate-100">
            {sortedHistory.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">
                No test runs yet.
              </div>
            )}
            {sortedHistory.map((run) => (
              <div
                key={run.id}
                className="w-full p-4 text-left hover:bg-slate-50 transition-colors group relative cursor-pointer"
                onClick={() => onSelectHistory(run)}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                    {new Date(run.timestamp).toLocaleString(undefined, {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                  
                  {/* Action Buttons Container - Absolute positioned to be on top */}
                  <div className="flex items-center gap-1 relative z-30" onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                  }}>
                     <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mr-1">
                        x{run.results.length}
                     </span>
                     
                     <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleHistoryFavorite(run.id);
                        }}
                        className={`p-1 rounded transition-all ${run.isFavorite ? 'text-yellow-500 hover:bg-yellow-50' : 'text-slate-300 hover:text-yellow-500 hover:bg-yellow-50'}`}
                        title={run.isFavorite ? "Unfavorite" : "Favorite"}
                     >
                         <Star className={`w-3.5 h-3.5 ${run.isFavorite ? 'fill-current' : ''}`} />
                     </button>

                     <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Force stop propagation
                            if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
                            onDeleteHistory(run.id);
                        }}
                        className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                        title="Delete History"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-slate-800 font-medium line-clamp-1 mb-1 pr-12">
                  {run.userPrompt || "(Empty Prompt)"}
                </div>
                <div className="text-xs text-slate-500 line-clamp-1">
                  Sys: {run.systemPrompt.substring(0, 30)}...
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex p-2 gap-2 border-b border-slate-100 bg-slate-50">
              <button
                onClick={() => setPromptTypeTab('system')}
                className={`flex-1 text-xs py-1.5 px-3 rounded-md transition-colors ${
                  promptTypeTab === 'system' ? 'bg-white shadow text-primary font-medium' : 'text-slate-500 hover:bg-white/50'
                }`}
              >
                System Prompts
              </button>
              <button
                onClick={() => setPromptTypeTab('user')}
                className={`flex-1 text-xs py-1.5 px-3 rounded-md transition-colors ${
                  promptTypeTab === 'user' ? 'bg-white shadow text-primary font-medium' : 'text-slate-500 hover:bg-white/50'
                }`}
              >
                User Prompts
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {sortedPrompts.length === 0 && (
                 <div className="p-4 text-center text-slate-400 text-sm italic">
                  No saved {promptTypeTab} prompts.
                </div>
              )}
              {sortedPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="group bg-white border border-slate-200 rounded-lg p-3 hover:border-primary/30 hover:shadow-sm transition-all relative"
                  onClick={() => {
                      if (editingId !== prompt.id) onSelectPrompt(prompt);
                  }}
                >
                  {editingId === prompt.id ? (
                    <div className="flex items-center gap-1 mb-1 relative z-30" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="flex-1 text-sm border border-primary rounded px-1 py-0.5 outline-none"
                        autoFocus
                      />
                      <button 
                        onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            saveEditing(prompt.id, prompt.type); 
                        }} 
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            cancelEditing(); 
                        }} 
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-start mb-1">
                        <div className="font-medium text-slate-800 text-sm cursor-pointer pr-20 truncate">
                            {prompt.title}
                        </div>
                        
                        {/* Action Buttons - Always visible or hover visible, handled separately */}
                        <div className="absolute top-2 right-2 flex gap-0.5 z-30" onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                        }}>
                             <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onTogglePromptFavorite(prompt.id, prompt.type);
                                }}
                                className={`p-1.5 rounded ${prompt.isFavorite ? 'text-yellow-500' : 'text-slate-300 hover:text-yellow-500'} hover:bg-yellow-50`}
                                title="Favorite"
                            >
                                <Star className={`w-3.5 h-3.5 ${prompt.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    startEditing(prompt);
                                }}
                                className="p-1.5 text-slate-300 hover:text-primary hover:bg-blue-50 rounded"
                                title="Rename"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    // Force stop propagation
                                    if (e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
                                    onDeletePrompt(prompt.id, prompt.type);
                                }}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded"
                                title="Delete"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {prompt.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};