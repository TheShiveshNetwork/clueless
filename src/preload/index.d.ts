export interface ElectronAPI {
  getConfig: () => Promise<{
    apiKey?: string;
    apiProvider?: 'openai' | 'gemini';
    extractionModel?: string;
    solutionModel?: string;
    debuggingModel?: string;
    language?: string;
  }>;

  updateConfig: (config: {
    apiKey?: string;
    apiProvider?: 'openai' | 'gemini';
    extractionModel?: string;
    solutionModel?: string;
    debuggingModel?: string;
    language?: string;
  }) => Promise<boolean>;

  checkApiKey: () => Promise<boolean>;

  validateApiKey: (apiKey: string) => Promise<{
    valid: boolean;
    error?: string;
  }>;

  openLink: (url: string) => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
