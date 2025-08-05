import React, { useState, useEffect } from "react";
import { XIcon, ChevronLeft, ChevronRight, Copy, Check, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";

interface FileReference {
  fileName: string;
  sourceCode: string;
  summary: string;
  similarity: number;
}

interface CodeViewerProps {
  files: FileReference[];
  onClose: () => void;
  initialFileIndex?: number;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ files, onClose, initialFileIndex }) => {
  const [currentFileIndex, setCurrentFileIndex] = useState(initialFileIndex ?? 0);
  const [copied, setCopied] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const currentFile = files[currentFileIndex];

  useEffect(() => {
    // Highlight syntax when component mounts or file changes
    if (currentFile) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        Prism.highlightAll();
      }, 0);
    }
  }, [currentFileIndex, currentFile]);

  // Update currentFileIndex when initialFileIndex changes
  useEffect(() => {
    if (initialFileIndex !== undefined && initialFileIndex >= 0 && initialFileIndex < files.length) {
      setCurrentFileIndex(initialFileIndex);
    }
  }, [initialFileIndex, files.length]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        prevFile();
      } else if (event.key === "ArrowRight" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        nextFile();
      } else if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "c" && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        handleCopyCode();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentFileIndex]);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentFile?.sourceCode || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const nextFile = () => {
    setCurrentFileIndex((prev) => (prev + 1) % files.length);
  };

  const prevFile = () => {
    setCurrentFileIndex((prev) => (prev - 1 + files.length) % files.length);
  };

  const getFileExtension = (fileName: string) => {
    return fileName.split('.').pop()?.toLowerCase() || 'text';
  };

  const getLanguageClass = (fileName: string) => {
    const ext = getFileExtension(fileName);
    const languageMap: { [key: string]: string } = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'sql': 'sql',
      'php': 'php',
      'rb': 'ruby',
      'go': 'go',
      'rs': 'rust',
      'swift': 'swift',
      'kt': 'kotlin',
      'scala': 'scala',
      'sh': 'bash',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'vue': 'vue',
      'svelte': 'svelte'
    };
    return languageMap[ext] || 'text';
  };

  const getFileIcon = (fileName: string) => {
    const ext = getFileExtension(fileName);
    const iconMap: { [key: string]: string } = {
      'js': '⚛️',
      'jsx': '⚛️',
      'ts': '📘',
      'tsx': '📘',
      'py': '🐍',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'html': '🌐',
      'css': '🎨',
      'scss': '🎨',
      'json': '📄',
      'md': '📝',
      'sql': '🗄️',
      'php': '🐘',
      'rb': '💎',
      'go': '🐹',
      'rs': '🦀',
      'swift': '🍎',
      'kt': '🤖',
      'scala': '⚡',
      'sh': '💻',
      'yml': '⚙️',
      'yaml': '⚙️',
      'xml': '📄',
      'vue': '💚',
      'svelte': '🟠'
    };
    return iconMap[ext] || '📄';
  };

  return (
    <div className="bg-background border-muted/30 rounded-xl border p-4 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevFile}
              disabled={files.length <= 1}
              className="h-8 w-8 p-0 hover:bg-muted/50"
              title="Previous file (Ctrl+←)"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextFile}
              disabled={files.length <= 1}
              className="h-8 w-8 p-0 hover:bg-muted/50"
              title="Next file (Ctrl+→)"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary rounded px-2 py-1 font-mono text-xs font-semibold">
              {currentFileIndex + 1} / {files.length}
            </span>
            <span className="text-primary font-semibold text-sm flex items-center gap-1">
              <span className="text-lg">{currentFile && getFileIcon(currentFile.fileName)}</span>
              {currentFile?.fileName}
            </span>
            <span className="bg-muted text-muted-foreground rounded px-2 py-1 font-mono text-xs">
              {currentFile && (currentFile.similarity * 100).toFixed(1)}% match
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="h-8 px-2 hover:bg-muted/50"
            title="Keyboard shortcuts"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            className="h-8 px-2 hover:bg-muted/50"
            title="Copy code (Ctrl+C)"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-muted/50"
            title="Close (Esc)"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      {showShortcuts && (
        <div className="mb-3 bg-muted/20 border-muted/30 rounded-lg border p-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Ctrl+←</kbd>
              <span className="text-muted-foreground">Previous file</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Ctrl+→</kbd>
              <span className="text-muted-foreground">Next file</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Ctrl+C</kbd>
              <span className="text-muted-foreground">Copy code</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Esc</kbd>
              <span className="text-muted-foreground">Close viewer</span>
            </div>
          </div>
        </div>
      )}

      {/* File Summary */}
      {currentFile && (
        <div className="mb-3 bg-muted/20 border-muted/30 rounded-lg border p-3">
          <p className="text-muted-foreground text-xs leading-relaxed">
            {currentFile.summary}
          </p>
        </div>
      )}

      {/* Code Block */}
      {currentFile && (
        <div className="bg-[#1e1e1e] border-muted/30 rounded-lg border overflow-hidden">
          <div className="bg-[#2d2d2d] border-b border-muted/30 px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary rounded px-2 py-0.5 font-mono text-xs font-semibold">
                {getLanguageClass(currentFile.fileName)}
              </span>
              <span className="text-muted-foreground text-xs">
                {currentFile.sourceCode.split('\n').length} lines
              </span>
            </div>
          </div>
          <div className="max-h-96 overflow-auto">
            <pre className="text-xs leading-relaxed p-4 m-0 bg-[#1e1e1e]">
              <code className={`language-${getLanguageClass(currentFile.fileName)}`}>
                {currentFile.sourceCode}
              </code>
            </pre>
          </div>
        </div>
      )}

      {/* File Navigation Dots */}
      {files.length > 1 && (
        <div className="mt-3 flex justify-center gap-1">
          {files.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentFileIndex(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentFileIndex
                  ? "bg-primary"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              title={`Go to file ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CodeViewer; 