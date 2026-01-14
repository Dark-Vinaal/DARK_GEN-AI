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

const getApiKey = () => {
  // Robust check for API key: try import.meta.env first, then process.env
  // Uses optional chaining (?.) to prevent crashes if objects are undefined
  const key = import.meta.env?.VITE_GEMINI_API_KEY || 
              (typeof process !== 'undefined' ? process.env?.VITE_GEMINI_API_KEY : undefined);

  // Basic validation to ensure placeholder keys aren't used
  if (!key || key.includes("PLACE_YOUR_KEY") || key.includes("ENTER_YOUR_KEY")) {
    return "";
  }
  return key;
}

export const sendMessageToGemini = async (
  { text, file, signal }: SendMessageParams,
  onStream: (chunk: string) => void
) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Missing Gemini API Key. Please check your .env configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelId = 'gemini-3-flash-preview';

  const parts: any[] = [];
  if (file) {
    const imagePart = await fileToPart(file);
    parts.push(imagePart);
  }
  parts.push({ text });

  const response = await ai.models.generateContentStream({
    model: modelId,
    contents: {
      parts: parts
    }
  });

  for await (const chunk of response) {
    if (signal?.aborted) {
      break;
    }
    if (chunk.text) {
      onStream(chunk.text);
    }
  }
};

export const generateImageWithGemini = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Missing Gemini API Key. Please check your .env configuration.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  // Use gemini-2.5-flash-image for standard image generation
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any
      }
    }
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const generateVideoWithVeo = async (prompt: string): Promise<string> => {
  // Ensure Key Selection for Veo
  // Cast window to any to avoid potential type conflict with global declarations
  const win = window as any;
  if (win.aistudio && await win.aistudio.hasSelectedApiKey() === false) {
     await win.aistudio.openSelectKey();
     // Re-instantiate needed if key changed, but for now we proceed
  }

  const apiKey = getApiKey();
  const ai = new GoogleGenAI({ apiKey });
  
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  // Poll for completion
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }

  const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!videoUri) throw new Error("Video generation failed");
  
  // The URI needs the API Key appended to fetch the binary
  return `${videoUri}&key=${apiKey}`;
};