import { describe, it, expect } from 'vitest';
import { BaseAIProvider } from './base';
import type { GenerateResponse } from '../types';

// Mock implementation for testing
class MockAIProvider extends BaseAIProvider {
  async generateCommand(_goal: string, _shell: string): Promise<GenerateResponse> {
    return {
      command: 'find . -name "*.txt"',
      explanation: 'Test command',
      riskLevel: 'low',
      saferAlternative: null,
      shell: 'bash',
    };
  }
}

describe('BaseAIProvider', () => {
  const provider = new MockAIProvider();

  describe('validateAndParseResponse', () => {
    it('should parse valid JSON response', () => {
      const validResponse = JSON.stringify({
        command: 'find . -name "*.txt"',
        explanation: 'Finds all text files',
        riskLevel: 'low',
        saferAlternative: null,
        shell: 'bash',
      });

      const result = provider['validateAndParseResponse'](validResponse);
      
      expect(result.command).toBe('find . -name "*.txt"');
      expect(result.explanation).toBe('Finds all text files');
      expect(result.riskLevel).toBe('low');
      expect(result.shell).toBe('bash');
    });

    it('should extract JSON from wrapped response', () => {
      const wrappedResponse = `Here's your command:
      
      {"command":"ls -la","explanation":"Lists files","riskLevel":"low","saferAlternative":null,"shell":"bash"}
      
      Hope this helps!`;

      const result = provider['validateAndParseResponse'](wrappedResponse);
      expect(result.command).toBe('ls -la');
    });

    it('should reject response with missing command', () => {
      const invalidResponse = JSON.stringify({
        explanation: 'Test explanation',
        riskLevel: 'low',
        saferAlternative: null,
        shell: 'bash',
      });

      expect(() => provider['validateAndParseResponse'](invalidResponse))
        .toThrow('Missing or invalid command field');
    });

    it('should reject response with invalid risk level', () => {
      const invalidResponse = JSON.stringify({
        command: 'test',
        explanation: 'Test',
        riskLevel: 'invalid',
        saferAlternative: null,
        shell: 'bash',
      });

      expect(() => provider['validateAndParseResponse'](invalidResponse))
        .toThrow('Invalid riskLevel');
    });

    it('should reject response with invalid shell', () => {
      const invalidResponse = JSON.stringify({
        command: 'test',
        explanation: 'Test',
        riskLevel: 'low',
        saferAlternative: null,
        shell: 'invalid-shell',
      });

      expect(() => provider['validateAndParseResponse'](invalidResponse))
        .toThrow('Invalid shell');
    });

    it('should handle non-JSON response gracefully', () => {
      const nonJsonResponse = 'This is not JSON at all';

      expect(() => provider['validateAndParseResponse'](nonJsonResponse))
        .toThrow('Invalid AI response format');
    });
  });

  describe('buildPrompt', () => {
    it('should build proper prompt with goal and shell', () => {
      const prompt = provider['buildPrompt']('find large files', 'bash');
      
      expect(prompt).toContain('find large files');
      expect(prompt).toContain('bash');
      expect(prompt).toContain('BashCop');
      expect(prompt).toContain('JSON');
    });
  });
});