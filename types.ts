export enum ServiceProvider {
  GEMINI = 'GEMINI',
  BAILIAN = 'BAILIAN', // Alibaba Cloud
  CUSTOM = 'CUSTOM'
}

export interface AIConfig {
  provider: ServiceProvider;
  apiKey: string;
  modelName: string;
  baseUrl?: string; // For Bailian/Custom
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning?: string; // Field to store Chain of Thought / Deep Thinking
}

export interface FormData {
  // Core Product Info
  productName: string;
  productType: string;
  priceRange: string;
  actualPrice: string;
  launchDate: string;
  dataCutoff: string;
  salesTarget: string;
  coreSellingPoints: string;
  cockpitSystem: string;
  smartDrivingSystem: string;
  energyType: string;
  marketSegment: string;

  // Competitors (Matrix)
  comp1: string; // 定位对标_1
  comp2: string; // 定位对标_2
  priceComp1: string; // 价格重叠_1
  priceComp2: string; // 价格重叠_2
  priceComp3: string; // 价格重叠_3 (New)
  priceComp4: string; // 价格重叠_4 (New)
  highPrice1: string; // 高价位标杆_1
  highPrice2: string; // 高价位标杆_2
}

export const INITIAL_FORM_DATA: FormData = {
  productName: '',
  productType: '',
  priceRange: '',
  actualPrice: '',
  launchDate: '',
  dataCutoff: '',
  salesTarget: '',
  coreSellingPoints: '',
  cockpitSystem: '',
  smartDrivingSystem: '',
  energyType: '',
  marketSegment: '',
  comp1: '',
  comp2: '',
  priceComp1: '',
  priceComp2: '',
  priceComp3: '',
  priceComp4: '',
  highPrice1: '',
  highPrice2: '',
};

export const DEFAULT_CONFIG: AIConfig = {
  provider: ServiceProvider.BAILIAN,
  apiKey: '', // User must input
  modelName: 'qwen3-max',
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
};