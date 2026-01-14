import { SendMessageParams } from "../types";

export const sendMessageToPuter = async (
  { text, file }: SendMessageParams,
  onStream: (chunk: string) => void
) => {
  
  // OPTIMIZATION: Heavy library (@heyputer/puter.js) is ONLY loaded when needed.
  // We use a try-catch block around the import to handle network failures or blocking.
  let puter;
  try {
    const puterModule = await import('@heyputer/puter.js');
    puter = puterModule.default || puterModule;
  } catch (err) {
    console.error("Failed to load Puter.js SDK:", err);
    throw new Error("Could not load the Puter AI service. Please check your internet connection.");
  }

  // Puter currently processes text primarily. 
  // If a file is present, we append a note to the prompt.
  let prompt = text;
  if (file) {
    prompt = `[System: The user attached a file named ${file.name} (${file.type}), but direct file analysis is limited in this fallback mode.]\n\n${text}`;
  }

  try {
    // puter.ai.chat returns an async generator when stream: true
    const response = await puter.ai.chat(prompt, { stream: true });

    for await (const part of response) {
      const content = typeof part === 'string' ? part : part?.text || '';
      onStream(content);
    }
  } catch (error) {
    console.error("Puter.js error:", error);
    throw error;
  }
};