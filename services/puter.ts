import { SendMessageParams } from "../types";

export const sendMessageToPuter = async (
  { text, file }: SendMessageParams,
  onStream: (chunk: string) => void
) => {
  
  // OPTIMIZATION: Heavy library (@heyputer/puter.js) is ONLY loaded when needed.
  let puter;
  try {
    const puterModule = await import('@heyputer/puter.js');
    puter = puterModule.default || puterModule;
  } catch (err) {
    console.error("Failed to load Puter.js SDK:", err);
    throw new Error("Could not load the Puter AI service. Please check your internet connection.");
  }

  // Puter currently processes text primarily. 
  let prompt = text;
  if (file) {
    prompt = `[System: The user attached a file named ${file.name} (${file.type}), but direct file analysis is limited in this fallback mode.]\n\n${text}`;
  }

  try {
    // Attempt to stream
    const response = await puter.ai.chat(prompt, { stream: true });

    // Check if response is actually iterable (Generator)
    if (response && typeof response[Symbol.asyncIterator] === 'function') {
      for await (const part of response) {
        // Handle different chunk formats (string or object)
        const content = typeof part === 'string' ? part : part?.text || '';
        onStream(content);
      }
    } else {
      // Fallback if not iterable (e.g. single response object)
      const content = typeof response === 'string' 
        ? response 
        : response?.message?.content || response?.text || '';
      
      onStream(content);
    }
  } catch (error) {
    console.error("Puter.js error:", error);
    throw error;
  }
};