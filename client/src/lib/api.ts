import type { GenerateResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL as string;

// Guard so builds fail loudly if VITE_API_URL is not set
if (!API_BASE) {
  throw new Error('VITE_API_URL environment variable is required but not set');
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function generateCommand(
  goal: string,
  shell: 'bash' | 'zsh' | 'fish' | 'powershell'
): Promise<GenerateResponse> {
  try {
    const response = await fetch(`${API_BASE}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ goal, shell }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        errorData.code
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError(
        `Unable to connect to server at ${API_BASE}. Check that the backend is running and CORS is configured.`,
        0,
        'NETWORK_ERROR'
      );
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred',
      0,
      'UNKNOWN_ERROR'
    );
  }
}