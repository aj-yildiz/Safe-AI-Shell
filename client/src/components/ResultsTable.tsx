import { Download, File, Folder, Search } from 'lucide-react';
import { formatFileSize } from '../lib/fs';
import { exportToCSV } from '../lib/export';
import type { FileResult, ExtensionCount, Intent, LargeFilesParams } from '../types';

interface ResultsTableProps {
  results: FileResult[] | ExtensionCount[];
  intent: Intent | null;
  folderName: string;
}

export default function ResultsTable({ results, intent, folderName }: ResultsTableProps) {
  if (!results || results.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-400 mb-2">No results found</h3>
        <p className="text-gray-500 text-sm">
          Try adjusting your search criteria or selecting a different folder.
        </p>
      </div>
    );
  }

  const handleExport = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const intentType = intent?.type.toLowerCase().replace('_', '-') || 'results';
    const filename = `${folderName}-${intentType}-${timestamp}.csv`;
    exportToCSV(results, filename);
  };

  const getIcon = () => {
    if (!intent) return <File className="w-5 h-5" />;
    
    switch (intent.type) {
      case 'LARGE_FILES':
        return <File className="w-5 h-5" />;
      case 'COUNT_BY_EXT':
        return <Folder className="w-5 h-5" />;
      case 'TEXT_SEARCH':
        return <Search className="w-5 h-5" />;
      default:
        return <File className="w-5 h-5" />;
    }
  };

  const getTitle = () => {
    if (!intent) return 'Results';
    
    switch (intent.type) {
      case 'LARGE_FILES': {
        const params = intent.params as LargeFilesParams;
        return `Large Files (>${params.threshold}MB)`;
      }
      case 'COUNT_BY_EXT':
        return 'Files by Extension';
      case 'TEXT_SEARCH':
        return `Text Search Results`;
      default:
        return 'Results';
    }
  };

  return (
    <div className="card">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getIcon()}
            <h3 className="text-lg font-medium text-gray-200">{getTitle()}</h3>
            <span className="text-sm text-gray-400">({results.length} results)</span>
          </div>
          
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        {'path' in results[0] ? (
          <FileResultsTable results={results as FileResult[]} intent={intent} />
        ) : (
          <ExtensionResultsTable results={results as ExtensionCount[]} />
        )}
      </div>
    </div>
  );
}

function FileResultsTable({ results, intent }: { results: FileResult[]; intent: Intent | null }) {
  return (
    <table className="w-full">
      <thead className="bg-gray-900/50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Name
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Path
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Size
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Extension
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Depth
          </th>
          {intent?.type === 'TEXT_SEARCH' && (
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Preview
            </th>
          )}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-700">
        {results.map((file, index) => (
          <tr key={index} className="hover:bg-gray-900/25">
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="flex items-center space-x-2">
                <File className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-200 font-medium">{file.name}</span>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="text-sm text-gray-400 font-mono break-all">{file.path}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-300">{formatFileSize(file.size)}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                {file.extension || 'none'}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-400">{file.depth}</span>
            </td>
            {intent?.type === 'TEXT_SEARCH' && (
              <td className="px-6 py-4">
                {file.content && (
                  <div className="max-w-xs">
                    <pre className="text-xs text-gray-400 whitespace-pre-wrap break-words">
                      {file.content.slice(0, 100)}
                      {file.content.length > 100 && '...'}
                    </pre>
                  </div>
                )}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ExtensionResultsTable({ results }: { results: ExtensionCount[] }) {
  return (
    <table className="w-full">
      <thead className="bg-gray-900/50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Extension
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Count
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Total Size
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Avg Size
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-700">
        {results.map((ext, index) => (
          <tr key={index} className="hover:bg-gray-900/25">
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900 text-blue-200">
                {ext.extension}
              </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-300 font-medium">{ext.count.toLocaleString()}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-300">{formatFileSize(ext.totalSize)}</span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className="text-sm text-gray-400">{formatFileSize(ext.totalSize / ext.count)}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}