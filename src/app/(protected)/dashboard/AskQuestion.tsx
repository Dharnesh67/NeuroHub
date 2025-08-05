"use client";
import React, { useState } from "react";
import { MessageSquare, Loader2 } from "lucide-react";
import { AskQuestion as AskQuestionAction } from "./action";
import useProject from "@/hooks/use-projects";
import CodeReference from "./CodeReference";

const AskQuestion = () => {
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [response, setResponse] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [fileReferences, setFileReferences] = useState<any[]>([]);
  const { projectId } = useProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || !projectId) return;

    setSubmitting(true);
    setIsStreaming(true);
    setResponse("");
    setFileReferences([]);
    setOpen(true);

    try {
      const result = await AskQuestionAction(question, projectId);

      // Handle the streaming response
      if (result.output && result.output instanceof ReadableStream) {
        const reader = result.output.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            setResponse((prev) => prev + chunk);
          }
        } finally {
          reader.releaseLock();
        }
      }

      // Set file references if available
      if (result.fileReferences) {
        setFileReferences(result.fileReferences);
      }
    } catch (error) {
      console.error("Error asking question:", error);
      setResponse(
        "Sorry, there was an error processing your question. Please try again.",
      );
    } finally {
      setSubmitting(false);
      setIsStreaming(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setResponse("");
    setFileReferences([]);
  };

  const handleNewQuestion = () => {
    setQuestion("");
    setResponse("");
    setFileReferences([]);
    setOpen(false);
  };

  return (
    <div className="bg-card border-muted-foreground flex  flex-col rounded-2xl border p-6 shadow-lg transition-all hover:shadow-xl">
      <CodeReference
        open={open}
        setOpen={setOpen}
        question={question}
        response={response}
        isStreaming={isStreaming}
        fileReferences={fileReferences}
        handleNewQuestion={handleNewQuestion}
        handleClose={handleClose}
      />
      <div className="text-primary mb-4 flex items-center gap-2 text-xl font-semibold">
        <MessageSquare className="h-5 w-5" />
        <span>Ask a Question</span>
        <span className="bg-primary/10 text-primary rounded px-2 py-0.5 font-mono text-xs">
          NeuroHub
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex h-full flex-1 flex-col justify-between"
      >
        <textarea
          className="text-muted-foreground bg-muted/20 border-primary/20 focus:ring-primary/20 mb-4 flex h-full  flex-col items-center justify-center rounded-xl border border-dashed p-6 transition focus:ring-2 focus:outline-none"
          rows={3}
          placeholder="Have questions about the project?
          Ask your team members anything related to the project and get quick
              responses.
          "
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={submitting}
        />
        <button
          type="submit"
          className="bg-primary hover:bg-primary/90 focus:ring-primary/40 mt-4 self-end rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg focus:ring-2 focus:outline-none active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting || question.trim() === "" || !projectId}
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </div>
          ) : (
            "Submit"
          )}
        </button>
      </form>
    </div>
  );
};

export default AskQuestion;
