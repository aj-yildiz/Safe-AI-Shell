
import { Send, Loader2 } from 'lucide-react';
import { generateCommand } from '../lib/api';
import { parseIntent } from '../lib/intent';
import { executeIntent } from '../lib/fs';
import { StorageService } from '../lib/storage';
import type { AppState } from '../types';

interface PromptFormProps {
  state: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  disabled?: boolean;
}

export default function PromptForm({ state, onUpdateState, disabled }: PromptFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state.goal.trim() || !state.selectedFolder || state.loading || state.processing) {
      return;
    }

    // Save shell preference
    StorageService.setShellPreference(state.shell);

    // Phase 1: Generate AI command
    onUpdateState({ loading: true, error: null, response: null, results: null });

    try {
      const response = await generateCommand(state.goal, state.shell);
      onUpdateState({ response, loading: false });

      // Save to history
      StorageService.saveToHistory({
        goal: state.goal,
        shell: state.shell,
        command: response.command,
        riskLevel: response.riskLevel,
      });

      // Phase 2: Execute local intent
      onUpdateState({ processing: true });

      const intent = parseIntent(state.goal);
      if (intent && state.selectedFolder) {
        try {
          const results = await executeIntent(state.selectedFolder, intent);
          onUpdateState({ 
            results, 
            intent, 
            processing: false,
            error: null 
          });
        } catch (intentError) {
          console.error('Intent execution failed:', intentError);
          onUpdateState({ 
            processing: false,
            error: `Failed to analyze folder: ${(intentError as Error).message}`
          });
        }
      } else {
        onUpdateState({ 
          processing: false,
          error: intent ? null : 'Could not understand your request. Try being more specific about what you want to find.'
        });
      }

    } catch (error) {
      onUpdateState({ 
        loading: false, 
        processing: false,
        error: (error as Error).message 
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const isLoading = state.loading || state.processing;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex space-x-4">
        <div className="flex-1">
          <label htmlFor="goal-input" className="block text-sm font-medium text-gray-300 mb-2">
            What do you want to find?
          </label>
          <textarea
            id="goal-input"
            value={state.goal}
            onChange={(e) => onUpdateState({ goal: e.target.value })}
            onKeyDown={handleKeyDown}
            placeholder="e.g., find files >50MB depth 2, count by extension, search for TODO in .js files"
            className="input-field w-full h-20 resize-none"
            disabled={disabled || isLoading}
          />
        </div>
        
        <div className="w-32">
          <label htmlFor="shell-select" className="block text-sm font-medium text-gray-300 mb-2">
            Shell
          </label>
          <select
            id="shell-select"
            value={state.shell}
            onChange={(e) => onUpdateState({ shell: e.target.value as any })}
            className="input-field w-full"
            disabled={disabled || isLoading}
          >
            <option value="bash">Bash</option>
            <option value="zsh">Zsh</option>
            <option value="fish">Fish</option>
            <option value="powershell">PowerShell</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {state.processing ? 'Analyzing folder...' : 
           state.loading ? 'Generating command...' : 
           'Press Cmd/Ctrl+Enter to submit'}
        </div>
        
        <button
          type="submit"
          disabled={disabled || !state.goal.trim() || isLoading}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>
            {state.processing ? 'Analyzing' : 
             state.loading ? 'Generating' : 
             'Analyze'}
          </span>
        </button>
      </div>
    </form>
  );
}