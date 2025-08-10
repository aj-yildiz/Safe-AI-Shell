import { useState } from 'react';
import { Copy, Check, AlertTriangle, Info, Shield } from 'lucide-react';
import Prism from 'prismjs';
import type { GenerateResponse } from '../types';

interface OutputCardProps {
  response: GenerateResponse;
}

export default function OutputCard({ response }: OutputCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(response.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getRiskIcon = () => {
    switch (response.riskLevel) {
      case 'low':
        return <Shield className="w-4 h-4" />;
      case 'medium':
        return <Info className="w-4 h-4" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getRiskClasses = () => {
    switch (response.riskLevel) {
      case 'low':
        return 'risk-low';
      case 'medium':
        return 'risk-medium';
      case 'high':
        return 'risk-high';
    }
  };

  // Determine language for syntax highlighting
  const getLanguage = () => {
    switch (response.shell) {
      case 'powershell':
        return 'powershell';
      default:
        return 'bash';
    }
  };

  // Apply syntax highlighting
  const highlightedCode = Prism.highlight(
    response.command,
    Prism.languages[getLanguage()] || Prism.languages.bash,
    getLanguage()
  );

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-200">AI-Generated Command</h3>
        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getRiskClasses()}`}>
          {getRiskIcon()}
          <span className="capitalize">{response.riskLevel} Risk</span>
        </div>
      </div>

      {/* Command Block */}
      <div className="relative">
        <pre className="language-bash overflow-x-auto p-4 rounded-lg bg-gray-900 border border-gray-700">
          <code 
            className={`language-${getLanguage()}`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
        
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 p-2 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Explanation */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Explanation</h4>
        <p className="text-sm text-gray-400 leading-relaxed">
          {response.explanation}
        </p>
      </div>

      {/* Safer Alternative */}
      {response.saferAlternative && (
        <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-amber-300 mb-2 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Safer Alternative</span>
          </h4>
          <pre className="text-sm text-amber-200 font-mono whitespace-pre-wrap">
            {response.saferAlternative}
          </pre>
        </div>
      )}

      {/* Warning for high-risk commands */}
      {response.riskLevel === 'high' && (
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-red-300 text-sm font-medium mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span>High Risk Command</span>
          </div>
          <p className="text-sm text-red-200">
            This command has been flagged as potentially dangerous. Please review carefully
            before running it on your system. Consider using the safer alternative if provided.
          </p>
        </div>
      )}
    </div>
  );
}