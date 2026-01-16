export type Role = 'user' | 'assistant' | 'system';
export type AIProvider = 'gemini' | 'puter' | 'openrouter' | 'huggingface';
export type AppTab = 'chat' | 'image' | 'video';

export interface Model {
  id: string;
  name: string;
  provider: AIProvider;
  isFree?: boolean;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  file?: {
    name: string;
    type: string;
    data?: string; // base64
  };
  isStreaming?: boolean;
  isError?: boolean;
  liked?: boolean;
  disliked?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: number;
  preview: string;
  pinned?: boolean;
}

export interface SendMessageParams {
  text: string;
  file?: File;
  modelId?: string;
  signal?: AbortSignal; // For stopping generation
}
