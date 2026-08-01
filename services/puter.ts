import puter from "@heyputer/puter.js";
import { SendMessageParams } from "../types";

export const sendMessageToPuter = async (
  { text, file }: SendMessageParams,
  onStream: (chunk: string) => void,
) => {
  let prompt = text;

  if (file) {
    prompt = `[System: The user attached a file named ${file.name}. You can reference it in your response, but cannot access its content directly in this mode.]\n\n${text}`;
  }

  try {
    console.info(
      "[Puter Service] Sending request to Puter.js...",
    );

    const response = await puter.ai.chat(prompt, {
      stream: true,
      model: "claude-3-5-sonnet",
    });

    console.log("[Puter Service] Response object:", response);

    if (response && typeof response[Symbol.asyncIterator] === "function") {
      for await (const chunk of response) {
        console.log("[Puter Service] RAW CHUNK:", chunk);

        let content = "";

        if (typeof chunk === "string") {
          content = chunk;
        } else if ("text" in chunk && typeof chunk.text === "string") {
          content = chunk.text;
        }

        console.log("[Puter Service] Extracted content:", content);

        if (content.length > 0) {
          onStream(content);
        }
      }
    } else if (typeof response === "string") {
      console.log("[Puter Service] Non-stream response:", response);
      onStream(response);
    } else {
      console.warn(
        "[Puter Service] Unexpected response format:",
        response,
      );
      throw new Error("Received empty or invalid response from Puter.js");
    }
  } catch (error: any) {
    console.error("[Puter Service] Full error:", error);

    console.log("[Puter Service] Error message:", error?.message);
    console.log("[Puter Service] Error response:", error?.response);
    console.log("[Puter Service] Error data:", error?.data);

    if (
      error instanceof TypeError &&
      error.message.includes("is not async iterable")
    ) {
      throw new Error(
        "Puter.js response was not iterable. Please try again.",
      );
    }

    const errorMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Unknown Puter.js error";

    throw new Error(`Puter.js error: ${errorMsg}`);
  }
};