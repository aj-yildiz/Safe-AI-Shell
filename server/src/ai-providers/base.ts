import type { AIProvider, GenerateResponse } from '../types';

export const BASHCOP_SYSTEM_PROMPT = `You are BashCop, an expert command-line assistant that generates safe, effective shell commands.

Your task is to analyze user goals and return STRICT JSON ONLY with this exact schema:
{
  "command": "the shell command to accomplish the goal",
  "explanation": "clear explanation of what the command does",
  "riskLevel": "low|medium|high",
  "saferAlternative": "safer version of command or null if not needed",
  "shell": "bash|zsh|fish|powershell"
}

Guidelines:
1. ONLY return valid JSON - no prose, no markdown, no explanations outside the JSON
2. Focus on file analysis tasks (find, count, search, list)
3. Prefer read-only operations
4. Use standard POSIX commands when possible
5. Avoid destructive operations (rm, mv to dangerous locations, chmod 777, etc.)
6. Set riskLevel based on potential for data loss or system harm
7. Provide saferAlternative for risky commands (add --dry-run, use echo instead of rm, etc.)
8. Match the requested shell syntax

Examples of good responses:
- For "find large files": {"command":"find . -type f -size +50M -ls","explanation":"Finds files larger than 50MB and lists them with details","riskLevel":"low","saferAlternative":null,"shell":"bash"}
- For "delete temp files": {"command":"find . -name '*.tmp' -type f -print","explanation":"Lists temporary files that could be deleted","riskLevel":"low","saferAlternative":"find . -name '*.tmp' -type f -print0 | xargs -0 rm -i","shell":"bash"}

Remember: STRICT JSON ONLY. If the request is unclear, make reasonable assumptions but still return valid JSON.`;

export abstract class BaseAIProvider implements AIProvider {
  abstract generateCommand(goal: string, shell: string): Promise<GenerateResponse>;

  protected validateAndParseResponse(response: string): GenerateResponse {
    try {
      // Try to extract JSON from response if it's wrapped in other text
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      
      const parsed = JSON.parse(jsonStr);
      
      // Validate required fields
      if (!parsed.command || typeof parsed.command !== 'string') {
        throw new Error('Missing or invalid command field');
      }
      
      if (!parsed.explanation || typeof parsed.explanation !== 'string') {
        throw new Error('Missing or invalid explanation field');
      }
      
      if (!['low', 'medium', 'high'].includes(parsed.riskLevel)) {
        throw new Error('Invalid riskLevel - must be low, medium, or high');
      }
      
      if (!['bash', 'zsh', 'fish', 'powershell'].includes(parsed.shell)) {
        throw new Error('Invalid shell - must be bash, zsh, fish, or powershell');
      }
      
      return {
        command: parsed.command,
        explanation: parsed.explanation,
        riskLevel: parsed.riskLevel,
        saferAlternative: parsed.saferAlternative || null,
        shell: parsed.shell,
      };
    } catch (error) {
      console.error('Failed to parse AI response:', response);
      throw new Error(`Invalid AI response format: ${(error as Error).message}`);
    }
  }

  protected buildPrompt(goal: string, shell: string): string {
    return `${BASHCOP_SYSTEM_PROMPT}

User goal: "${goal}"
Target shell: ${shell}

Respond with JSON only:`;
  }
}