
import { HfInference } from '@huggingface/inference';
import { SendMessageParams } from "../types";

export const sendMessageToHuggingFace = async (
    { text, modelId, signal }: SendMessageParams & { modelId: string },
    onStream: (chunk: string) => void,
    onStatusUpdate?: (status: string) => void
) => {
    const apiKey = import.meta.env.VITE_HF_TOKEN || (typeof process !== 'undefined' ? process.env.VITE_HF_TOKEN : undefined);

    if (!apiKey) {
        throw new Error("Missing Hugging Face API Token (VITE_HF_TOKEN). Please check your .env configuration.");
    }

    const hf = new HfInference(apiKey);

    try {
        const stream = hf.textGenerationStream({
            model: modelId,
            inputs: text,
            parameters: {
                max_new_tokens: 4000, // Explicitly set for full answers
                return_full_text: false,
                temperature: 0.7,
            }
        }, { signal });

        for await (const chunk of stream) {
            if (chunk.token.text) {
                onStream(chunk.token.text);
            }
        }

    } catch (error: any) {
        if (signal?.aborted) return; // Ignore aborts

        // 503 Cold Start Handling
        if (error.response?.status === 503 || error.message?.includes('503')) {
            const estimatedTime = error.response?.data?.estimated_time || 10;
            if (onStatusUpdate) {
                onStatusUpdate(`Waking up the Neural Core... Please wait (~${Math.ceil(estimatedTime)}s).`);
            }
            // Recursive retry with simpler Fetch if SDK doesn't support easy retry or just throw to let App handle it?
            // User requested "Automatically retry". 
            // Simple recursion might be tricky with the generator. 
            // We will wait and recurse.
            await new Promise(resolve => setTimeout(resolve, estimatedTime * 1000));
            return sendMessageToHuggingFace({ text, modelId, signal }, onStream, onStatusUpdate);
        }

        // 403 Forbidden Handling
        if (error.response?.status === 403 || error.message?.includes('403')) {
            throw new Error("Neural Core requires license acceptance on Hugging Face hub.");
        }

        throw error;
    }
};
