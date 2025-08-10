import { Router, Request, Response } from 'express';
import { GenerateRequestSchema, GenerateResponseSchema } from '../types';
import { assessRisk } from '../risk-assessment';
import type { AIProvider } from '../types';

export function createGenerateRouter(aiProvider: AIProvider): Router {
  const router = Router();

  router.post('/generate', async (req: Request, res: Response): Promise<void> => {
    try {
      // Validate request body
      const validationResult = GenerateRequestSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(400).json({
          error: 'Invalid request',
          details: validationResult.error.errors,
        });
        return;
      }

      const { goal, shell } = validationResult.data;

      // Generate command using AI
      let aiResponse;
      try {
        aiResponse = await aiProvider.generateCommand(goal, shell);
      } catch (aiError) {
        console.error('AI Provider Error:', aiError);
        res.status(503).json({
          error: 'AI service temporarily unavailable',
          code: 'AI_SERVICE_ERROR',
        });
        return;
      }

      // Perform risk assessment on the generated command
      const riskAssessment = assessRisk(aiResponse.command);

      // Override AI's risk assessment if our analysis is more conservative
      const finalRiskLevel = getRiskPriority(aiResponse.riskLevel) < getRiskPriority(riskAssessment.level)
        ? riskAssessment.level
        : aiResponse.riskLevel;

      // Use safer alternative from risk assessment if available and risk is high
      const finalSaferAlternative = riskAssessment.level === 'high' && riskAssessment.saferAlternative
        ? riskAssessment.saferAlternative
        : aiResponse.saferAlternative;

      const response = {
        command: aiResponse.command,
        explanation: aiResponse.explanation,
        riskLevel: finalRiskLevel,
        saferAlternative: finalSaferAlternative,
        shell: shell, // Ensure we return the requested shell
      };

      // Validate response with Zod
      const responseValidation = GenerateResponseSchema.safeParse(response);
      if (!responseValidation.success) {
        console.error('Response validation failed:', responseValidation.error);
        res.status(500).json({
          error: 'Invalid response format',
          code: 'RESPONSE_VALIDATION_ERROR',
        });
        return;
      }

      // Log for monitoring (in production, use proper logging)
      console.log(`Generated command for goal: "${goal}" (${shell}) - Risk: ${finalRiskLevel}`);

      res.json(responseValidation.data);
    } catch (error) {
      console.error('Generate route error:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  });

  return router;
}

function getRiskPriority(risk: 'low' | 'medium' | 'high'): number {
  switch (risk) {
    case 'low': return 1;
    case 'medium': return 2;
    case 'high': return 3;
    default: return 1;
  }
}