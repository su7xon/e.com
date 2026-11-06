// Groq chatbot helper — fast free-tier models with automatic fallback.
// Key resolution: VITE_GROQ_API_KEY env wins, else bundled fallback (replace via env).
// Endpoint: OpenAI-compatible https://api.groq.com/openai/v1/chat/completions (CORS enabled).

export interface GroqChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Fast + free-tier friendly. First = primary, rest = fallbacks on 400/404/429.
export const GROQ_MODELS = [
  'llama-3.1-8b-instant',
  'llama-3.3-70b-versatile',
  'openai/gpt-oss-20b',
] as const;

const FALLBACK_KEY = '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';

export function getGroqKey(): string {
  const envKey = (import.meta as any)?.env?.VITE_GROQ_API_KEY as string | undefined;
  return (envKey && envKey.trim()) || FALLBACK_KEY;
}

export async function chatWithGroq(
  messages: GroqChatMessage[],
  opts?: { temperature?: number; maxTokens?: number; signal?: AbortSignal }
): Promise<string> {
  const key = getGroqKey();
  if (!key) throw new Error('Groq API key missing. Set VITE_GROQ_API_KEY in .env.');

  let lastError = '';
  for (const model of GROQ_MODELS) {
    try {
      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: opts?.temperature ?? 0.7,
          max_tokens: opts?.maxTokens ?? 600,
        }),
        signal: opts?.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        lastError = `${model}: ${res.status} ${text.slice(0, 200)}`;
        // Try next model on model-not-found / rate-limit / bad-request.
        if (res.status === 400 || res.status === 404 || res.status === 429) continue;
        throw new Error(lastError);
      }

      const data = await res.json();
      const content: string | undefined = data?.choices?.[0]?.message?.content;
      if (!content) {
        lastError = `${model}: empty response`;
        continue;
      }
      return content.trim();
    } catch (e: any) {
      if (e?.name === 'AbortError') throw e;
      lastError = e?.message || String(e);
      // Network error — try next model once, else throw.
      continue;
    }
  }
  throw new Error(lastError || 'Groq request failed on all models.');
}
