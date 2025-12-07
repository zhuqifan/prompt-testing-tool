import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { ConfigPanel } from './components/ConfigPanel';
import { ResultCard } from './components/ResultCard';
import { apiService } from './services/api';
import { storageService } from './services/storage';
import { SavedPrompt, TestRun, ModelConfig, DEFAULT_CONFIG, GenerationResult } from './types';
import { Play, Save, Terminal, User, Check, AlertCircle, StopCircle, Trash2, Code, X, Copy } from 'lucide-react';

// Simple ID generator for browser
const generateId = () => Math.random().toString(36).substring(2, 9);

// Custom Modal Component
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all scale-100 opacity-100 border border-slate-100">
        <div className="flex items-center gap-3 mb-4 text-red-600">
          <div className="p-2 bg-red-100 rounded-full">
            <Trash2 className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">{message}</p>
        <div className="flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// Payload Modal Component
interface PayloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemPrompt: string;
  userPrompt: string;
}

const PayloadModal: React.FC<PayloadModalProps> = ({ isOpen, onClose, systemPrompt, userPrompt }) => {
  if (!isOpen) return null;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  const jsonString = JSON.stringify(messages, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col transform transition-all scale-100 opacity-100 border border-slate-100" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Request Payload
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-0 bg-[#1e293b]">
          <pre className="text-sm font-mono text-blue-100 p-4 leading-relaxed whitespace-pre-wrap">
            {jsonString}
          </pre>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 rounded-b-xl">
           <button 
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Copy className="w-4 h-4" /> Copy JSON
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

const App: React.FC = () => {
  // --- State ---
  const [history, setHistory] = useState<TestRun[]>([]);
  const [savedSystemPrompts, setSavedSystemPrompts] = useState<SavedPrompt[]>([]);
  const [savedUserPrompts, setSavedUserPrompts] = useState<SavedPrompt[]>([]);
  const [apiKey, setApiKey] = useState('');
  
  const [systemPrompt, setSystemPrompt] = useState('');
  const [userPrompt, setUserPrompt] = useState('');
  const [config, setConfig] = useState<ModelConfig>(DEFAULT_CONFIG);
  
  const [isRunning, setIsRunning] = useState(false);
  const [currentResults, setCurrentResults] = useState<GenerationResult[]>([]);
  const [lastRunId, setLastRunId] = useState<string | null>(null);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarActiveTab, setSidebarActiveTab] = useState<'history' | 'prompts'>('history');
  const [sidebarPromptTypeTab, setSidebarPromptTypeTab] = useState<'system' | 'user'>('system');

  const [configOpen, setConfigOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState<{type: 'system' | 'user' | null, show: boolean}>({ type: null, show: false });
  
  const [payloadModalOpen, setPayloadModalOpen] = useState(false);

  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'history' | 'system' | 'user';
    id: string;
  }>({ isOpen: false, type: 'history', id: '' });

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasSavedHistoryRef = useRef<boolean>(false);
  const resizeRef = useRef<HTMLDivElement | null>(null);
  const isResizingRef = useRef<boolean>(false);

  // Resizable split state
  const [promptAreaHeight, setPromptAreaHeight] = useState<number>(400); // Default height in pixels

  // --- Initialization ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [history, systemPrompts, userPrompts, apiKeyResult] = await Promise.all([
          storageService.getHistory(),
          storageService.getSystemPrompts(),
          storageService.getUserPrompts(),
          storageService.getApiKey(),
        ]);
        setHistory(history);
        setSavedSystemPrompts(systemPrompts);
        setSavedUserPrompts(userPrompts);
        setApiKey(apiKeyResult);
      } catch (error) {
        console.error('加载数据失败:', error);
      }
    };
    loadData();
  }, []);

  // --- Resize Handler ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !resizeRef.current) return;
      
      const rect = resizeRef.current.getBoundingClientRect();
      const mainContentArea = resizeRef.current.parentElement;
      if (!mainContentArea) return;
      
      const mainRect = mainContentArea.getBoundingClientRect();
      const newHeight = e.clientY - mainRect.top;
      
      // Set min and max heights
      const minHeight = 200;
      const maxHeight = mainRect.height - 200;
      
      if (newHeight >= minHeight && newHeight <= maxHeight) {
        setPromptAreaHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // --- Handlers ---
  const handleApiKeyChange = async (key: string) => {
      setApiKey(key);
      await storageService.saveApiKey(key);
  };

  const handleRunTest = async () => {
    if (!systemPrompt.trim() && !userPrompt.trim()) return;
    
    setIsRunning(true);
    const runId = generateId();
    setLastRunId(runId);
    hasSavedHistoryRef.current = false; // Reset save flag
    
    // Create new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Initialize results placeholders
    const initialResults: GenerationResult[] = Array.from({ length: config.outputCount }, (_, i) => ({
      id: i,
      content: '',
      status: 'loading',
    }));
    setCurrentResults(initialResults);

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ] as const;

    try {
        // --- Concurrent Execution ---
        const promises = initialResults.map(async (resItem) => {
            // Delay slightly (stagger) to prevent exact millisecond collision
            await new Promise(resolve => setTimeout(resolve, resItem.id * 50)); 
            
            if (signal.aborted) return;

            return new Promise<void>((resolve) => {
                apiService.streamCompletion(
                    [...messages],
                    config,
                    apiKey,
                    {
                        onToken: (token) => {
                            if (signal.aborted) return;
                            setCurrentResults(prev => prev.map(r => {
                                if (r.id === resItem.id) {
                                    return { ...r, content: r.content + token, status: 'streaming' };
                                }
                                return r;
                            }));
                        },
                        onError: (err) => {
                            if (!signal.aborted) {
                                setCurrentResults(prev => prev.map(r => {
                                    if (r.id === resItem.id) {
                                        return { ...r, status: 'error', error: err };
                                    }
                                    return r;
                                }));
                            }
                            resolve();
                        },
                        onComplete: () => {
                            if (!signal.aborted) {
                                setCurrentResults(prev => prev.map(r => {
                                    if (r.id === resItem.id) {
                                        return { ...r, status: 'completed' };
                                    }
                                    return r;
                                }));
                            }
                            resolve();
                        }
                    },
                    signal
                );
            });
        });

        await Promise.all(promises);
    } catch (e) {
        console.log("Execution interrupted or failed", e);
    } finally {
        setIsRunning(false);
        abortControllerRef.current = null;
        
        // Save history even if stopped - only once
        if (!hasSavedHistoryRef.current) {
            hasSavedHistoryRef.current = true; // Mark as saved immediately to prevent duplicate calls
            
            setCurrentResults(finalResults => {
                // Clean up statuses for history (convert loading/streaming to completed/stopped)
                const cleanResults = finalResults.map(r => 
                    (r.status === 'loading' || r.status === 'streaming') 
                    ? { ...r, status: 'completed' as const } 
                    : r
                );

                // Only save if we actually have some prompts or results
                if (systemPrompt || userPrompt) {
                    const newRun: TestRun = {
                        id: runId,
                        timestamp: Date.now(),
                        systemPrompt,
                        userPrompt,
                        config,
                        results: cleanResults,
                    };
                    // Save asynchronously (don't await in setState callback)
                    (async () => {
                        try {
                            const existingHistory = await storageService.getHistory();
                            if (!existingHistory.find(r => r.id === runId)) {
                                await storageService.saveTestRun(newRun);
                                setHistory(prev => {
                                    // Prevent duplicate in state
                                    if (!prev.find(r => r.id === runId)) {
                                        return [newRun, ...prev];
                                    }
                                    return prev;
                                });
                            }
                        } catch (e) {
                            console.error('保存历史记录失败:', e);
                        }
                    })();
                }
                
                return cleanResults;
            });
        }
    }
  };

  const handleStop = () => {
      if (abortControllerRef.current) {
          abortControllerRef.current.abort();
      }
  };

  const handleSavePrompt = async (type: 'system' | 'user') => {
    const content = type === 'system' ? systemPrompt : userPrompt;
    if (!content || !content.trim()) {
        return;
    }

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const title = `${type === 'system' ? 'System' : 'User'} Prompt ${timestamp}`;

    const newPrompt: SavedPrompt = {
      id: generateId(),
      title: title,
      content,
      type,
      createdAt: Date.now(),
      isFavorite: false
    };

    try {
        const updatedList = await storageService.savePrompt(newPrompt);
        
        if (type === 'system') {
            setSavedSystemPrompts(updatedList);
        } else {
            setSavedUserPrompts(updatedList);
        }

        setSidebarOpen(true);
        setSidebarActiveTab('prompts');
        setSidebarPromptTypeTab(type);

        setSaveStatus({ type, show: true });
        setTimeout(() => setSaveStatus({ type: null, show: false }), 2000);
    } catch (e) {
        console.error("保存失败", e);
    }
  };

  // --- Deletion Logic with Modal ---
  const handleDeletePrompt = (id: string, type: 'system' | 'user') => {
    setDeleteModal({ isOpen: true, type, id });
  };

  const handleDeleteHistory = (id: string) => {
    setDeleteModal({ isOpen: true, type: 'history', id });
  };

  const confirmDelete = async () => {
    const { type, id } = deleteModal;
    
    if (!id) {
      setDeleteModal({ isOpen: false, type: 'history', id: '' });
      return;
    }
    
    if (type === 'history') {
      try {
        const updated = await storageService.deleteHistoryItem(id);
        setHistory(updated);
      } catch (e) { 
        console.error('删除历史错误:', e);
      }
    } else {
      try {
        const updatedList = await storageService.deletePrompt(id, type);
        if (type === 'system') {
          setSavedSystemPrompts(updatedList);
        } else {
          setSavedUserPrompts(updatedList);
        }
      } catch (e) { 
        console.error('删除提示词错误:', e);
      }
    }
    
    setDeleteModal({ isOpen: false, type: 'history', id: '' });
  };

  const handleRenamePrompt = async (id: string, type: 'system' | 'user', newTitle: string) => {
      const updatedList = await storageService.updatePromptTitle(id, type, newTitle);
      if (type === 'system') {
          setSavedSystemPrompts(updatedList);
      } else {
          setSavedUserPrompts(updatedList);
      }
  };

  const handleTogglePromptFavorite = async (id: string, type: 'system' | 'user') => {
      const updatedList = await storageService.togglePromptFavorite(id, type);
      if (type === 'system') {
          setSavedSystemPrompts(updatedList);
      } else {
          setSavedUserPrompts(updatedList);
      }
  };

  const handleToggleHistoryFavorite = async (id: string) => {
      const updated = await storageService.toggleHistoryFavorite(id);
      setHistory(updated);
  };

  const handleSelectHistory = (run: TestRun) => {
      setSystemPrompt(run.systemPrompt);
      setUserPrompt(run.userPrompt);
      setConfig(run.config);
      setCurrentResults(run.results);
      setLastRunId(run.id);
  };

  const handleSelectPrompt = (prompt: SavedPrompt) => {
      if (prompt.type === 'system') {
          setSystemPrompt(prompt.content);
      } else {
          setUserPrompt(prompt.content);
      }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface">
      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        title={`Delete ${deleteModal.type === 'history' ? 'History Item' : 'Prompt'}`}
        message={deleteModal.type === 'history' 
          ? "Are you sure you want to delete this test run from your history? This action cannot be undone." 
          : "Are you sure you want to delete this saved prompt? This action cannot be undone."}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ ...deleteModal, isOpen: false })}
      />

      {/* Payload Viewer Modal */}
      <PayloadModal 
        isOpen={payloadModalOpen}
        onClose={() => setPayloadModalOpen(false)}
        systemPrompt={systemPrompt}
        userPrompt={userPrompt}
      />

      {/* Left Sidebar */}
      <Sidebar 
        history={history}
        savedSystemPrompts={savedSystemPrompts}
        savedUserPrompts={savedUserPrompts}
        onSelectHistory={handleSelectHistory}
        onDeleteHistory={handleDeleteHistory}
        onToggleHistoryFavorite={handleToggleHistoryFavorite}
        onSelectPrompt={handleSelectPrompt}
        onDeletePrompt={handleDeletePrompt}
        onRenamePrompt={handleRenamePrompt}
        onTogglePromptFavorite={handleTogglePromptFavorite}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        // State Props
        activeTab={sidebarActiveTab}
        setActiveTab={setSidebarActiveTab}
        promptTypeTab={sidebarPromptTypeTab}
        setPromptTypeTab={setSidebarPromptTypeTab}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto">
        
        {/* Top Input Area */}
        <div 
          className="border-b border-slate-200 bg-white shadow-sm z-10 shrink-0"
          style={{ height: `${promptAreaHeight}px`, minHeight: '200px' }}
        >
          <div className="p-6 h-full flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mx-auto flex-1 min-h-0 w-full max-w-none px-4">
            
            {/* System Prompt Input */}
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <div className="flex justify-between items-center shrink-0">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-secondary" />
                  System Prompt
                </label>
                <div className="flex gap-2">
                   <button 
                     onClick={() => setSystemPrompt('')}
                     className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                   >
                     Clear
                   </button>
                   <button 
                     onClick={() => handleSavePrompt('system')}
                     disabled={!systemPrompt.trim()}
                     className={`text-xs flex items-center gap-1 px-3 py-1 rounded-full font-medium transition-all duration-300 ${
                       saveStatus.type === 'system' && saveStatus.show 
                         ? 'text-green-700 bg-green-100 ring-1 ring-green-300' 
                         : 'text-primary bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed'
                     }`}
                   >
                     {saveStatus.type === 'system' && saveStatus.show ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                     {saveStatus.type === 'system' && saveStatus.show ? 'Saved!' : 'Save'}
                   </button>
                </div>
              </div>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful assistant..."
                className="w-full flex-1 min-h-0 p-3 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none bg-slate-50 text-slate-900 placeholder:text-slate-400"
              />
            </div>

            {/* User Prompt Input */}
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <div className="flex justify-between items-center shrink-0">
                <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-secondary" />
                  User Prompt
                </label>
                 <div className="flex gap-2">
                   <button 
                     onClick={() => setUserPrompt('')}
                     className="text-xs text-slate-400 hover:text-red-500 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                   >
                     Clear
                   </button>
                   <button 
                     onClick={() => handleSavePrompt('user')}
                     disabled={!userPrompt.trim()}
                     className={`text-xs flex items-center gap-1 px-3 py-1 rounded-full font-medium transition-all duration-300 ${
                       saveStatus.type === 'user' && saveStatus.show 
                         ? 'text-green-700 bg-green-100 ring-1 ring-green-300' 
                         : 'text-primary bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed'
                     }`}
                   >
                     {saveStatus.type === 'user' && saveStatus.show ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                     {saveStatus.type === 'user' && saveStatus.show ? 'Saved!' : 'Save'}
                   </button>
                </div>
              </div>
              <textarea
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
                placeholder="Enter your test input here..."
                className="w-full flex-1 min-h-0 p-3 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none bg-white text-slate-900 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex justify-end mt-4 mx-auto shrink-0 w-full max-w-none px-4">
            {isRunning ? (
                <button
                onClick={handleStop}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white shadow-lg bg-red-500 hover:bg-red-600 transition-all transform active:scale-95"
                >
                    <StopCircle className="w-4 h-4 fill-current" />
                    Stop Generation
                </button>
            ) : (
                <button
                onClick={handleRunTest}
                disabled={!systemPrompt && !userPrompt}
                className={`
                    flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-white shadow-lg shadow-blue-500/30 transition-all transform active:scale-95
                    ${(!systemPrompt && !userPrompt) 
                    ? 'bg-slate-300 cursor-not-allowed shadow-none' 
                    : 'bg-gradient-to-r from-primary to-blue-600 hover:bg-blue-700'
                    }
                `}
                >
                <Play className="w-4 h-4 fill-current" />
                Run Test Batch
                </button>
            )}
          </div>
          </div>
        </div>

        {/* Resize Handle */}
        <div
          ref={resizeRef}
          onMouseDown={(e) => {
            e.preventDefault();
            isResizingRef.current = true;
            document.body.style.cursor = 'row-resize';
            document.body.style.userSelect = 'none';
          }}
          className="h-1 bg-slate-200 hover:bg-primary cursor-row-resize transition-colors relative group"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-0.5 bg-slate-400 group-hover:bg-primary transition-colors rounded-full"></div>
          </div>
        </div>

        {/* Results Grid Area */}
        <div className="p-6 bg-slate-50/50 shrink-0">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                Output Results {currentResults.length > 0 && `(${currentResults.length})`}
              </h2>
              <button 
                onClick={() => setPayloadModalOpen(true)}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-50 hover:text-primary hover:border-primary/50 transition-colors"
                title="View JSON Payload"
              >
                <Code className="w-3.5 h-3.5" />
                Show Payload
              </button>
            </div>
            
            {currentResults.length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-xl m-4">
                 <Terminal className="w-12 h-12 mb-4 opacity-50" />
                 <p className="text-lg font-medium">Ready to test</p>
                 <p className="text-sm">Configure your prompts and hit Run</p>
               </div>
            ) : (
              <div 
                className="grid gap-4 pb-10" 
                style={{
                  gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))`
                }}
              >
                {currentResults.map((result, index) => (
                  <ResultCard key={result.id} result={result} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Config Panel */}
      <ConfigPanel 
        config={config} 
        onChange={setConfig} 
        disabled={isRunning}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
        isOpen={configOpen}
        onToggle={() => setConfigOpen(!configOpen)}
      />
    </div>
  );
};

export default App;