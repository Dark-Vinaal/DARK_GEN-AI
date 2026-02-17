import { SendMessageParams } from "../types";

// Extend the Window interface to include the 'puter' object
declare global {
  interface Window {
    puter: any;
  }
}

export const sendMessageToPuter = async (
  { text, file }: SendMessageParams,
  onStream: (chunk: string) => void
) => {
  // Check if the Puter.js script has loaded successfully
  if (!window.puter) {
    console.error("Puter.js script failed to load. Please check the script tag in index.html.");
    throw new Error("Puter.js script not found.");
  }

  let prompt = text;
  if (file) {
    // Note: This is a simplified approach. True file handling would require uploading the file first.
    prompt = `[System: The user attached a file named ${file.name}. You can reference it in your response, but cannot access its content directly in this mode.]\n\n${text}`;
  }

  try {
    // Use the globally available puter object
    const response = await window.puter.ai.chat(prompt, {
      stream: true,
      model: 'llama-3-70b-instruct'
    });

    // Check if response is an async iterable
    if (response && typeof response[Symbol.asyncIterator] === 'function') {
      for await (const chunk of response) {
        console.log("Puter chunk:", chunk); // Debugging
        const content = chunk?.message?.content || chunk?.text;
        if (typeof content === 'string') {
          onStream(content);
        }
      }
    } else if (response && typeof response === 'object' && 'message' in response) {
      // Handle non-streaming response gracefully
      const content = (response as any).message?.content;
      if (typeof content === 'string') {
        onStream(content);
      }
    } else {
      console.warn("Unexpected Puter response format:", response);
      throw new Error("Received empty or invalid response from Puter.js");
    }

  } catch (error) {
    console.error("Puter.js error:", error);
    if (error instanceof TypeError && error.message.includes("is not async iterable")) {
      throw new Error("Puter.js response was not iterable. Please try again.");
    }
    throw error;
  }
};
