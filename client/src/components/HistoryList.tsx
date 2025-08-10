
import { Clock, Trash2, Shell } from 'lucide-react';
import { StorageService } from '../lib/storage';
import type { HistoryItem } from '../types';

interface HistoryListProps {
  onSelectItem: (item: HistoryItem) => void;
}

export default function HistoryList({ onSelectItem }: HistoryListProps) {
  const [history, setHistory] = React.useState<HistoryItem[]>([]);

  React.useEffect(() => {
    setHistory(StorageService.getHistory());
  }, []);

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      StorageService.clearHistory();
      setHistory([]);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-400';
      case 'medium':
        return 'text-amber-400';
      case 'high':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (history.length === 0) {
    return (
      <div className="p-6 text-center">
        <Clock className="w-8 h-8 text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No history yet</p>
        <p className="text-xs text-gray-600 mt-1">
          Your recent queries will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-300">Recent Queries</h3>
        <button
          onClick={handleClearHistory}
          className="p-1 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-300"
          title="Clear history"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-2">
        {history.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelectItem(item)}
            className="w-full text-left p-3 rounded-lg hover:bg-gray-700 border border-transparent hover:border-gray-600 transition-colors"
          >
            <div className="space-y-2">
              {/* Goal */}
              <div className="text-sm text-gray-200 line-clamp-2">
                {item.goal}
              </div>
              
              {/* Metadata */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Shell className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-400">{item.shell}</span>
                  </div>
                  
                  {item.riskLevel && (
                    <div className={`${getRiskColor(item.riskLevel)} font-medium`}>
                      {item.riskLevel}
                    </div>
                  )}
                </div>
                
                <span className="text-gray-500">
                  {formatTimestamp(item.timestamp)}
                </span>
              </div>

              {/* Command preview */}
              {item.command && (
                <div className="text-xs text-gray-500 font-mono truncate">
                  {item.command}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}