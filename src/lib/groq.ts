import Groq from "groq-sdk";

let cached: Groq | null = null;

export function getGroq(): Groq | null {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  if (cached) return cached;
  cached = new Groq({ apiKey: key });
  return cached;
}

export const GROQ_MODELS = {
  whisper: "whisper-large-v3",
  llama: "llama-3.3-70b-versatile",
} as const;

export const SCRIBE_LIMITS = {
  maxAudioMb: 25,
  maxTranscriptionSeconds: 600, // 10 min audio
} as const;
