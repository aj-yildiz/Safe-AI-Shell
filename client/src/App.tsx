import { useState, useEffect } from 'react';
import { Folder, History, Moon, Sun } from 'lucide-react';
import PromptForm from './components/PromptForm';
import OutputCard from './components/OutputCard';
import ResultsTable from './components/ResultsTable';
import HistoryList from './components/HistoryList';
import { isFileSystemAccessSupported } from './lib/fs';
import { StorageService } from './lib/storage';
import type { AppState } from './types';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showHistory, setShowHistory] = useState(false);
  const [state, setState] = useState<AppState>({
    selectedFolder: null,
    folderName: '',
    goal: '',
    shell: 'bash',
    loading: false,
    response: null,
    results: null,
    intent: null,
    error: null,
    processing: false,
  });

  useEffect(() => {
    // Initialize theme
    const savedTheme = StorageService.getTheme();
    setTheme(savedTheme);
    StorageService.setTheme(savedTheme);

    // Initialize shell preference
    const savedShell = StorageService.getShellPreference();
    setState(prev => ({ ...prev, shell: savedShell }));

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.getElementById('goal-input')?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    StorageService.setTheme(newTheme);
  };

  const handleSelectFolder = async () => {
    if (!isFileSystemAccessSupported()) {
      setState(prev => ({
        ...prev,
        error: 'File System Access API is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.',
      }));
      return;
    }

    try {
      const dirHandle = await window.showDirectoryPicker();
      setState(prev => ({
        ...prev,
        selectedFolder: dirHandle,
        folderName: dirHandle.name,
        error: null,
      }));
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          error: 'Failed to select folder: ' + (error as Error).message,
        }));
      }
    }
  };

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`w-80 border-r ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} flex flex-col`}>
          {/* Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Folder className="w-6 h-6 text-blue-500" />
                <h1 className="text-lg font-semibold text-gray-100">Folder Insights AI</h1>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                  title="Toggle history"
                >
                  <History className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-gray-200"
                  title="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Folder Selection */}
            <div className="space-y-3">
              <button
                onClick={handleSelectFolder}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <Folder className="w-4 h-4" />
                <span>Pick folder…</span>
              </button>
              
              {state.folderName && (
                <div className="text-sm text-gray-400">
                  Selected: <span className="text-blue-400 font-mono">{state.folderName}</span>
                </div>
              )}
            </div>
          </div>

          {/* History or Instructions */}
          <div className="flex-1 overflow-y-auto">
            {showHistory ? (
              <HistoryList onSelectItem={(item) => {
                setState(prev => ({
                  ...prev,
                  goal: item.goal,
                  shell: item.shell as any,
                }));
                setShowHistory(false);
              }} />
            ) : (
              <div className="p-6 text-sm text-gray-400 space-y-4">
                <div>
                  <h3 className="font-medium text-gray-300 mb-2">How to use:</h3>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Pick a folder to analyze</li>
                    <li>Describe what you want to find</li>
                    <li>Get AI-suggested commands + real results</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-300 mb-2">Example goals:</h3>
                  <ul className="space-y-1 text-xs">
                    <li>• "find files {'>'} 50MB depth 2"</li>
                    <li>• "count files by extension"</li>
                    <li>• "search for TODO in .js files"</li>
                  </ul>
                </div>

                <div className="text-xs text-gray-500">
                  <strong>Privacy:</strong> No file contents leave your browser.
                  Server is only used for AI command generation.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Prompt Form */}
          <div className={`border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} p-6`}>
            <PromptForm
              state={state}
              onUpdateState={updateState}
              disabled={!state.selectedFolder}
            />
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {state.error && (
              <div className="card p-4 border-red-700 bg-red-900/20">
                <div className="text-red-400 text-sm">{state.error}</div>
              </div>
            )}

            {!isFileSystemAccessSupported() && (
              <div className="card p-6 border-amber-700 bg-amber-900/20">
                <h3 className="text-amber-400 font-medium mb-2">Browser Not Supported</h3>
                <p className="text-amber-200 text-sm">
                  This app requires the File System Access API, which is only available in 
                  Chrome, Edge, and other Chromium-based browsers. 
                  <a
                    href="https://caniuse.com/native-filesystem-api"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-300 underline ml-1"
                  >
                    Learn more
                  </a>
                </p>
              </div>
            )}

            {state.response && (
              <OutputCard response={state.response} />
            )}

            {state.results && (
              <ResultsTable
                results={state.results}
                intent={state.intent}
                folderName={state.folderName}
              />
            )}

            {!state.selectedFolder && !state.error && isFileSystemAccessSupported() && (
              <div className="text-center py-12">
                <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">
                  No folder selected
                </h3>
                <p className="text-gray-500 text-sm">
                  Pick a folder to start analyzing your files with AI assistance
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;