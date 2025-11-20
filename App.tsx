import React, { useState, useEffect, useRef } from 'react';
import { Settings, HelpCircle, ChevronRight, Play, FileText, BarChart3, Check, Printer, Edit3, Eye, Send, Bot, User, Copy, Download, StopCircle, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SettingsModal from './components/SettingsModal';
import HelpModal from './components/HelpModal';
import ResearchLog from './components/ResearchLog';
import { FormData, INITIAL_FORM_DATA, AIConfig, DEFAULT_CONFIG, ChatMessage } from './types';
import { generateStrategyPrompt } from './constants';
import { streamAnalysis } from './services/aiService';

enum Step {
  INPUT = 0,
  PREVIEW = 1,
  RESULT = 2
}

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
       window.scrollBy({ top: 100, behavior: 'smooth' });
    }
  }, [messages, isLoading, step]);

  const handleToPreview = () => {
    const generated = generateStrategyPrompt(formData);
    setPromptText(generated);
    setStep(Step.PREVIEW);
    setIsEditingPrompt(false);
  };

  const runStream = async (historyToUse: ChatMessage[]) => {
    if (!config.apiKey) {
      setIsSettingsOpen(true);
      setErrorMsg("请先配置 API Key");
      return;
    }
    
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setErrorMsg(null);

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

  const handleStartAnalysis = async () => {
    setStep(Step.RESULT);
    const initialHistory: ChatMessage[] = [{ role: 'user', content: promptText }];
    setMessages(initialHistory);
    await runStream(initialHistory);
  };

  const handleSendMessage = async () => {
    if (!currentInput.trim() || isLoading) return;

    const newUserMsg: ChatMessage = { role: 'user', content: currentInput };
    const updatedMessages = [...messages, newUserMsg];
    
    setMessages(updatedMessages);
    setCurrentInput('');
    
    await runStream(updatedMessages);
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handlePrint = (index: number) => {
    setPrintingIndex(index);
    setTimeout(() => {
      window.print();
      setPrintingIndex(null);
    }, 100);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("已复制内容");
  };

  const handleDownloadMD = (content: string) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategy-report-${new Date().toISOString().slice(0,10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const FooterDisclaimer = () => (
    <div className="w-full py-4 text-center border-t border-slate-200 bg-slate-50/80 backdrop-blur-sm mt-auto no-print">
      <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
        GAC ONLY • 商用禁止 • 解释权归产品本部雷林焘
      </p>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm no-print">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-brand-600 p-2 rounded-lg text-white shadow-lg shadow-brand-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 leading-none">五看 (WuKan)</h1>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 tracking-wide">汽车产品战略分析 AI 助手</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setIsHelpOpen(true)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all" title="使用说明">
              <HelpCircle className="w-5 h-5" />
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-full transition-all" title="设置 API">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Progress Stepper */}
        <div className="max-w-3xl mx-auto px-4 mt-[-1px]">
          <div className="flex items-center justify-between py-3 text-xs font-medium text-slate-500">
            <div className={`flex items-center gap-2 ${step >= Step.INPUT ? 'text-brand-600' : ''}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${step >= Step.INPUT ? 'bg-brand-100 text-brand-600' : 'bg-slate-100'}`}>1</div>
              <span>信息录入</span>
            </div>
            <div className="h-px w-12 bg-slate-200" />
            <div className={`flex items-center gap-2 ${step >= Step.PREVIEW ? 'text-brand-600' : ''}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${step >= Step.PREVIEW ? 'bg-brand-100 text-brand-600' : 'bg-slate-100'}`}>2</div>
              <span>策略生成</span>
            </div>
            <div className="h-px w-12 bg-slate-200" />
            <div className={`flex items-center gap-2 ${step >= Step.RESULT ? 'text-brand-600' : ''}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${step >= Step.RESULT ? 'bg-brand-100 text-brand-600' : 'bg-slate-100'}`}>3</div>
              <span>智能分析</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
          
          {/* Step 1: Input */}
          {step === Step.INPUT && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:p-8">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
                  <FileText className="w-5 h-5 text-brand-500" />
                  核心产品与目标定义
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  <InputGroup label="产品名称" value={formData.productName} onChange={v => setFormData({...formData, productName: v})} placeholder="本品的全名（含年款）" />
                  <InputGroup label="产品类型" value={formData.productType} onChange={v => setFormData({...formData, productType: v})} placeholder="细分市场/定位" />
                  
                  <InputGroup label="价格区间" value={formData.priceRange} onChange={v => setFormData({...formData, priceRange: v})} placeholder="官方上市指导价范围" half />
                  <InputGroup label="实际价格" value={formData.actualPrice} onChange={v => setFormData({...formData, actualPrice: v})} placeholder="当前终端有效/优惠后价格" half />
                  
                  <InputGroup label="上市日期" value={formData.launchDate} onChange={v => setFormData({...formData, launchDate: v})} placeholder="市场投放日期" half />
                  <InputGroup label="数据截止日" value={formData.dataCutoff} onChange={v => setFormData({...formData, dataCutoff: v})} placeholder="本次分析的“当前日期”" half />
                  
                  <InputGroup label="销量目标" value={formData.salesTarget} onChange={v => setFormData({...formData, salesTarget: v})} placeholder="期望的月度稳定销量目标" />
                  <InputGroup label="核心卖点 (KSP)" value={formData.coreSellingPoints} onChange={v => setFormData({...formData, coreSellingPoints: v})} placeholder="上市时定义的3-5个关键卖点" />
                  
                  <InputGroup label="关键自研技术" value={formData.cockpitSystem} onChange={v => setFormData({...formData, cockpitSystem: v})} placeholder="智能座舱系统" half />
                  <InputGroup label="关键供应商技术" value={formData.smartDrivingSystem} onChange={v => setFormData({...formData, smartDrivingSystem: v})} placeholder="智能驾驶系统" half />
                  
                  <InputGroup label="能源形式" value={formData.energyType} onChange={v => setFormData({...formData, energyType: v})} placeholder="能源类型约束 (PHEV / EREV)" half />
                  <InputGroup label="此次分析所关注的价格带" value={formData.marketSegment} onChange={v => setFormData({...formData, marketSegment: v})} placeholder="市场分析所关注的价格范围" half />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 lg:p-8">
                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
                  <BarChart3 className="w-5 h-5 text-brand-500" />
                  竞争矩阵定义
                </h2>
                <div className="grid grid-cols-2 gap-6">
                   <div className="col-span-2 grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-[-10px]">核心对标 (直接意向/渴望的对手)</p>
                      <InputGroup label="核心竞品 1" value={formData.comp1} onChange={v => setFormData({...formData, comp1: v})} placeholder="定位对标竞品 1" half />
                      <InputGroup label="核心竞品 2" value={formData.comp2} onChange={v => setFormData({...formData, comp2: v})} placeholder="定位对标竞品 2" half />
                   </div>

                   <div className="col-span-2 grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-[-10px]">价格重叠 (同价位区间的核心对手)</p>
                      <InputGroup label="价格重叠竞品 1" value={formData.priceComp1} onChange={v => setFormData({...formData, priceComp1: v})} placeholder="价格重叠竞品 1" half />
                      <InputGroup label="价格重叠竞品 2" value={formData.priceComp2} onChange={v => setFormData({...formData, priceComp2: v})} placeholder="价格重叠竞品 2" half />
                      <InputGroup label="价格重叠竞品 3" value={formData.priceComp3} onChange={v => setFormData({...formData, priceComp3: v})} placeholder="价格重叠竞品 3" half />
                      <InputGroup label="价格重叠竞品 4" value={formData.priceComp4} onChange={v => setFormData({...formData, priceComp4: v})} placeholder="价格重叠竞品 4" half />
                   </div>

                   <div className="col-span-2 grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="col-span-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-[-10px]">高价位标杆 (价格高于本品但销量高)</p>
                      <InputGroup label="高价位标杆 1" value={formData.highPrice1} onChange={v => setFormData({...formData, highPrice1: v})} placeholder="高价位标杆 1" half />
                      <InputGroup label="高价位标杆 2" value={formData.highPrice2} onChange={v => setFormData({...formData, highPrice2: v})} placeholder="高价位标杆 2" half />
                   </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 pb-8">
                <button 
                  onClick={handleToPreview}
                  className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-brand-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  下一步：生成策略提示词
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Preview */}
          {step === Step.PREVIEW && (
            <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-180px)]">
                  <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-bold text-slate-700 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-brand-500" />
                      提示词预览 (Prompt)
                    </h2>
                    <button 
                      onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-brand-600 bg-white px-3 py-1.5 rounded-md border border-slate-200 hover:border-brand-200 transition-all"
                    >
                      {isEditingPrompt ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                      {isEditingPrompt ? '预览渲染' : '编辑提示词'}
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
                    {isEditingPrompt ? (
                      <textarea 
                        className="w-full h-full p-4 font-mono text-sm text-slate-700 bg-slate-50 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                      />
                    ) : (
                      <div className="prose max-w-none prose-headings:font-bold prose-h1:text-brand-900 prose-h2:text-sky-600 prose-h2:border-b-2 prose-h2:border-slate-200 prose-h2:pb-2 prose-h3:text-slate-800 prose-table:text-sm prose-th:bg-slate-100 prose-th:text-slate-700 prose-td:text-slate-600 prose-blockquote:bg-brand-50 prose-blockquote:border-l-brand-500 prose-blockquote:text-brand-900 prose-blockquote:not-italic prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{promptText}</ReactMarkdown>
                      </div>
                    )}
                  </div>

                  <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                     <button 
                      onClick={() => setStep(Step.INPUT)}
                      className="text-slate-500 hover:text-slate-800 font-medium text-sm px-4"
                    >
                      返回修改
                    </button>
                    <button 
                      onClick={handleStartAnalysis}
                      className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-6 py-2.5 rounded-lg font-semibold shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.02]"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      提交分析 (Deep Research)
                    </button>
                  </div>
               </div>
            </div>
          )}

          {/* Step 3: Result (Chat Interface) */}
          {step === Step.RESULT && (
            <div className="max-w-4xl mx-auto space-y-8 pb-24">
               {messages.map((msg, idx) => {
                 if (msg.role === 'system') return null;
                 const isUser = msg.role === 'user';
                 
                 return (
                   <div 
                    key={idx} 
                    className={`group relative flex flex-col ${isUser ? 'items-end' : 'items-start'} w-full print-target`}
                   > 
                      {/* Deep Thinking Log (Only for Assistant) */}
                      {!isUser && msg.reasoning && (
                        <div className="w-full mb-2 px-1">
                          <ResearchLog content={msg.reasoning} isActive={isLoading && idx === messages.length - 1} />
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div className={`
                        relative px-6 py-5 text-[15px] leading-relaxed w-full max-w-full
                        ${isUser 
                          ? 'bg-brand-600 text-white rounded-2xl rounded-tr-sm shadow-md ml-auto w-fit' 
                          : 'bg-white text-slate-800 rounded-2xl shadow-sm border border-slate-100 w-full'
                        }
                      `}>
                         {isUser ? (
                           <div className="whitespace-pre-wrap">{msg.content}</div>
                         ) : (
                           <div className="prose max-w-none prose-headings:font-bold prose-h1:text-brand-900 prose-h2:text-sky-600 prose-h2:border-b-2 prose-h2:border-slate-200 prose-h2:pb-2 prose-h3:text-slate-800 prose-table:text-sm prose-th:bg-slate-100 prose-th:text-slate-700 prose-td:text-slate-600 prose-blockquote:bg-brand-50 prose-blockquote:border-l-brand-500 prose-blockquote:text-brand-900 prose-blockquote:not-italic prose-a:text-brand-600 prose-a:no-underline hover:prose-a:underline overflow-x-auto">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                           </div>
                         )}
                      </div>

                      {/* Action Bar (Only for Assistant) */}
                      {!isUser && !isLoading && (msg.content.length > 0) && (
                        <div className="flex items-center gap-2 mt-2 ml-2 opacity-0 group-hover:opacity-100 transition-opacity no-print">
                          <button onClick={() => handleCopy(msg.content)} className="p-1.5 text-slate-400 hover:text-brand-600 rounded hover:bg-slate-100 transition-colors" title="复制">
                            <Copy className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDownloadMD(msg.content)} className="p-1.5 text-slate-400 hover:text-brand-600 rounded hover:bg-slate-100 transition-colors" title="下载 Markdown">
                            <Download className="w-4 h-4" />
                          </button>
                           <button onClick={() => handlePrint(idx)} className="p-1.5 text-slate-400 hover:text-brand-600 rounded hover:bg-slate-100 transition-colors" title="导出 PDF">
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                   </div>
                 );
               })}

               {/* Loading Indicator (If waiting for start) */}
               {isLoading && messages.length === 0 && (
                 <div className="flex justify-center py-12">
                    <div className="flex flex-col items-center gap-3 animate-pulse">
                      <div className="w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                      <span className="text-sm font-medium text-slate-400">AI 正在分析中...</span>
                    </div>
                 </div>
               )}

               {/* Error Message */}
               {errorMsg && (
                 <div className="p-4 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm text-center">
                   {errorMsg}
                 </div>
               )}
               
               <div ref={chatEndRef} className="h-4" />
            </div>
          )}
        </div>
      </main>

      {/* Chat Input Bar (Only in Result Step) */}
      {step === Step.RESULT && (
        <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-40 no-print">
           <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 p-2 flex items-end gap-2 transition-all focus-within:ring-2 focus-within:ring-brand-500/20">
              <textarea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="对当前结果有疑问？继续追问 AI..."
                className="flex-1 max-h-32 min-h-[44px] py-2.5 px-4 bg-transparent outline-none text-sm text-slate-800 resize-none custom-scrollbar"
                rows={1}
              />
              {isLoading ? (
                <button 
                  onClick={handleStop}
                  className="p-2.5 mb-0.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl transition-all flex items-center gap-1.5 pr-3"
                >
                  <StopCircle className="w-5 h-5" />
                  <span className="text-xs font-bold">停止</span>
                </button>
              ) : (
                <button 
                  onClick={handleSendMessage}
                  disabled={!currentInput.trim()}
                  className="p-2.5 mb-0.5 bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 rounded-xl transition-all shadow-sm disabled:shadow-none"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
           </div>
        </div>
      )}

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
      
      <FooterDisclaimer />
    </div>
  );
}