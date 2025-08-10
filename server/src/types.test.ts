import { describe, it, expect } from 'vitest';
import { GenerateRequestSchema, GenerateResponseSchema } from './types';

describe('Schema Validation', () => {
  describe('GenerateRequestSchema', () => {
    it('should validate correct request', () => {
      const validRequest = {
        goal: 'find large files',
        shell: 'bash',
      };

      const result = GenerateRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty goal', () => {
      const invalidRequest = {
        goal: '',
        shell: 'bash',
      };

      const result = GenerateRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject goal that is too long', () => {
      const invalidRequest = {
        goal: 'a'.repeat(1001),
        shell: 'bash',
      };

      const result = GenerateRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should reject invalid shell', () => {
      const invalidRequest = {
        goal: 'find files',
        shell: 'invalid-shell',
      };

      const result = GenerateRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
    });

    it('should accept all valid shells', () => {
      const validShells = ['bash', 'zsh', 'fish', 'powershell'];
      
      for (const shell of validShells) {
        const request = {
          goal: 'test goal',
          shell,
        };
        
        const result = GenerateRequestSchema.safeParse(request);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('GenerateResponseSchema', () => {
    it('should validate correct response', () => {
      const validResponse = {
        command: 'find . -name "*.txt"',
        explanation: 'Finds all text files',
        riskLevel: 'low',
        saferAlternative: null,
        shell: 'bash',
      };

      const result = GenerateResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should validate response with safer alternative', () => {
      const validResponse = {
        command: 'rm -rf temp/',
        explanation: 'Removes temp directory',
        riskLevel: 'high',
        saferAlternative: 'echo "Would remove temp/"',
        shell: 'bash',
      };

      const result = GenerateResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should reject invalid risk levels', () => {
      const invalidResponse = {
        command: 'test',
        explanation: 'test',
        riskLevel: 'invalid',
        saferAlternative: null,
        shell: 'bash',
      };

      const result = GenerateResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should accept all valid risk levels', () => {
      const validRiskLevels = ['low', 'medium', 'high'];
      
      for (const riskLevel of validRiskLevels) {
        const response = {
          command: 'test',
          explanation: 'test',
          riskLevel,
          saferAlternative: null,
          shell: 'bash',
        };
        
        const result = GenerateResponseSchema.safeParse(response);
        expect(result.success).toBe(true);
      }
    });
  });
});