import OpenAI from 'openai';
import { BaseAIProvider } from './base';
import type { GenerateResponse } from '../types';

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    super();
    this.client = new OpenAI({
      apiKey: apiKey,
    });
  }

  async generateCommand(goal: string, shell: string): Promise<GenerateResponse> {
    try {
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.buildPrompt(goal, shell),
          },
        ],
        temperature: 0.1, // Low temperature for consistent, focused responses
        max_tokens: 1000,
        top_p: 0.9,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      // Try to parse the response, if it fails, ask for a retry
      try {
        return this.validateAndParseResponse(response);
      } catch (parseError) {
        console.warn('First attempt failed, retrying with stricter prompt');
        
        // Retry with more explicit instructions
        const retryCompletion = await this.client.chat.completions.create({
          model: 'gpt-4-turbo-preview',
          messages: [
            {
              role: 'system',
              content: 'You must respond with ONLY valid JSON. No other text.',
            },
            {
              role: 'user',
              content: this.buildPrompt(goal, shell),
            },
            {
              role: 'assistant',
              content: response,
            },
            {
              role: 'user',
              content: 'That response was not valid JSON. Please provide ONLY a valid JSON object with the required fields.',
            },
          ],
          temperature: 0,
          max_tokens: 1000,
        });

        const retryResponse = retryCompletion.choices[0]?.message?.content;
        if (!retryResponse) {
          throw new Error('No response from OpenAI on retry');
        }

        return this.validateAndParseResponse(retryResponse);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error('Unknown OpenAI API error');
    }
  }
}