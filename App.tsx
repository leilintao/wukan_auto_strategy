import React, { useState, useEffect, useRef } from 'react';
import { Settings, HelpCircle, ChevronRight, Play, FileText, BarChart3, Check, Printer, Edit3, Eye, Send, Bot, User, Copy, Download, StopCircle, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import ResearchLog from './components/ResearchLog'; // Import new component
import { FormData, INITIAL_FORM_DATA, AIConfig, DEFAULT_CONFIG, ChatMessage } from './types';
import { generateStrategyPrompt } from './constants';
import { streamAnalysis } from './services/aiService';

enum Step {
  INPUT = 0,
  PREVIEW = 1,
  RESULT = 2
}

// InputGroup Component
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

export default function App() {
  const [step, setStep] = useState<Step>(Step.INPUT);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [promptText, setPromptText] = useState<string>('');
  const [isEditingPrompt, setIsEditingPrompt] = useState<boolean>(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentInput, setCurrentInput] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [printingIndex, setPrintingIndex] = useState<number | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [config, setConfig] = useState<AIConfig>(() => {
    try {
      const saved = localStorage.getItem('wukan_ai_config');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  });

  useEffect(() => {
    localStorage.setItem('wukan_ai_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [step]);

  useEffect(() => {
    if (step === Step.RESULT && isLoading) {
       // Gentle scroll for better reading experience
       window.scrollBy({ top: 100, behavior: 'smooth' });
    }
  }, [messages, isLoading, step]);

  const handleToPreview = () => {
    const generated = generateStrategyPrompt(formData);
    setPromptText(generated);
    setStep(Step.PREVIEW);
    setIsEditingPrompt(false);
  };

  // --- Core Streaming Logic ---
  const runStream = async (historyToUse: ChatMessage[]) => {
    if (!config.apiKey) {
      setIsSettingsOpen(true);
      setErrorMsg("请先配置 API Key");
      return;
    }
    
    // Reset Abort Controller
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setErrorMsg(null);

    // Optimistically add empty assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '', reasoning: '' }]);
    
    try {
      let fullContent = "";
      let fullReasoning = "";
      
      await streamAnalysis(
        historyToUse, 
        config, 
        ({ content, reasoning }) => {
          if (content) fullContent += content;
          if (reasoning) fullReasoning += reasoning;

          setMessages(prev => {
            const newMsgs = [...prev];
            const lastIdx = newMsgs.length - 1;
            if (lastIdx >= 0) {
                newMsgs[lastIdx] = { 
                    ...newMsgs[lastIdx],
                    content: fullContent,
                    reasoning: fullReasoning
                };
            }
            return newMsgs;
          });
        },
        abortControllerRef.current.signal
      );
      
    } catch (err: any) {
      if (err.message !== "已停止生成") {
        setErrorMsg(err.message || "请求失败");
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    setStep(Step.RESULT);
    const initialMsgs: ChatMessage[] = [{ role: 'user', content: promptText }];
    setMessages([]); 
    await runStream(initialMsgs);
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || isLoading) return;
    
    const newUserMsg: ChatMessage = { role: 'user', content: currentInput };
    const newHistory = [...messages, newUserMsg];
    setMessages(newHistory);
    setCurrentInput('');
    
    const apiMessages: ChatMessage[] = [
        { role: 'user', content: promptText },
        ...newHistory
    ];

    await runStream(apiMessages);
  };

  // --- Action Handlers ---
  const handleCopyText = (text: string) => navigator.clipboard.writeText(text);

  const handleDownloadMsgMD = (content: string, index: number) => {
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/markdown'});
    element.href = URL.createObjectURL(file);
    element.download = `Strategy_Report_${index + 1}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrintMessage = (index: number) => {
    setPrintingIndex(index);
    setTimeout(() => {
      window.print();
      setPrintingIndex(null);
    }, 100);
  };

  const updateForm = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30 no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-md text-white">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">五看 (WuKan)</h1>
              <p className="text-xs text-slate-500">汽车产品战略分析 AI 助手</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsHelpOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"><HelpCircle className="w-5 h-5" /></button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"><Settings className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      {/* Steps Navigation */}
      {step !== Step.RESULT && (
        <div className="bg-white border-b border-slate-200 py-4 no-print">
            <div className="max-w-4xl mx-auto px-4 flex justify-between items-center relative">
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
      )}

      {/* Main Content */}
      <main className={`flex-1 w-full mx-auto ${step === Step.RESULT ? 'max-w-4xl px-4 pb-32' : 'max-w-5xl p-6 mb-24'}`}>
        
        {/* Step 1: Input */}
        {step === Step.INPUT && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><span className="w-1 h-6 bg-brand-500 rounded-full"></span>核心产品与目标定义</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <InputGroup label="产品名称" value={formData.productName} onChange={(v) => updateForm('productName', v)} placeholder="本品的全名（含年款）。" />
                <InputGroup label="产品类型/定位" value={formData.productType} onChange={(v) => updateForm('productType', v)} placeholder="细分市场/定位。" half />
                <InputGroup label="此次分析所关注的价格带" value={formData.marketSegment} onChange={(v) => updateForm('marketSegment', v)} placeholder="此次分析所关注的价格带。" half />
                <InputGroup label="官方指导价范围" value={formData.priceRange} onChange={(v) => updateForm('priceRange', v)} placeholder="官方上市指导价范围。" half />
                <InputGroup label="终端有效价格" value={formData.actualPrice} onChange={(v) => updateForm('actualPrice', v)} placeholder="当前终端有效/优惠后价格。" half />
                <InputGroup label="投放日期" value={formData.launchDate} onChange={(v) => updateForm('launchDate', v)} placeholder="市场投放日期。" half />
                <InputGroup label="数据截止日期" value={formData.dataCutoff} onChange={(v) => updateForm('dataCutoff', v)} placeholder="本次分析的“当前日期”。" half />
                <InputGroup label="期望月销量" value={formData.salesTarget} onChange={(v) => updateForm('salesTarget', v)} placeholder="期望的月度稳定销量目标。" />
                <InputGroup label="核心卖点 (KSP)" value={formData.coreSellingPoints} onChange={(v) => updateForm('coreSellingPoints', v)} placeholder="3-5个关键卖点。" />
                <InputGroup label="关键自研技术" value={formData.cockpitSystem} onChange={(v) => updateForm('cockpitSystem', v)} placeholder="智能座舱系统" half />
                <InputGroup label="关键供应商技术" value={formData.smartDrivingSystem} onChange={(v) => updateForm('smartDrivingSystem', v)} placeholder="智能驾驶系统" half />
                <InputGroup label="能源形式" value={formData.energyType} onChange={(v) => updateForm('energyType', v)} placeholder="PHEV / EREV" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="mb-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><span className="w-1 h-6 bg-orange-500 rounded-full"></span>竞争矩阵定义</h2>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <InputGroup label="核心对标竞品 1" value={formData.comp1} onChange={(v) => updateForm('comp1', v)} placeholder="例如：理想L6" half />
                <InputGroup label="核心对标竞品 2" value={formData.comp2} onChange={(v) => updateForm('comp2', v)} placeholder="例如：尚界H5" half />
                <InputGroup label="价格重叠竞品 1" value={formData.priceComp1} onChange={(v) => updateForm('priceComp1', v)} placeholder="例如：比亚迪唐DM-i" half />
                <InputGroup label="价格重叠竞品 2" value={formData.priceComp2} onChange={(v) => updateForm('priceComp2', v)} placeholder="例如：零跑C16" half />
                <InputGroup label="价格重叠竞品 3" value={formData.priceOverlap1} onChange={(v) => updateForm('priceOverlap1', v)} placeholder="例如：启源 Q07" half />
                <InputGroup label="价格重叠竞品 4" value={formData.priceOverlap2} onChange={(v) => updateForm('priceOverlap2', v)} placeholder="例如：比亚迪宋L DM-i" half />
                <InputGroup label="高价位标杆 1" value={formData.highPrice1} onChange={(v) => updateForm('highPrice1', v)} placeholder="例如：理想L7" half />
                <InputGroup label="高价位标杆 2" value={formData.highPrice2} onChange={(v) => updateForm('highPrice2', v)} placeholder="例如：问界M7" half />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === Step.PREVIEW && (
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[calc(100vh-240px)] flex flex-col">
              <div className="p-4 border-b border-slate-100 bg-slate-50 rounded-t-xl flex justify-between items-center">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2"><FileText className="w-5 h-5" /> 提示词预览</h2>
                <button onClick={() => setIsEditingPrompt(!isEditingPrompt)} className="text-sm flex items-center gap-2 text-brand-600 bg-white px-3 py-1.5 rounded border border-brand-200 hover:bg-brand-50 transition-colors">
                  {isEditingPrompt ? <><Eye className="w-4 h-4" /> 预览效果</> : <><Edit3 className="w-4 h-4" /> 编辑提示词</>}
                </button>
              </div>
              {isEditingPrompt ? (
                <textarea className="flex-1 p-6 font-mono text-sm resize-none outline-none min-h-[500px]" value={promptText} onChange={(e) => setPromptText(e.target.value)} />
              ) : (
                // Removed 'prose-slate' to let custom typography config in index.html take over
                <div className="flex-1 p-8 overflow-y-auto bg-white min-h-[500px]"><div className="prose max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{promptText}</ReactMarkdown></div></div>
              )}
           </div>
        )}

        {/* Step 3: Chat Interface */}
        {step === Step.RESULT && (
          <div className="mt-6 space-y-8 w-full overflow-x-hidden">
             {messages.map((msg, index) => {
               const isAssistant = msg.role === 'assistant';
               const isPrinting = printingIndex === index;
               const isLast = index === messages.length - 1;

               return (
                 <div key={index} className={`flex gap-4 md:gap-5 ${isPrinting ? 'print-target' : ''} group w-full max-w-full`}>
                   {isAssistant && (
                     <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center flex-shrink-0 mt-1 no-print shadow-sm">
                       <Sparkles className="text-white w-4 h-4" />
                     </div>
                   )}
                   
                   {/* Message Content Container - Critical max-w-full and overflow handling */}
                   <div className={`flex flex-col min-w-0 max-w-full ${isAssistant ? 'flex-1' : 'ml-auto max-w-[85%]'}`}>
                      {/* User Message Style */}
                      {!isAssistant && (
                        <div className="bg-slate-100 text-slate-800 px-5 py-3.5 rounded-2xl rounded-tr-md self-end shadow-sm break-words max-w-full">
                           <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                        </div>
                      )}

                      {/* Assistant Message Style */}
                      {isAssistant && (
                        <div className="space-y-4 w-full min-w-0 max-w-full">
                           {/* Deep Research Accordion */}
                           {msg.reasoning && (
                             <div className="no-print w-full max-w-full">
                                <ResearchLog content={msg.reasoning} isActive={isLoading && isLast} />
                             </div>
                           )}

                           {/* Main Content */}
                           {/* Removed 'prose-slate' to allow custom index.html typography styles (blue headings etc) to work */}
                           <div className="prose max-w-none leading-7 text-slate-700 w-full">
                              {/* Wrap in a div that handles overflow for tables/code blocks */}
                              <div className="break-words w-full overflow-x-auto">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                              </div>
                           </div>
                           
                           {/* Loading State */}
                           {isLoading && isLast && !msg.content && !msg.reasoning && (
                              <div className="flex items-center gap-2 text-slate-400 py-4">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                              </div>
                           )}

                           {/* Message Actions */}
                           {!isLoading && (
                            <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity pt-2 no-print">
                              <button onClick={() => handleCopyText(msg.content)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-600 transition-colors">
                                <Copy className="w-3.5 h-3.5" /> 复制
                              </button>
                              <button onClick={() => handleDownloadMsgMD(msg.content, index)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-600 transition-colors">
                                <Download className="w-3.5 h-3.5" /> 下载MD
                              </button>
                              <button onClick={() => handlePrintMessage(index)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-brand-600 transition-colors">
                                <Printer className="w-3.5 h-3.5" /> 导出PDF
                              </button>
                            </div>
                           )}
                        </div>
                      )}
                   </div>
                 </div>
               );
             })}
             <div ref={chatEndRef} />
             
             {/* Floating Input Bar */}
             <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl px-4 z-50 no-print">
               <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 flex items-end gap-2 p-2 pr-3 transition-shadow hover:shadow-xl ring-1 ring-slate-100">
                  <textarea 
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={isLoading ? "AI 正在分析中..." : "输入问题以继续追问..."}
                    disabled={isLoading}
                    rows={1}
                    className="flex-1 outline-none text-slate-700 bg-transparent py-3 px-4 max-h-32 min-h-[48px] resize-none"
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                  />
                  
                  <div className="pb-1.5">
                    {isLoading ? (
                      <button 
                        onClick={handleStop} 
                        className="p-2 rounded-xl bg-slate-100 text-red-500 hover:bg-red-50 transition-all"
                        title="停止生成"
                      >
                        <StopCircle className="w-5 h-5 fill-current" />
                      </button>
                    ) : (
                      <button 
                        onClick={handleSendMessage} 
                        disabled={!currentInput.trim()} 
                        className="p-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-100 disabled:text-slate-300 transition-all shadow-sm"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    )}
                  </div>
               </div>
               <div className="text-center mt-2">
                 <p className="text-[10px] text-slate-400 font-medium tracking-wider">GAC ONLY • 商用禁止 • 解释权归产品本部雷林焘</p>
               </div>
             </div>
          </div>
        )}

      </main>

      {/* Footer Controls (Steps 0 & 1 only) */}
      {step < Step.RESULT && (
        <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 no-print">
          <div className="max-w-5xl mx-auto flex flex-col gap-2">
            <div className="flex justify-between items-center w-full">
              <div className="flex items-center gap-4">
                {step > Step.INPUT && <button onClick={() => setStep(step - 1)} className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2">上一步</button>}
              </div>
              <div className="flex items-center gap-3">
                {step === Step.INPUT && <button onClick={handleToPreview} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-brand-200 transition-all hover:shadow-brand-300">生成提示词 <ChevronRight className="w-4 h-4" /></button>}
                {step === Step.PREVIEW && <button onClick={handleExecute} className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-brand-200 transition-all hover:shadow-brand-300"><Play className="w-4 h-4" /> 提交 AI 分析</button>}
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-slate-400 font-medium tracking-wider">GAC ONLY • 商用禁止 • 解释权归产品本部雷林焘</p>
            </div>
          </div>
        </footer>
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} config={config} onSave={setConfig} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}