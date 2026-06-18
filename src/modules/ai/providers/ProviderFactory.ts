import type { AIProvider } from './AIProvider.interface';
import OllamaProvider from './OllamaProvider';
import GeminiProvider from './GeminiProvider';

/**
 * Selects the active AI provider from AI_PROVIDER env ('gemini' | 'ollama'),
 * defaulting to gemini if GEMINI_API_KEY is set, else falling back to ollama —
 * so nothing currently working breaks if Gemini isn't configured.
 */
function selectProvider(): AIProvider {
  const configured = (process.env.AI_PROVIDER || '').toLowerCase();
  if (configured === 'ollama') return OllamaProvider;
  if (configured === 'gemini') return GeminiProvider;
  return process.env.GEMINI_API_KEY ? GeminiProvider : OllamaProvider;
}

export function getActiveProvider(): AIProvider {
  return selectProvider();
}

export function getActiveProviderName(): 'gemini' | 'ollama' {
  return selectProvider() === GeminiProvider ? 'gemini' : 'ollama';
}
