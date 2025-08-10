import type { FileResult, ExtensionCount, Intent, LargeFilesParams, CountByExtParams, TextSearchParams } from '../types';

export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

async function walkDirectory(
  dirHandle: FileSystemDirectoryHandle,
  maxDepth: number = Infinity,
  currentDepth: number = 0,
  basePath: string = ''
): Promise<FileResult[]> {
  const results: FileResult[] = [];
  
  if (currentDepth >= maxDepth) {
    return results;
  }

  try {
    for await (const [name, handle] of dirHandle.entries()) {
      const currentPath = basePath ? `${basePath}/${name}` : name;
      
      if (handle.kind === 'file') {
        try {
          const file = await handle.getFile();
          const result: FileResult = {
            path: currentPath,
            name,
            size: file.size,
            extension: getFileExtension(name),
            depth: currentDepth,
            lastModified: new Date(file.lastModified),
          };
          results.push(result);
        } catch (error) {
          console.warn(`Failed to read file ${currentPath}:`, error);
        }
      } else if (handle.kind === 'directory') {
        try {
          const subResults = await walkDirectory(
            handle,
            maxDepth,
            currentDepth + 1,
            currentPath
          );
          results.push(...subResults);
        } catch (error) {
          console.warn(`Failed to read directory ${currentPath}:`, error);
        }
      }
    }
  } catch (error) {
    console.warn(`Failed to read directory entries:`, error);
  }
  
  return results;
}

async function safeReadTextFile(fileHandle: FileSystemFileHandle): Promise<string | null> {
  try {
    const file = await fileHandle.getFile();
    
    // Skip binary files or very large files
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return null;
    }
    
    // Try to detect if it's a text file by extension
    const ext = getFileExtension(file.name);
    const textExtensions = [
      'txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'c', 'cpp', 'h',
      'css', 'scss', 'html', 'xml', 'yml', 'yaml', 'toml', 'ini', 'cfg', 'conf',
      'log', 'csv', 'tsv', 'sql', 'sh', 'bash', 'zsh', 'fish', 'ps1', 'bat',
      'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'clj', 'elm', 'hs',
      'r', 'matlab', 'pl', 'pm', 'tcl', 'lua', 'vim', 'el', 'lisp', 'scm',
    ];
    
    if (!textExtensions.includes(ext)) {
      return null;
    }
    
    const text = await file.text();
    return text;
  } catch (error) {
    console.warn(`Failed to read text from file:`, error);
    return null;
  }
}

export async function executeIntent(
  dirHandle: FileSystemDirectoryHandle,
  intent: Intent
): Promise<FileResult[] | ExtensionCount[]> {
  const { type, params } = intent;
  
  switch (type) {
    case 'LARGE_FILES':
      return await findLargeFiles(dirHandle, params as LargeFilesParams);
    case 'COUNT_BY_EXT':
      return await countByExtension(dirHandle, params as CountByExtParams);
    case 'TEXT_SEARCH':
      return await searchText(dirHandle, params as TextSearchParams);
    default:
      throw new Error(`Unknown intent type: ${type}`);
  }
}

async function findLargeFiles(
  dirHandle: FileSystemDirectoryHandle,
  params: LargeFilesParams
): Promise<FileResult[]> {
  const { threshold, maxDepth = Infinity } = params;
  const thresholdBytes = threshold * 1024 * 1024; // Convert MB to bytes
  
  const allFiles = await walkDirectory(dirHandle, maxDepth);
  const largeFiles = allFiles.filter(file => file.size >= thresholdBytes);
  
  // Sort by size descending
  return largeFiles.sort((a, b) => b.size - a.size);
}

async function countByExtension(
  dirHandle: FileSystemDirectoryHandle,
  params: CountByExtParams
): Promise<ExtensionCount[]> {
  const { maxDepth = Infinity } = params;
  
  const allFiles = await walkDirectory(dirHandle, maxDepth);
  const extensionMap = new Map<string, { count: number; totalSize: number }>();
  
  for (const file of allFiles) {
    const ext = file.extension || '(no extension)';
    const current = extensionMap.get(ext) || { count: 0, totalSize: 0 };
    current.count++;
    current.totalSize += file.size;
    extensionMap.set(ext, current);
  }
  
  const results: ExtensionCount[] = Array.from(extensionMap.entries()).map(
    ([extension, { count, totalSize }]) => ({
      extension,
      count,
      totalSize,
    })
  );
  
  // Sort by count descending
  return results.sort((a, b) => b.count - a.count);
}

async function searchText(
  dirHandle: FileSystemDirectoryHandle,
  params: TextSearchParams
): Promise<FileResult[]> {
  const { query, extensions, isRegex = false, maxDepth = Infinity } = params;
  
  const allFiles = await walkDirectory(dirHandle, maxDepth);
  
  // Filter by extensions if specified
  const filesToSearch = extensions 
    ? allFiles.filter(file => extensions.includes(file.extension))
    : allFiles;
  
  const results: FileResult[] = [];
  const searchPattern = isRegex ? new RegExp(query, 'i') : null;
  
  for (const file of filesToSearch) {
    try {
      // Reconstruct file handle path
      const fileHandle = await getFileHandleFromPath(dirHandle, file.path);
      if (!fileHandle) continue;
      
      const content = await safeReadTextFile(fileHandle);
      if (content === null) continue;
      
      let matches = false;
      if (isRegex && searchPattern) {
        matches = searchPattern.test(content);
      } else {
        matches = content.toLowerCase().includes(query.toLowerCase());
      }
      
      if (matches) {
        results.push({
          ...file,
          content: content.slice(0, 500), // First 500 chars for preview
        });
      }
    } catch (error) {
      console.warn(`Failed to search in file ${file.path}:`, error);
    }
  }
  
  return results;
}

async function getFileHandleFromPath(
  dirHandle: FileSystemDirectoryHandle,
  path: string
): Promise<FileSystemFileHandle | null> {
  try {
    const parts = path.split('/');
    let currentHandle: FileSystemDirectoryHandle | FileSystemFileHandle = dirHandle;
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        // Last part should be a file
        if (currentHandle.kind === 'directory') {
          currentHandle = await (currentHandle as FileSystemDirectoryHandle).getFileHandle(part);
        }
      } else {
        // Directory part
        if (currentHandle.kind === 'directory') {
          currentHandle = await (currentHandle as FileSystemDirectoryHandle).getDirectoryHandle(part);
        }
      }
    }
    
    return currentHandle.kind === 'file' ? (currentHandle as FileSystemFileHandle) : null;
  } catch (error) {
    console.warn(`Failed to get file handle for path ${path}:`, error);
    return null;
  }
}