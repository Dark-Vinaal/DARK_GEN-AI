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
    // Using non-streaming for stability as requested
    const response = await puter.ai.chat(prompt, { stream: false, model: 'llama-3-70b-instruct', max_tokens: 4000 });

    const content = typeof response === 'string'
      ? response
      : response?.message?.content || response?.text || '';

    onStream(content);
  } catch (error) {
    console.error("Puter.js error:", error);
    throw error;
  }
};