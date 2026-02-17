
import { SendMessageParams } from "../types";

export const sendMessageToHuggingFace = async (
    { text, modelId, signal }: SendMessageParams & { modelId: string },
    onStream: (chunk: string) => void,
    onStatusUpdate?: (status: string) => void
) => {
    const apiKey = import.meta.env.VITE_HF_TOKEN;

    if (!apiKey) {
        throw new Error("Missing Hugging Face API Token (VITE_HF_TOKEN). Please check your .env configuration.");
    }

    // Use standard Hugging Face Inference API
    const endpoint = `https://api-inference.huggingface.co/models/${modelId}/v1/chat/completions`;

    const makeRequest = async (retryCount = 0): Promise<void> => {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: modelId, // OpenAI spec includes model in body
                    messages: [
                        { role: "user", content: text }
                    ],
                    max_tokens: 4000,
                    stream: true,
                    temperature: 0.7
                }),
                signal
            });

            if (response.status === 503) {
                const errorData = await response.json().catch(() => ({}));
                const estimatedTime = errorData.estimated_time || 10;

                if (onStatusUpdate) {
                    onStatusUpdate(`Waking up the Neural Core... Please wait (~${Math.ceil(estimatedTime)}s).`);
                }

                // Wait and retry
                await new Promise(resolve => setTimeout(resolve, estimatedTime * 1000));
                return makeRequest(retryCount + 1);
            }

            if (response.status === 404 || response.status === 410) {
                throw new Error(`Model not found or endpoint deprecated (${response.status}). Verify model ID.`);
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HF API Error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder("utf-8");

            if (!reader) throw new Error("Response body is not readable");

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;

                    if (trimmed.startsWith('data: ')) {
                        try {
                            const jsonStr = trimmed.slice(6); // Remove 'data: '
                            const json = JSON.parse(jsonStr);
                            const content = json.choices?.[0]?.delta?.content;

                            if (content) {
                                onStream(content);
                            }
                        } catch (e) {
                            console.warn("Error parsing HF stream chunk:", e);
                        }
                    }
                }
            }

        } catch (error: any) {
            if (signal?.aborted) return;
            console.error("HF Inference Error:", error);
            throw error;
        }
    };

    await makeRequest();
};
