import React, { useState } from "react";
import {
  Loader2,
  Sparkles,
  XIcon,
  Code,
  FileText,
  Save,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import CodeViewer from "./CodeViewer";
import { api } from "@/trpc/react";
import useProject from "@/hooks/use-projects";
import { toast } from "sonner";
import useRefetch from "@/hooks/use-refetch";
import { usePathname } from "next/navigation";

interface CodeReferenceProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  question: string;
  response: string;
  isStreaming: boolean;
  fileReferences: any[];
  handleNewQuestion: () => void;
  handleClose: () => void;
}

const CodeReference: React.FC<CodeReferenceProps> = ({
  open,
  setOpen,
  question,
  response,
  isStreaming,
  fileReferences,
  handleNewQuestion,
  handleClose,
}) => {
  const path = usePathname();
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(
    null,
  );
  const { projectId } = useProject();
  const refetch = useRefetch();
  const saveAnswersMutation = api.project.saveAnswers.useMutation({
    onSuccess: () => {
      toast.success("Response saved successfully");
      refetch();
    },
    onError: (error) => {
      toast.error("Error saving response");
    },
  });

  const handleFileClick = (fileIndex: number) => {
    setSelectedFileIndex(fileIndex);
    setShowCodeViewer(true);
  };

  const closeCodeViewer = () => {
    setShowCodeViewer(false);
    setSelectedFileIndex(null);
  };

  const handleSaveResponse = () => {
    if (!projectId || !question || !response) return;

    saveAnswersMutation.mutate({
      projectId,
      question,
      answer: response,
      fileReferences,
    });
  };

  // Get the files to show in CodeViewer - either all files or just the selected one
  const getFilesToShow = () => {
    if (selectedFileIndex !== null) {
      return [fileReferences[selectedFileIndex]];
    }
    return fileReferences;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Custom Modal */}
      <div className="from-card/95 to-muted/30 border-muted/30 relative h-[95vh] max-h-[95vh] w-[98vw] max-w-[2000px] overflow-hidden rounded-2xl border bg-gradient-to-br shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div className="bg-card/90 border-muted/30 sticky top-0 z-10 border-b px-6 py-4 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-lg font-bold">
              <Image
                src="/logo.svg"
                alt="NeuroHub logo"
                width={32}
                height={32}
                className="drop-shadow-md transition-transform hover:scale-105 sm:h-10 sm:w-10"
                priority
              />
              <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-transparent">
                AI Assistant Response
              </span>
            </div>
            <div className="flex items-center gap-4">
              {/* Save Response Button */}
              {!path.includes("qa") && (
                <Button
                  variant="outline"
                  onClick={handleSaveResponse}
                  disabled={
                    isStreaming ||
                    !question ||
                    !response ||
                    !projectId ||
                    saveAnswersMutation.isPending
                  }
                  className={`font-semibold transition-all hover:-translate-y-0.5 hover:shadow ${
                    saveAnswersMutation.isPending
                      ? "border-green-500 text-green-500"
                      : ""
                  }`}
                >
                  {saveAnswersMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : saveAnswersMutation.isSuccess ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {saveAnswersMutation.isPending
                    ? "Saving..."
                    : saveAnswersMutation.isSuccess
                      ? "Saved!"
                      : "Save Response"}
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleNewQuestion}
                className="font-semibold transition-all hover:-translate-y-0.5 hover:shadow"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Ask New Question
              </Button>
              <Button
                onClick={handleClose}
                className="bg-primary hover:bg-primary/90 font-semibold transition-all hover:-translate-y-0.5 hover:shadow"
              >
                <XIcon className="mr-2 h-4 w-4" />
                Close
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(95vh-140px)] gap-4 px-6 py-4">
          {/* Main Content - Question and Response */}
          <div
            className={`flex flex-col gap-4 overflow-y-auto ${showCodeViewer ? "w-1/2" : "w-full"} transition-all duration-300`}
          >
            {/* Question Display */}
            <div className="bg-muted/20 border-muted/30 hover:border-muted-foreground/30 rounded-xl border p-4 shadow-sm transition-all hover:shadow-md">
              <p className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wider uppercase">
                Question
              </p>
              <p className="text-primary text-base leading-relaxed font-medium">
                {question}
              </p>
            </div>

            {/* Response Area */}
            <div className="flex-1 h-96 mb-10">
              <div className="bg-background border-muted/30 rounded-xl border p-4 shadow-sm transition-all hover:shadow-md">
                <p className="text-muted-foreground mb-2.5 text-xs font-semibold tracking-wider uppercase">
                  Response
                </p>
                <div className="prose prose-sm max-w-none h-96 overflow-y-auto rounded-xl border p-4 shadow-sm transition-all hover:shadow-md">
                  {isStreaming && !response && (
                    <div className="text-muted-foreground flex animate-pulse items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">Generating response...</span>
                    </div>
                  )}
                  {response && (
                    <div
                      className="animate-fade-in text-sm leading-relaxed"
                      style={{ wordBreak: "break-word" }}
                    >
                      {/* Render markdown/README style content */}
                      <div
                        className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-primary prose-code:bg-muted/40 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.95em] prose-pre:bg-muted/30 prose-pre:rounded-lg prose-pre:p-3 prose-a:text-primary/80 prose-a:underline hover:prose-a:text-primary prose-li:marker:text-primary"
                        // If you use a markdown renderer, replace this with the renderer
                        dangerouslySetInnerHTML={{
                          __html: response
                            // Convert markdown-style code blocks to HTML
                            .replace(/```([\s\S]*?)```/g, (match, p1) => {
                              // Try to detect language
                              const langMatch = p1.match(/^(\w+)\n/);
                              let code = p1;
                              let lang = "";
                              if (langMatch) {
                                lang = langMatch[1];
                                code = p1.replace(/^(\w+)\n/, "");
                              }
                              return `<pre class="language-${lang}"><code>${code.replace(
                                /</g,
                                "&lt;"
                              ).replace(/>/g, "&gt;")}</code></pre>`;
                            })
                            // Inline code
                            .replace(/`([^`]+)`/g, '<code>$1</code>')
                            // Headings
                            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                            // Bold
                            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
                            // Italic
                            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
                            // Links
                            .replace(
                              /\[([^\]]+)\]\(([^)]+)\)/gim,
                              '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
                            )
                            // Lists
                            .replace(/^\s*[-*] (.*)$/gim, '<li>$1</li>')
                            // Paragraphs
                            .replace(/^\s*([^\n<][^\n]*)$/gim, '<p>$1</p>')
                            // Line breaks
                            .replace(/\n/g, "")
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* File References */}
            {fileReferences?.length > 0 && (
              <div className="from-muted/20 to-muted/5 border-muted/30 rounded-2xl border bg-gradient-to-br p-5 shadow-lg transition-all hover:shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/10 text-primary mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full">
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        viewBox="0 0 16 16"
                      >
                        <path
                          d="M8 1.5l2.09 4.24 4.66.68-3.38 3.29.8 4.65L8 11.77l-4.17 2.19.8-4.65-3.38-3.29 4.66-.68L8 1.5z"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <p className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
                      Referenced Files
                      <span className="bg-primary/10 text-primary ml-2 rounded px-2 py-0.5 font-mono text-[11px] font-semibold">
                        {fileReferences?.length}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {showCodeViewer && selectedFileIndex !== null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFileIndex(null);
                          setShowCodeViewer(true);
                        }}
                        className="text-xs"
                        title="Show all files"
                      >
                        <FileText className="mr-1 h-3 w-3" />
                        All Files
                      </Button>
                    )}
                    {showCodeViewer && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={closeCodeViewer}
                        className="text-xs"
                      >
                        <XIcon className="mr-1 h-3 w-3" />
                        Close Viewer
                      </Button>
                    )}
                  </div>
                </div>
                <div className="max-h-56 space-y-4 overflow-y-auto pr-2">
                  {fileReferences?.map((file: any, index: number) => (
                    <div
                      key={index}
                      className={`group bg-background border-muted/20 hover:border-primary/40 cursor-pointer rounded-xl border p-4 text-xs shadow-sm transition-all hover:shadow-md ${
                        showCodeViewer ? "opacity-60 hover:opacity-100" : ""
                      } ${
                        selectedFileIndex === index
                          ? "border-primary/60 bg-primary/5"
                          : ""
                      }`}
                      onClick={() => handleFileClick(index)}
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="bg-primary/10 text-primary rounded px-2 py-0.5 font-mono text-[10px] font-semibold">
                            {(file.similarity * 100).toFixed(1)}% match
                          </span>
                          <span className="text-primary flex max-w-[15rem] items-center gap-1 truncate font-semibold group-hover:underline">
                            <FileText className="h-3 w-3" />
                            {file.fileName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {selectedFileIndex === index && showCodeViewer && (
                            <span className="bg-primary text-primary-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                              Active
                            </span>
                          )}
                          <Code className="text-muted-foreground h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </div>
                      <p className="text-muted-foreground mt-1 line-clamp-3 text-xs/relaxed">
                        {file.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Code Viewer Side Panel */}
          {showCodeViewer && fileReferences?.length > 0 && (
            <div className="w-1/2 overflow-y-auto">
              <CodeViewer
                files={getFilesToShow()}
                onClose={closeCodeViewer}
                initialFileIndex={selectedFileIndex !== null ? 0 : undefined}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeReference;
