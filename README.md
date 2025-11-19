# 五看 (WuKan) - 汽车战略分析 AI 工具

这是一个基于华为 "五看三定" 方法论的汽车产品战略分析工具。它通过标准化的工作流引导产品经理输入信息，并利用 AI (阿里云百炼 Qwen 或 Google Gemini) 生成深度战略报告。

## 功能特性

*   **结构化录入**：基于 ISDM（交互式策略定义模块）的表单设计。
*   **AI 深度分析**：自动执行 7 步战略分析框架。
*   **多模型支持**：支持阿里云百炼 (Qwen-Plus/Max) 和 Google Gemini。
*   **报告导出**：一键生成适合打印或分享的 PDF 级页面。

## 部署指南 (Vercel)

本代码已配置为适配 Vercel 的标准 Vite 项目结构。

1.  **上传代码**：将本项目所有文件上传至您的 GitHub 仓库。
2.  **导入项目**：在 Vercel 控制台点击 "New Project"，选择刚才的 GitHub 仓库。
3.  **配置**：
    *   Framework Preset: 选择 `Vite`
    *   Build Command: `npm run build`
    *   Output Directory: `dist`
4.  **部署**：点击 Deploy 即可。

## 本地开发

如果您需要在本地运行：

1.  安装依赖：
    ```bash
    npm install
    ```
2.  启动开发服务器：
    ```bash
    npm run dev
    ```
3.  打开浏览器访问 `http://localhost:5173`

## 使用说明

1.  打开网页后，点击右上角的 **设置 (Settings)** 图标。
2.  选择 **阿里云百炼**。
3.  输入您的 API Key（需在阿里云控制台申请）。
4.  开始填写左侧的产品信息，完成后点击生成策略。
