export type Role = 'user' | 'assistant' | 'system';
export type AIProvider = 'gemini' | 'puter';
export type AppTab = 'chat' | 'image' | 'video';

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
}

export interface SendMessageParams {
  text: string;
  file?: File;
  signal?: AbortSignal; // For stopping generation
}

// Global Puter interface assumption
declare global {
  interface Window {
    puter?: {
      ai: {
        chat: (prompt: string, options?: { stream?: boolean; model?: string }) => Promise<any>;
      }
    };
  }
}