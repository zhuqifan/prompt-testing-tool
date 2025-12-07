import { ModelConfig, Message } from '../types';

// NOTE: In a production environment, use a proxy server to hide the API KEY.
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

interface StreamCallbacks {
  onToken: (token: string) => void;
  onError: (error: string) => void;
  onComplete: () => void;
}

export const apiService = {
  verifyConnection: async (apiKey: string, model: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!apiKey) return { success: false, message: "No API Key provided" };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'test' }],
          stream: false,
          max_tokens: 1
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `HTTP ${response.status}`;
        try {
          const json = JSON.parse(errorText);
          // Try to find the most relevant error message
          errorMsg = json.error?.message || json.message || json.code || errorMsg;
        } catch {}
        return { success: false, message: errorMsg };
      }
      
      return { success: true, message: "Connected successfully" };
    } catch (e: any) {
      return { success: false, message: e.message || "Connection failed" };
    }
  },

  streamCompletion: async (
    messages: Message[],
    config: ModelConfig,
    userApiKey: string,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ) => {
    try {
      // Prioritize user provided key, then environment variables
      const API_KEY = userApiKey || process.env.ARK_API_KEY || process.env.API_KEY || '';

      if (!API_KEY) {
        throw new Error("Missing API Key. Please configure it in settings.");
      }

      const payload = {
        model: config.model,
        messages: messages,
        stream: true,
        temperature: config.temperature,
        frequency_penalty: config.frequency_penalty,
        presence_penalty: config.presence_penalty,
        // Volcengine specific parameters
        thinking: config.thinking,
      };

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(payload),
        signal: signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `API Error ${response.status}`;
        try {
            const json = JSON.parse(errorText);
            errorMsg = json.error?.message || json.message || errorMsg;
        } catch (e) {
            // If text is not JSON, use the raw text if short, otherwise default
            if (errorText.length < 200) errorMsg += `: ${errorText}`;
        }
        throw new Error(errorMsg);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        const lines = buffer.split('\n');
        
        // Keep the last line in the buffer if it's incomplete
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          
          const dataStr = trimmed.replace('data: ', '');
          
          if (dataStr === '[DONE]') {
            continue;
          }

          try {
            const parsed = JSON.parse(dataStr);
            // Handle standard OpenAI format and potential variations
            const content = parsed.choices?.[0]?.delta?.content || '';
            
            // Some models might send full content in 'message' or other fields, but standard stream is delta
            if (content) {
              callbacks.onToken(content);
            }
          } catch (e) {
            // Ignore parse errors for keep-alive or malformed chunks
          }
        }
      }
      
      callbacks.onComplete();

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Treat abort as completion for the purpose of the UI flow (stops spinning)
        callbacks.onComplete();
      } else {
        callbacks.onError(error.message || "Unknown error occurred");
      }
    }
  }
};