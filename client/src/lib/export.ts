import type { FileResult, ExtensionCount } from '../types';
import { formatFileSize } from './fs';

export function exportToCSV(
  data: FileResult[] | ExtensionCount[],
  filename: string = 'folder-insights-results.csv'
): void {
  let csvContent = '';
  
  if (data.length === 0) {
    csvContent = 'No data to export';
  } else if ('path' in data[0]) {
    // FileResult data
    const fileResults = data as FileResult[];
    csvContent = 'Path,Name,Size (Bytes),Size (Formatted),Extension,Depth,Last Modified\n';
    
    for (const file of fileResults) {
      const row = [
        `"${file.path}"`,
        `"${file.name}"`,
        file.size.toString(),
        `"${formatFileSize(file.size)}"`,
        `"${file.extension}"`,
        file.depth.toString(),
        file.lastModified ? `"${file.lastModified.toISOString()}"` : '""',
      ].join(',');
      csvContent += row + '\n';
    }
  } else {
    // ExtensionCount data
    const extResults = data as ExtensionCount[];
    csvContent = 'Extension,Count,Total Size (Bytes),Total Size (Formatted)\n';
    
    for (const ext of extResults) {
      const row = [
        `"${ext.extension}"`,
        ext.count.toString(),
        ext.totalSize.toString(),
        `"${formatFileSize(ext.totalSize)}"`,
      ].join(',');
      csvContent += row + '\n';
    }
  }
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } else {
    // Fallback for older browsers
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    URL.revokeObjectURL(url);
  }
}