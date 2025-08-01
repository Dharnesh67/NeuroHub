import React, { useState } from "react";
import { MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const AskQuestion = () => {
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  // The dialog is not working because it has no DialogContent, DialogFooter, or any visible content inside.
  // The Dialog component only renders a header, so nothing is shown in the dialog body.
  // Also, there is no way to close the dialog except programmatically.

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setOpen(true);
    // Simulate submission
    setTimeout(() => {
      setQuestion("");
      setSubmitting(false);
    }, 1000);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div className="bg-card border-muted/40 flex h-96 flex-col rounded-2xl border p-6 shadow-lg transition-all hover:shadow-xl">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <picture>
              <Image
              src="/logo.svg"
              alt="NeuroHub logo"
              width={28}
              height={28}
              className="sm:w-9 sm:h-9"
              priority
            />
              </picture>

            </DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <p>Have questions about the project?
          Ask your team members anything related to the project and get quick
              responses.</p>
          </div>
          <DialogFooter>
            <Button onClick={handleClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="text-primary mb-4 flex items-center gap-2 text-xl font-semibold">
        <MessageSquare className="h-5 w-5" />
        <span>Ask a Question</span>
        <span className="bg-primary/10 text-primary rounded px-2 py-0.5 font-mono text-xs">
          Beta
        </span>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex h-full flex-1 flex-col justify-between"
      >
        <textarea
          className="text-muted-foreground bg-muted/20 border-primary/20 focus:ring-primary/20 mb-4 flex h-full resize-none flex-col items-center justify-center rounded-xl border border-dashed p-6 transition focus:ring-2 focus:outline-none"
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
          className="bg-primary hover:bg-primary/90 focus:ring-primary/40 mt-4 self-end rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg focus:ring-2 focus:outline-none active:scale-95 disabled:opacity-60"
          disabled={submitting || question.trim() === ""}
        >
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default AskQuestion;
