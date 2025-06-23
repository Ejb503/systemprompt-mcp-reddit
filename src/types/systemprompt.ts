export interface SystemPromptConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface SystemPromptTool {
  name: string;
  description: string;
  parameters?: any;
}

export interface SystemPromptResponse {
  success: boolean;
  data?: any;
  error?: string;
}