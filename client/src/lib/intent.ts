import type { Intent, LargeFilesParams, CountByExtParams, TextSearchParams } from '../types';

export function parseIntent(goal: string): Intent | null {
  const goalLower = goal.toLowerCase().trim();

  // Intent A: Large files
  const largeFilePatterns = [
    /find.*large.*files?/,
    /files?.*larger?.*than/,
    /files?.*bigger?.*than/,
    /files?.*over/,
    /files?.*above/,
    /files?.*>\s*(\d+)(?:\s*mb)?/,
    /(\d+)\s*mb.*files?/,
    /big.*files?/,
    /huge.*files?/,
  ];

  for (const pattern of largeFilePatterns) {
    if (pattern.test(goalLower)) {
      return {
        type: 'LARGE_FILES',
        params: parseLargeFilesParams(goal),
      };
    }
  }

  // Intent B: Count by extension
  const countPatterns = [
    /count.*by.*ext/,
    /count.*ext/,
    /group.*by.*ext/,
    /breakdown.*ext/,
    /files?.*by.*type/,
    /file.*types?/,
    /extension.*count/,
    /how.*many.*\.(js|py|txt|md|csv)/,
  ];

  for (const pattern of countPatterns) {
    if (pattern.test(goalLower)) {
      return {
        type: 'COUNT_BY_EXT',
        params: parseCountByExtParams(goal),
      };
    }
  }

  // Intent C: Text search
  const searchPatterns = [
    /search.*for/,
    /find.*text/,
    /find.*string/,
    /contains?/,
    /grep/,
    /look.*for/,
    /files?.*with/,
    /files?.*containing/,
    /text.*search/,
  ];

  for (const pattern of searchPatterns) {
    if (pattern.test(goalLower)) {
      return {
        type: 'TEXT_SEARCH',
        params: parseTextSearchParams(goal),
      };
    }
  }

  // Default to large files if size mentioned
  if (/\d+\s*mb|\d+\s*gb|size/i.test(goal)) {
    return {
      type: 'LARGE_FILES',
      params: parseLargeFilesParams(goal),
    };
  }

  return null;
}

function parseLargeFilesParams(goal: string): LargeFilesParams {
  // Extract size threshold
  const sizeMatch = goal.match(/(\d+)\s*mb/i) || goal.match(/>(\d+)/);
  const threshold = sizeMatch ? parseInt(sizeMatch[1], 10) : 50; // Default 50MB

  // Extract depth
  const depthMatch = goal.match(/depth\s*(\d+)|level\s*(\d+)/i);
  const maxDepth = depthMatch ? parseInt(depthMatch[1] || depthMatch[2], 10) : undefined;

  return { threshold, maxDepth };
}

function parseCountByExtParams(goal: string): CountByExtParams {
  // Extract depth
  const depthMatch = goal.match(/depth\s*(\d+)|level\s*(\d+)/i);
  const maxDepth = depthMatch ? parseInt(depthMatch[1] || depthMatch[2], 10) : undefined;

  return { maxDepth };
}

function parseTextSearchParams(goal: string): TextSearchParams {
  // Extract search query - look for quoted strings first
  let query = '';
  const quotedMatch = goal.match(/"([^"]+)"|'([^']+)'/);
  if (quotedMatch) {
    query = quotedMatch[1] || quotedMatch[2];
  } else {
    // Look for common patterns
    const patterns = [
      /search\s+for\s+(.+?)(?:\s+in|\s+depth|\s*$)/i,
      /find\s+(?:text|string)\s+(.+?)(?:\s+in|\s+depth|\s*$)/i,
      /containing\s+(.+?)(?:\s+in|\s+depth|\s*$)/i,
      /with\s+(.+?)(?:\s+in|\s+depth|\s*$)/i,
    ];
    
    for (const pattern of patterns) {
      const match = goal.match(pattern);
      if (match) {
        query = match[1].trim();
        break;
      }
    }
  }

  // Extract file extensions
  const extMatches = goal.match(/\.(\w+)(?:\s|,|$)/g);
  const extensions = extMatches?.map(ext => ext.replace('.', '').trim()) || [];

  // Check if it's a regex
  const isRegex = /regex|regexp|pattern/.test(goal.toLowerCase()) || 
                  query.includes('*') || query.includes('?') || 
                  query.includes('[') || query.includes('(');

  // Extract depth
  const depthMatch = goal.match(/depth\s*(\d+)|level\s*(\d+)/i);
  const maxDepth = depthMatch ? parseInt(depthMatch[1] || depthMatch[2], 10) : undefined;

  return {
    query: query || 'TODO', // Fallback
    extensions: extensions.length > 0 ? extensions : undefined,
    isRegex,
    maxDepth,
  };
}