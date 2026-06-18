import type { AIProvider } from './AIProvider.interface';
import GeminiProvider from './GeminiProvider';

/**
 * Single point of indirection for the active AI provider. Gemini is the only
 * provider today; this stays a factory (rather than importing GeminiProvider
 * directly everywhere) so a future OpenAI/DeepSeek provider can be swapped in
 * here without touching AIController or AIAssistantService.
 */
export function getActiveProvider(): AIProvider {
  return GeminiProvider;
}

export function getActiveProviderName(): 'gemini' {
  return 'gemini';
}
