import { SendMessageParams } from "../types";

export const sendMessageToOpenRouter = async (
  { text, file, modelId, signal }: SendMessageParams,
  onStream: (chunk: string) => void
) => {
  // Safe access to environment variables
  const apiKey = import.meta.env?.VITE_OPENROUTER_KEY ||
    (typeof process !== 'undefined' ? process.env?.VITE_OPENROUTER_KEY : undefined);

  if (!apiKey || apiKey.includes("PLACE_YOUR_KEY")) {
    throw new Error("OpenRouter API Key is missing. Please set VITE_OPENROUTER_KEY in your .env file.");
  }

  // OpenRouter/OpenAI Compatible API Payload
  const messages: any[] = [];

  if (file) {
    // Basic image handling for models that support it (Vision models)
    // Note: Converting file to base64 for payload
    const base64Data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result); // result includes data:image/png;base64,...
      };
      reader.readAsDataURL(file);
    });

    messages.push({
      role: "user",
      content: [
        { type: "text", text },
        { type: "image_url", image_url: { url: base64Data } }
      ]
    });
  } else {
    messages.push({ role: "user", content: text });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "DARK AI",
      },
      body: JSON.stringify({
        model: modelId || "openai/gpt-3.5-turbo",
        messages: messages,
        stream: true,
      }),
      signal
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenRouter Error: ${response.status} ${errText}`);
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line === "data: [DONE]") return;
        if (line.startsWith("data: ")) {
          const jsonStr = line.replace("data: ", "");
          try {
            const json = JSON.parse(jsonStr);
            const content = json.choices[0]?.delta?.content || "";
            if (content) {
              onStream(content);
            }
          } catch (e) {
            console.error("Error parsing OpenRouter stream", e);
          }
        }
      }
    }
  } catch (error) {
    console.error("OpenRouter Service Error:", error);
    throw error;
  }
};