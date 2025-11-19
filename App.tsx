import React, { useState, useEffect } from 'react';
import { Settings, HelpCircle, ChevronRight, Play, FileText, BarChart3, Check, Printer } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import { FormData, INITIAL_FORM_DATA, AIConfig, DEFAULT_CONFIG } from './types';
import { generateStrategyPrompt } from './constants';
import { generateAnalysis } from './services/aiService';

enum Step {
  INPUT = 0,
  PREVIEW = 1,
  RESULT = 2
}

// --- FIXED: InputGroup moved OUTSIDE of the App component ---
interface InputGroupProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  half?: boolean;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, value, onChange, placeholder, half = false }) => (
  <div className={`${half ? 'col-span-1' : 'col-span-2'}`}>
    <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <input 
      type="text" 
      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);
// -----------------------------------------------------------

export default function App() {
  // State
  const [step, setStep] = useState<Step>(Step.INPUT);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [promptText, setPromptText] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load config from localStorage or default
  const [config, setConfig] = useState<AIConfig>(() => {
    try {
      const saved = localStorage.getItem('wukan_ai_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  });

  // Save config to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('wukan_ai_config', JSON.stringify(config));
  }, [config]);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  // Generate prompt when moving to preview
  const handleToPreview = () => {
    const generated = generateStrategyPrompt(formData);
    setPromptText(generated);
    setStep(Step.PREVIEW);
  };

  // Handle AI Execution
  const handleExecute = async () => {
    if (!config.apiKey) {
      setIsSettingsOpen(true);
      setErrorMsg("请先配置 API Key");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      const result = await generateAnalysis(promptText, config);
      setAnalysisResult(result);
      setStep(Step.RESULT);
    } catch (err: any) {
      setErrorMsg(err.message || "请求失败，请检查网络或配置");
    } finally {
      setIsLoading(false);
    }
  };

  // Download Markdown
  const handleDownloadMD = () => {
    const element = document.createElement("a");
    const file = new Blob([analysisResult], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `${formData.productName || 'Strategy_Analysis'}_Report.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Helper to update form data
  const updateForm = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center shadow-md">
              <BarChart3 className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">五看 (WuKan)</h1>
              <p className="text-xs text-slate-500">汽车产品战略分析 AI 助手</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors" 
              title="使用帮助"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
              title="API 配置"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Progress Steps (Visual Only) */}
      <div className="bg-white border-b border-slate-200 py-4 no-print">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center relative">
           {/* Line */}
           <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-100 -z-10" />
           
           {[
             { id: Step.INPUT, label: "1. 信息录入" },
             { id: Step.PREVIEW, label: "2. 策略生成" },
             { id: Step.RESULT, label: "3. 战略报告" }
           ].map((s, idx) => (
             <div key={s.id} className={`flex flex-col items-center gap-2 bg-white px-4 ${step >= s.id ? 'text-brand-600' : 'text-slate-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s.id ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {step > s.id ? <Check className="w-5 h-5" /> : idx + 1}
                </div>
                <span className="text-sm font-medium">{s.label}</span>
             </div>
           ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 mb-20">
        
        {/* Step 1: Input Form */}
        {step === Step.INPUT && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-1 h-6 bg-brand-500 rounded-full"></span>
                  核心产品与目标定义
                </h2>
                <p className="text-sm text-slate-500 mt-1 ml-3">ISDM 交互式策略定义模块输入</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <InputGroup 
                  label="产品名称 (含年款)" 
                  value={formData.productName}
                  onChange={(v) => updateForm('productName', v)}
                  placeholder="例如：广汽传祺向往S7 (2025款)" 
                />
                <InputGroup 
                  label="产品类型/定位" 
                  value={formData.productType}
                  onChange={(v) => updateForm('productType', v)}
                  placeholder="例如：B/C级大五座新能源SUV" 
                  half 
                />
                <InputGroup 
                  label="市场细分" 
                  value={formData.marketSegment}
                  onChange={(v) => updateForm('marketSegment', v)}
                  placeholder="例如：15-30万家用SUV" 
                  half 
                />
                
                <InputGroup 
                  label="官方指导价范围" 
                  value={formData.priceRange}
                  onChange={(v) => updateForm('priceRange', v)}
                  placeholder="16.98万-22.38万" 
                  half 
                />
                <InputGroup 
                  label="当前终端有效价格" 
                  value={formData.actualPrice}
                  onChange={(v) => updateForm('actualPrice', v)}
                  placeholder="15.98万" 
                  half 
                />
                
                <InputGroup 
                  label="市场投放日期" 
                  value={formData.launchDate}
                  onChange={(v) => updateForm('launchDate', v)}
                  placeholder="2025年3月" 
                  half 
                />
                <InputGroup 
                  label="数据截止日期" 
                  value={formData.dataCutoff}
                  onChange={(v) => updateForm('dataCutoff', v)}
                  placeholder="2025年11月" 
                  half 
                />
                
                <InputGroup 
                  label="期望月销量目标" 
                  value={formData.salesTarget}
                  onChange={(v) => updateForm('salesTarget', v)}
                  placeholder="8000台/月" 
                />
                <InputGroup 
                  label="核心卖点 (KSP)" 
                  value={formData.coreSellingPoints}
                  onChange={(v) => updateForm('coreSellingPoints', v)}
                  placeholder="例如：高阶智驾(Momenta), 骁龙8295座舱..." 
                />
                
                <InputGroup 
                  label="智能座舱系统" 
                  value={formData.cockpitSystem}
                  onChange={(v) => updateForm('cockpitSystem', v)}
                  placeholder="例如：广汽ADiGO智能座舱" 
                  half 
                />
                <InputGroup 
                  label="智能驾驶系统" 
                  value={formData.smartDrivingSystem}
                  onChange={(v) => updateForm('smartDrivingSystem', v)}
                  placeholder="例如：Momenta 高阶智驾方案" 
                  half 
                />
                
                <InputGroup 
                  label="能源形式约束" 
                  value={formData.energyType}
                  onChange={(v) => updateForm('energyType', v)}
                  placeholder="PHEV / EREV / EV" 
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                  竞争矩阵定义
                </h2>
                <p className="text-sm text-slate-500 mt-1 ml-3">定义直接竞品、价格重叠竞品及标杆</p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <InputGroup 
                  label="核心对标竞品 1 (最渴望的对手)" 
                  value={formData.comp1}
                  onChange={(v) => updateForm('comp1', v)}
                  placeholder="例如：理想L6" 
                  half 
                />
                <InputGroup 
                  label="核心对标竞品 2" 
                  value={formData.comp2}
                  onChange={(v) => updateForm('comp2', v)}
                  placeholder="例如：尚界H5" 
                  half 
                />
                
                <InputGroup 
                  label="价格重叠竞品 1" 
                  value={formData.priceComp1}
                  onChange={(v) => updateForm('priceComp1', v)}
                  placeholder="例如：比亚迪唐DM-i" 
                  half 
                />
                <InputGroup 
                  label="价格重叠竞品 2" 
                  value={formData.priceComp2}
                  onChange={(v) => updateForm('priceComp2', v)}
                  placeholder="例如：零跑C16" 
                  half 
                />
                
                <InputGroup 
                  label="价格重叠竞品 3" 
                  value={formData.priceOverlap1}
                  onChange={(v) => updateForm('priceOverlap1', v)}
                  placeholder="例如：启源 Q07" 
                  half 
                />
                <InputGroup 
                  label="价格重叠竞品 4" 
                  value={formData.priceOverlap2}
                  onChange={(v) => updateForm('priceOverlap2', v)}
                  placeholder="例如：比亚迪宋L DM-i" 
                  half 
                />
                
                <InputGroup 
                  label="高价位标杆 1" 
                  value={formData.highPrice1}
                  onChange={(v) => updateForm('highPrice1', v)}
                  placeholder="例如：理想L7" 
                  half 
                />
                <InputGroup 
                  label="高价位标杆 2" 
                  value={formData.highPrice2}
                  onChange={(v) => updateForm('highPrice2', v)}
                  placeholder="例如：问界M7" 
                  half 
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview & Edit */}
        {step === Step.PREVIEW && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 h-[calc(100vh-240px)] flex flex-col animate-in fade-in zoom-in-95 duration-300">
              <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl flex justify-between items-center">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  提示词预览
                </h2>
                <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border">可在此处手动修改提示词</span>
              </div>
              <textarea 
                className="flex-1 p-6 font-mono text-sm text-slate-700 resize-none outline-none focus:bg-slate-50 transition-colors leading-relaxed"
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
              />
           </div>
        )}

        {/* Step 3: Result */}
        {step === Step.RESULT && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
             <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-slate-200 min-h-[60vh] print-content">
                <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-h1:text-brand-700 prose-strong:text-brand-700">
                  <ReactMarkdown>{analysisResult}</ReactMarkdown>
                </div>
             </div>
          </div>
        )}

      </main>

      {/* Footer Actions */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 no-print">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          
          {/* Left Side Actions */}
          <div className="flex items-center gap-4">
            {step > Step.INPUT && (
              <button 
                onClick={() => setStep(step - 1)}
                className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2"
                disabled={isLoading}
              >
                上一步
              </button>
            )}
            {errorMsg && <span className="text-red-500 text-sm font-medium animate-pulse">⚠️ {errorMsg}</span>}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {step === Step.INPUT && (
               <button 
                 onClick={handleToPreview}
                 className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-brand-200"
               >
                 生成提示词 <ChevronRight className="w-4 h-4" />
               </button>
            )}

            {step === Step.PREVIEW && (
              <button 
                onClick={handleExecute}
                disabled={isLoading}
                className={`bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-brand-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    正在分析...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    提交 AI 分析
                  </>
                )}
              </button>
            )}

            {step === Step.RESULT && (
              <>
                 <button 
                   onClick={() => window.print()}
                   className="border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors"
                 >
                   <Printer className="w-4 h-4" />
                   导出 PDF
                 </button>
                 <button 
                   onClick={handleDownloadMD}
                   className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg"
                 >
                   <FileText className="w-4 h-4" />
                   导出 Markdown
                 </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        config={config}
        onSave={setConfig}
      />
      <HelpModal 
        isOpen={isHelpOpen} 
        onClose={() => setIsHelpOpen(false)} 
      />
    </div>
  );
}
