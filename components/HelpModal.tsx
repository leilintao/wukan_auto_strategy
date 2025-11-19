import React from 'react';
import { HelpCircle, X, ExternalLink, CheckCircle, Share2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-brand-600" />
            使用说明与交付指南
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 text-slate-600">
          
          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-3">流程总览</h3>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <div>
                  <p className="font-medium text-slate-900">数据录入</p>
                  <p className="text-sm">在「信息录入」页面填写产品的基础信息和竞争对手信息。未填写的字段将默认为"暂无"。</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <div>
                  <p className="font-medium text-slate-900">提示词确认</p>
                  <p className="text-sm">系统会自动生成专业的战略分析提示词。您可以在此步骤手动微调，然后点击"提交 AI 分析"。</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <div>
                  <p className="font-medium text-slate-900">报告生成与交付</p>
                  <p className="text-sm">AI 生成报告后，点击底部的 <span className="font-bold text-slate-800">"导出 PDF"</span> 按钮。系统会生成一份排版整洁的文档，可直接发送给管理层或同事。</p>
                </div>
              </div>
            </div>
          </section>

          <div className="h-px bg-slate-200 my-2"></div>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
               <Share2 className="w-5 h-5 text-brand-600" />
               如何将此工具分享给同事？
            </h3>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3 text-sm text-blue-800">
              <p>本工具是一个 Web 应用程序。若要让同事使用：</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li><span className="font-semibold">部署链接：</span> 如果IT部门已将此应用部署，直接发送网址（URL）给同事即可。</li>
                <li><span className="font-semibold">本地运行：</span> 如果是源代码形式，同事需要安装 Node.js 环境并在终端运行 <code>npm start</code>。</li>
                <li><span className="font-semibold">交付成果而非工具：</span> 推荐您自己使用工具生成 PDF 报告，然后直接将 <strong>PDF</strong> 发送给同事，这是最最高效的交付方式。</li>
              </ol>
            </div>
          </section>

          <div className="h-px bg-slate-200 my-2"></div>

          <section>
            <h3 className="text-lg font-bold text-slate-900 mb-3">关于阿里云百炼 (Qwen) API</h3>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 text-sm">
              <p>本工具默认配置支持阿里云百炼 API (OpenAI 兼容模式)。</p>
              <ul className="space-y-2 list-disc list-inside">
                <li>
                  <strong>获取 Key:</strong> 访问 <a href="https://bailian.console.aliyun.com/" target="_blank" className="text-brand-600 hover:underline inline-flex items-center">阿里云百炼控制台 <ExternalLink className="w-3 h-3 ml-1"/></a>，创建 API Key。
                </li>
                <li>
                  <strong>配置:</strong> 点击右上角 <Settings className="w-3 h-3 inline mx-1"/> 图标，选择"阿里云百炼"。
                </li>
                <li>
                  <strong>Base URL:</strong> 默认为 <code>https://dashscope.aliyuncs.com/compatible-mode/v1</code>
                </li>
                <li>
                  <strong>Model:</strong> 推荐使用 <code>qwen-plus</code> 或 <code>qwen-max</code> 以获得最佳的逻辑推理能力。
                </li>
              </ul>
            </div>
          </section>

        </div>

        <div className="p-6 border-t bg-slate-50 flex justify-end">
          <button onClick={onClose} className="bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors">
            我已了解
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
function Settings(props: any) { return null; }
