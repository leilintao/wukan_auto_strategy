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
  comp1: string;
  comp2: string;
  priceComp1: string;
  priceComp2: string;
  priceOverlap1: string;
  priceOverlap2: string;
  highPrice1: string;
  highPrice2: string;
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
  priceOverlap1: '',
  priceOverlap2: '',
  highPrice1: '',
  highPrice2: '',
};

export const DEFAULT_CONFIG: AIConfig = {
  provider: ServiceProvider.BAILIAN,
  apiKey: '', // User must input
  modelName: 'qwen-max', // Updated default to qwen-max
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
};