import dotenv from 'dotenv';
import type { Config } from './types';

// Load environment variables
dotenv.config();

export const config: Config = {
  port: parseInt(process.env.PORT || '8787', 10),
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  nodeEnv: process.env.NODE_ENV || 'development',
};

export function validateConfig(): void {
  if (!config.openaiApiKey && !config.anthropicApiKey) {
    throw new Error(
      'Either OPENAI_API_KEY or ANTHROPIC_API_KEY must be provided in environment variables'
    );
  }

  // Security: Validate API key format without exposing the key
  if (config.openaiApiKey) {
    if (!config.openaiApiKey.startsWith('sk-') || config.openaiApiKey.length < 20) {
      throw new Error('OPENAI_API_KEY appears to be invalid (should start with sk- and be longer than 20 chars)');
    }
  }

  if (config.anthropicApiKey) {
    if (!config.anthropicApiKey.startsWith('sk-ant-') || config.anthropicApiKey.length < 20) {
      throw new Error('ANTHROPIC_API_KEY appears to be invalid (should start with sk-ant- and be longer than 20 chars)');
    }
  }

  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error('PORT must be a valid port number between 1 and 65535');
  }

  // Security: Log which provider is being used without exposing keys
  if (config.openaiApiKey) {
    console.log('✅ OpenAI API key loaded');
  }
  if (config.anthropicApiKey) {
    console.log('✅ Anthropic API key loaded');
  }
}