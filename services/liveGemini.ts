import { EventEmitter } from 'eventemitter3';

export class GeminiLiveClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private nextAudioTime = 0;
  private isConnected = false;

  constructor(private url: string = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenericMultimodalService.Root') {
    super();
  }

  async connect(apiKey: string, model: string = 'models/gemini-2.0-flash-exp') {
    if (this.ws) {
      this.disconnect();
    }

    const wsUrl = `${this.url}?key=${apiKey}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.emit('connected');
      console.log('Gemini Live Connected');

      // Send setup message
      const setupMessage = {
        setup: {
          model: model,
          generationConfig: {
            responseModalities: ["AUDIO"]
          }
        }
      };
      this.ws?.send(JSON.stringify(setupMessage));

      // Start audio input stream
      this.startAudioInput();
    };

    this.ws.onmessage = async (event) => {
      let data;
      if (event.data instanceof Blob) {
        data = JSON.parse(await event.data.text());
      } else {
        data = JSON.parse(event.data);
      }

      // Handle ServerContent (Audio)
      if (data.serverContent?.modelTurn?.parts) {
        const parts = data.serverContent.modelTurn.parts;
        for (const part of parts) {
          if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
            this.queueAudio(part.inlineData.data);
          }
        }
      }

      // Handle TurnComplete (ready for next turn)
      if (data.serverContent?.turnComplete) {
        this.emit('turnComplete');
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
      this.emit('error', error);
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      this.emit('disconnected');
      this.stopAudioInput();
      console.log('Gemini Live Disconnected');
    };
  }

  private async startAudioInput() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 16000 } });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      this.audioProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.audioProcessor.onaudioprocess = (e) => {
        if (!this.isConnected) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = this.float32ToInt16(inputData);
        const base64Audio = this.arrayBufferToBase64(pcmData);

        const message = {
          realtimeInput: {
            mediaChunks: [
              {
                mimeType: "audio/pcm;rate=16000",
                data: base64Audio
              }
            ]
          }
        };

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(message));
        }
      };

      source.connect(this.audioProcessor);
      this.audioProcessor.connect(this.audioContext.destination); // Start processing

    } catch (error) {
      console.error("Error accessing microphone:", error);
      this.emit('error', error);
    }
  }

  private stopAudioInput() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.audioProcessor) {
      this.audioProcessor.disconnect();
      this.audioProcessor = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  private queueAudio(base64Data: string) {
    if (!this.audioContext) return;

    // Decode Base64 to PCM
    const pcmData = this.base64ToArrayBuffer(base64Data);
    const float32Data = this.int16ToFloat32(pcmData);

    // Create audio buffer
    const buffer = this.audioContext.createBuffer(1, float32Data.length, 24000); // Response is usually 24kHz
    buffer.getChannelData(0).set(float32Data);

    // Play audio
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    // Simple scheduling
    const currentTime = this.audioContext.currentTime;
    if (this.nextAudioTime < currentTime) {
      this.nextAudioTime = currentTime;
    }
    source.start(this.nextAudioTime);
    this.nextAudioTime += buffer.duration;

    // Emit speaking event for visualizer
    this.emit('speaking', true);
    source.onended = () => {
      if (this.audioContext && this.audioContext.currentTime >= this.nextAudioTime) {
        this.emit('speaking', false);
      }
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopAudioInput();
    this.isConnected = false;
  }

  // --- Helpers ---

  private float32ToInt16(float32: Float32Array): ArrayBuffer {
    const int16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16.buffer;
  }

  private int16ToFloat32(arrayBuffer: ArrayBuffer): Float32Array {
    const int16 = new Int16Array(arrayBuffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      const int = int16[i];
      float32[i] = int >= 0 ? int / 0x7FFF : int / 0x8000;
    }
    return float32;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
