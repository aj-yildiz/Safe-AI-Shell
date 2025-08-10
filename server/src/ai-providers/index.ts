import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import type { AIProvider } from '../types';

export function createAIProvider(openaiKey?: string, anthropicKey?: string): AIProvider {
  // Prefer OpenAI if available
  if (openaiKey) {
    console.log('Using OpenAI provider');
    return new OpenAIProvider(openaiKey);
  }
  
  if (anthropicKey) {
    console.log('Using Anthropic provider');
    return new AnthropicProvider(anthropicKey);
  }
  
  throw new Error('No AI provider configuration found. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY');
}

export { OpenAIProvider, AnthropicProvider };