import { z } from 'zod';

export const GenerateRequestSchema = z.object({
  goal: z.string().min(1, 'Goal is required').max(1000, 'Goal too long'),
  shell: z.enum(['bash', 'zsh', 'fish', 'powershell'], {
    errorMap: () => ({ message: 'Invalid shell type' }),
  }),
});

export const GenerateResponseSchema = z.object({
  command: z.string(),
  explanation: z.string(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  saferAlternative: z.string().nullable(),
  shell: z.enum(['bash', 'zsh', 'fish', 'powershell']),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>;

export interface AIProvider {
  generateCommand(goal: string, shell: string): Promise<GenerateResponse>;
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  reasons: string[];
  saferAlternative?: string;
}

export interface Config {
  port: number;
  openaiApiKey?: string;
  anthropicApiKey?: string;
  nodeEnv: string;
}