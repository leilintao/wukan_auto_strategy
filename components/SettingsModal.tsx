import React, { useState } from 'react';
import { Settings, X, Save } from 'lucide-react';
import { AIConfig, ServiceProvider, DEFAULT_CONFIG } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: AIConfig;
  onSave: (config: AIConfig) => void;
}

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<AIConfig>(config);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Settings className="w-5 h-5 text-brand-600" />
            AI 模型配置
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">AI 服务提供商</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setLocalConfig({ ...localConfig, provider: ServiceProvider.BAILIAN, baseUrl: DEFAULT_CONFIG.baseUrl, modelName: 'qwen-plus' })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${localConfig.provider === ServiceProvider.BAILIAN ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                阿里云百炼
              </button>
              <button
                onClick={() => setLocalConfig({ ...localConfig, provider: ServiceProvider.GEMINI, modelName: 'gemini-2.5-flash' })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${localConfig.provider === ServiceProvider.GEMINI ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Google Gemini
              </button>
              <button
                onClick={() => setLocalConfig({ ...localConfig, provider: ServiceProvider.CUSTOM })}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${localConfig.provider === ServiceProvider.CUSTOM ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                其他 (OpenAI)
              </button>
            </div>
          </div>

          {/* API Key */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">API Key (必填)</label>
            <input
              type="password"
              value={localConfig.apiKey}
              onChange={(e) => setLocalConfig({ ...localConfig, apiKey: e.target.value })}
              placeholder={localConfig.provider === ServiceProvider.BAILIAN ? "sk-..." : "Your API Key"}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              {localConfig.provider === ServiceProvider.BAILIAN 
                ? "请从阿里云百炼控制台获取 API Key" 
                : "Key 将仅存储在本地浏览器内存中"}
            </p>
          </div>

          {/* Model Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">模型名称</label>
            <input
              type="text"
              value={localConfig.modelName}
              onChange={(e) => setLocalConfig({ ...localConfig, modelName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
               推荐: {localConfig.provider === ServiceProvider.BAILIAN ? 'qwen-plus / qwen-max' : 'gemini-2.5-flash'}
            </p>
          </div>

          {/* Base URL (Conditional) */}
          {(localConfig.provider === ServiceProvider.BAILIAN || localConfig.provider === ServiceProvider.CUSTOM) && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Base URL</label>
              <input
                type="text"
                value={localConfig.baseUrl}
                onChange={(e) => setLocalConfig({ ...localConfig, baseUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          )}

        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all"
          >
            <Save className="w-4 h-4" />
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;