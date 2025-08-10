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
      const message = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1000,
        temperature: 0.1,
        system: this.buildPrompt(goal, shell),
        messages: [
          {
            role: 'user',
            content: `Generate a ${shell} command for: "${goal}"`,
          },
        ],
      });

      const response = message.content[0];
      if (response?.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      // Try to parse the response, if it fails, ask for a retry
      try {
        return this.validateAndParseResponse(response.text);
      } catch (parseError) {
        console.warn('First attempt failed, retrying with stricter prompt');
        
        // Retry with more explicit instructions
        const retryMessage = await this.client.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1000,
          temperature: 0,
          system: 'You must respond with ONLY valid JSON. No other text, no markdown, no explanations outside the JSON.',
          messages: [
            {
              role: 'user',
              content: this.buildPrompt(goal, shell),
            },
            {
              role: 'assistant',
              content: response.text,
            },
            {
              role: 'user',
              content: 'That response was not valid JSON. Please provide ONLY a valid JSON object with the required fields: command, explanation, riskLevel, saferAlternative, shell.',
            },
          ],
        });

        const retryResponse = retryMessage.content[0];
        if (retryResponse?.type !== 'text') {
          throw new Error('Unexpected retry response type from Anthropic');
        }

        return this.validateAndParseResponse(retryResponse.text);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Anthropic API error: ${error.message}`);
      }
      throw new Error('Unknown Anthropic API error');
    }
  }
}