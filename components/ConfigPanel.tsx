import React, { useState } from 'react';
import { Settings2, Cpu, Zap, Activity, Thermometer, Key, ChevronRight, CheckCircle2, AlertCircle, ChevronLeft } from 'lucide-react';
import { ModelConfig } from '../types';
import { apiService } from '../services/api';

interface ConfigPanelProps {
  config: ModelConfig;
  onChange: (newConfig: ModelConfig) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  disabled: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ 
  config, 
  onChange, 
  apiKey, 
  onApiKeyChange, 
  disabled,
  isOpen,
  onToggle
}) => {
  const [verifying, setVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [verifyMsg, setVerifyMsg] = useState('');

  const handleChange = <K extends keyof ModelConfig>(key: K, value: ModelConfig[K]) => {
    onChange({ ...config, [key]: value });
  };

  const handleVerify = async () => {
    setVerifying(true);
    setVerifyStatus('idle');
    setVerifyMsg('');
    
    const result = await apiService.verifyConnection(apiKey, config.model);
    setVerifying(false);
    
    if (result.success) {
      setVerifyStatus('success');
      setVerifyMsg(result.message);
      // Clear success message after 3s
      setTimeout(() => setVerifyStatus('idle'), 3000);
    } else {
      setVerifyStatus('error');
      setVerifyMsg(result.message);
    }
  };

  if (!isOpen) {
    return (
      <div className="h-full bg-white border-l border-slate-200 w-12 shrink-0 flex flex-col items-center py-4">
        <button 
          onClick={onToggle}
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-primary transition-colors mb-4"
          title="Open Configuration"
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border-l border-slate-200 w-80 shrink-0 flex flex-col overflow-y-auto transition-all duration-300">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
          <Settings2 className="w-4 h-4" />
          Configuration
        </h2>
        <button 
          onClick={onToggle}
          className="p-1 text-slate-400 hover:bg-slate-100 rounded"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* API Key Section */}
        <div className="space-y-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
           <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
             <Key className="w-3 h-3" /> API Credentials
           </label>
           <input
             type="password"
             value={apiKey}
             onChange={(e) => {
               onApiKeyChange(e.target.value);
               setVerifyStatus('idle');
             }}
             placeholder="sk-..."
             className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
           />
           
           <div className="flex justify-between items-center mt-2">
             <button
               onClick={handleVerify}
               disabled={!apiKey || verifying}
               className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${
                 !apiKey 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-white border border-slate-300 text-slate-700 hover:border-primary hover:text-primary'
               }`}
             >
               {verifying ? 'Verifying...' : 'Verify Key'}
             </button>
           </div>
           
           {verifyStatus === 'success' && (
             <div className="text-[10px] text-green-600 flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1">
               <CheckCircle2 className="w-3 h-3" /> {verifyMsg}
             </div>
           )}
           {verifyStatus === 'error' && (
             <div className="text-[10px] text-red-500 flex items-start gap-1 mt-1 animate-in fade-in slide-in-from-top-1 break-words leading-tight">
               <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" /> 
               <span>{verifyMsg}</span>
             </div>
           )}
        </div>

        <div className="h-px bg-slate-100" />

        {/* Model Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Model</label>
          <input
            type="text"
            value={config.model}
            disabled={disabled}
            onChange={(e) => handleChange('model', e.target.value)}
            className="w-full text-sm border border-slate-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            placeholder="e.g. doubao-pro-4k"
          />
          <p className="text-[10px] text-slate-400">Endpoint ID or Model Name</p>
        </div>

        {/* Output Count */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Parallel Outputs</label>
             <span className="text-xs font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-700">{config.outputCount}</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={config.outputCount}
            disabled={disabled}
            onChange={(e) => handleChange('outputCount', parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

         {/* Thinking */}
         <div className="space-y-2">
           <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Cpu className="w-3 h-3" /> Thinking
           </label>
           <div className="flex bg-slate-100 p-1 rounded-md">
             <button
              onClick={() => handleChange('thinking', { type: 'enabled' })}
              disabled={disabled}
              className={`flex-1 text-xs py-1.5 rounded-sm transition-all ${
                config.thinking.type === 'enabled' ? 'bg-white shadow text-primary font-medium' : 'text-slate-500'
              }`}
             >
               Enabled
             </button>
             <button
              onClick={() => handleChange('thinking', { type: 'disabled' })}
              disabled={disabled}
              className={`flex-1 text-xs py-1.5 rounded-sm transition-all ${
                config.thinking.type === 'disabled' ? 'bg-white shadow text-primary font-medium' : 'text-slate-500'
              }`}
             >
               Disabled
             </button>
           </div>
         </div>

        {/* Temperature */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Thermometer className="w-3 h-3" /> Temperature
             </label>
             <span className="text-xs font-bold text-slate-600">{config.temperature}</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature}
            disabled={disabled}
            onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Frequency Penalty */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3 h-3" /> Freq Penalty
             </label>
             <span className="text-xs font-bold text-slate-600">{config.frequency_penalty}</span>
          </div>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={config.frequency_penalty}
            disabled={disabled}
            onChange={(e) => handleChange('frequency_penalty', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Presence Penalty */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3" /> Pres Penalty
             </label>
             <span className="text-xs font-bold text-slate-600">{config.presence_penalty}</span>
          </div>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={config.presence_penalty}
            disabled={disabled}
            onChange={(e) => handleChange('presence_penalty', parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      </div>
    </div>
  );
};