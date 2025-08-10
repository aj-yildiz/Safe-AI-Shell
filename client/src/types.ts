export interface GenerateResponse {
  command: string;
  explanation: string;
  riskLevel: 'low' | 'medium' | 'high';
  saferAlternative: string | null;
  shell: 'bash' | 'zsh' | 'fish' | 'powershell';
}

export interface Intent {
  type: 'LARGE_FILES' | 'COUNT_BY_EXT' | 'TEXT_SEARCH';
  params: LargeFilesParams | CountByExtParams | TextSearchParams;
}

export interface LargeFilesParams {
  threshold: number; // MB
  maxDepth?: number;
}

export interface CountByExtParams {
  maxDepth?: number;
}

export interface TextSearchParams {
  query: string;
  extensions?: string[];
  isRegex?: boolean;
  maxDepth?: number;
}

export interface FileResult {
  path: string;
  name: string;
  size: number;
  extension: string;
  depth: number;
  lastModified?: Date;
  content?: string; // Only for text search results
}

export interface ExtensionCount {
  extension: string;
  count: number;
  totalSize: number;
}

export interface HistoryItem {
  id: string;
  goal: string;
  shell: string;
  timestamp: number;
  command?: string;
  riskLevel?: 'low' | 'medium' | 'high';
}

export interface AppState {
  selectedFolder: FileSystemDirectoryHandle | null;
  folderName: string;
  goal: string;
  shell: 'bash' | 'zsh' | 'fish' | 'powershell';
  loading: boolean;
  response: GenerateResponse | null;
  results: FileResult[] | ExtensionCount[] | null;
  intent: Intent | null;
  error: string | null;
  processing: boolean;
}