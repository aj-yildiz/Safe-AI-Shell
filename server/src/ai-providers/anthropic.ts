import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider } from './base';
import type { GenerateResponse } from '../types';

export class AnthropicProvider extends BaseAIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    super();
    this.client = new Anthropic({
      apiKey: apiKey,
    });
  }

  async generateCommand(goal: string, shell: string): Promise<GenerateResponse> {
    try {
      const message = await this.client.completions.create({
        model: 'claude-2.1',
        max_tokens_to_sample: 1000,
        temperature: 0.1,
        prompt: `\n\nHuman: ${this.buildPrompt(goal, shell)}\n\nGenerate a ${shell} command for: "${goal}"\n\nAssistant:`,
      });

      const response = message.completion;
      if (!response) {
        throw new Error('Empty response from Anthropic');
      }

      // Try to parse the response, if it fails, ask for a retry
      try {
        return this.validateAndParseResponse(response);
      } catch (parseError) {
        console.warn('First attempt failed, retrying with stricter prompt');
        
        // Retry with more explicit instructions
        const retryMessage = await this.client.completions.create({
          model: 'claude-2.1',
          max_tokens_to_sample: 1000,
          temperature: 0,
          prompt: `\n\nHuman: You must respond with ONLY valid JSON. No other text, no markdown, no explanations outside the JSON.\n\n${this.buildPrompt(goal, shell)}\n\nGenerate a ${shell} command for: "${goal}"\n\nPrevious attempt: ${response}\n\nThat response was not valid JSON. Please provide ONLY a valid JSON object with the required fields: command, explanation, riskLevel, saferAlternative, shell.\n\nAssistant:`,
        });

        const retryResponse = retryMessage.completion;
        if (!retryResponse) {
          throw new Error('Empty retry response from Anthropic');
        }

        return this.validateAndParseResponse(retryResponse);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Anthropic API error: ${error.message}`);
      }
      throw new Error('Unknown Anthropic API error');
    }
  }
}