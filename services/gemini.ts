import { GoogleGenAI } from "@google/genai";
import { SendMessageParams } from "../types";

// Helper to convert File to Base64
const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const sendMessageToGemini = async (
  { text, file }: SendMessageParams,
  onStream: (chunk: string) => void
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use gemini-3-flash-preview for Basic Text Tasks
  const modelId = 'gemini-3-flash-preview';

  const parts: any[] = [];
  if (file) {
    const imagePart = await fileToPart(file);
    parts.push(imagePart);
  }
  parts.push({ text });

  // Use generateContentStream for streaming response
  // We use generateContentStream instead of chat for simplicity in this "stateless" function wrapper,
  // but App.tsx maintains the history context if we wanted to expand to full chat.
  // For this implementation, we are sending the last prompt. 
  // To include history, we would construct the 'contents' array with previous messages.
  
  const response = await ai.models.generateContentStream({
    model: modelId,
    contents: {
      parts: parts
    }
  });

  for await (const chunk of response) {
    if (chunk.text) {
      onStream(chunk.text);
    }
  }
};