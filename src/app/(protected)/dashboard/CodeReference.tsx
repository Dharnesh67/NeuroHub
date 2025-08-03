import React, { useState } from "react";
import { Loader2, Sparkles, XIcon, Code, FileText } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import CodeViewer from "./CodeViewer";

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
  const [showCodeViewer, setShowCodeViewer] = useState(false);

  const handleFileClick = () => {
    setShowCodeViewer(true);
  };

  const closeCodeViewer = () => {
    setShowCodeViewer(false);
  };

  return (
    <div>
      {/* Custom Dialog Box */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          style={{ transition: "background 0.2s" }}
        >
          <div className="relative w-full max-w-7xl mx-auto bg-gradient-to-br from-card/90 to-muted/30 rounded-2xl shadow-2xl border-0 overflow-hidden flex flex-col"
            style={{
              maxHeight: "90dvh",
              minHeight: "60dvh",
            }}
          >
            {/* Header */}
            <div className="bg-card/90 border-muted/30 sticky top-0 z-10 rounded-t-2xl border-b px-6 py-4 backdrop-blur-lg flex items-center">
              <Image
                src="/logo.svg"
                alt="NeuroHub logo"
                width={32}
                height={32}
                className="drop-shadow-md transition-transform hover:scale-105 sm:h-10 sm:w-10"
                priority
              />
              <span className="from-primary to-primary/70 bg-gradient-to-r bg-clip-text text-transparent text-lg font-bold ml-3">
                AI Assistant Response
              </span>
              <button
                onClick={handleClose}
                className="absolute right-6 top-4 text-muted-foreground hover:text-primary transition"
                aria-label="Close"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent flex-1 flex flex-col gap-4 overflow-y-auto px-6 py-4">
              {/* Question Display */}
              <div className="bg-muted/20 border-muted/30 hover:border-muted-foreground/30 rounded-xl border p-4 shadow-sm transition-all hover:shadow-md">
                <p className="text-muted-foreground mb-1.5 text-xs font-semibold tracking-wider uppercase">
                  Question
                </p>
                <p className="text-primary text-base leading-relaxed font-medium">
                  {question}
                </p>
              </div>

              {/* File References */}
              {fileReferences?.length > 0 && (
                <div className="from-muted/20 to-muted/5 border-muted/30 mt-4 rounded-2xl border bg-gradient-to-br p-5 shadow-lg transition-all hover:shadow-xl">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="bg-primary/10 text-primary mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full">
                      <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
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
                  <div className="max-h-56 space-y-4 overflow-y-auto pr-2">
                    {fileReferences?.map((file: any, index: number) => (
                      <div
                        key={index}
                        className="group bg-background border-muted/20 hover:border-primary/40 rounded-xl border p-4 text-xs shadow-sm transition-all hover:shadow-md cursor-pointer"
                        onClick={handleFileClick}
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-primary/10 text-primary rounded px-2 py-0.5 font-mono text-[10px] font-semibold">
                              {(file.similarity * 100).toFixed(1)}% match
                            </span>
                            <span className="text-primary max-w-[10rem] truncate font-semibold group-hover:underline flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {file.fileName}
                            </span>
                          </div>
                          <Code className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-muted-foreground mt-1 line-clamp-3 text-xs/relaxed">
                          {file.summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Source Code Viewer */}
              {showCodeViewer && fileReferences?.length > 0 && (
                <CodeViewer
                  files={fileReferences}
                  onClose={closeCodeViewer}
                />
              )}

              {/* Response Area */}
              <div className="flex-1 overflow-y-auto">
                <div className="bg-background border-muted/30 rounded-xl border p-4 shadow-sm transition-all hover:shadow-md">
                  <p className="text-muted-foreground mb-2.5 text-xs font-semibold tracking-wider uppercase">
                    Response
                  </p>
                  <div className="prose prose-sm max-w-none">
                    {isStreaming && !response && (
                      <div className="text-muted-foreground flex animate-pulse items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Generating response...</span>
                      </div>
                    )}
                    {response && (
                      <div
                        className="animate-fade-in text-sm leading-relaxed whitespace-pre-wrap"
                        style={{ wordBreak: "break-word" }}
                        dangerouslySetInnerHTML={{
                          __html: response.replace(/\n/g, "<br/>"),
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-card/90 border-muted/30 sticky bottom-0 z-10 flex gap-3 rounded-b-2xl border-t px-6 py-4 backdrop-blur-lg">
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
      )}
    </div>
  );
};

export default CodeReference;
