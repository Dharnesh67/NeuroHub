"use client";
import React, { useState } from "react";
import AskQuestion from "../dashboard/AskQuestion";
import CodeReference from "../dashboard/CodeReference";
import useProjects from "@/hooks/use-projects";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Eye, MessageSquare } from "lucide-react";

// Define the Question type based on your backend schema
type Question = {
  id: string;
  question: string;
  answer: string;
  fileReferences: any;
  projectId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

const Page = () => {
  const { projectId } = useProjects();
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isCodeReferenceOpen, setIsCodeReferenceOpen] = useState(false);

  // Use tRPC's useQuery hook with proper typing
  const {
    data: questions = [],
    isLoading,
    error,
  } = api.project.getProjectsQuestions.useQuery(
    { projectId: projectId || "" },
    {
      enabled: !!projectId,
    }
  );

  const handleViewQuestion = (question: Question) => {
    setSelectedQuestion(question);
    setIsCodeReferenceOpen(true);
  };

  const handleCloseCodeReference = () => {
    setIsCodeReferenceOpen(false);
    setSelectedQuestion(null);
  };

  const handleNewQuestion = () => {
    setIsCodeReferenceOpen(false);
    setSelectedQuestion(null);
    // You can add logic here to trigger a new question form
  };

  return (
    <div className="flex h-screen w-full flex-col justify-start">
      <AskQuestion />
      <div className="list p-4">
        {!projectId && (
          <div className="text-muted-foreground">Select a project to view Q&amp;A.</div>
        )}
        {isLoading && <div className="text-muted-foreground">Loading questions...</div>}
        {error && <div className="text-destructive">{error.message || "Failed to fetch questions"}</div>}
        {!isLoading && !error && projectId && (
          <>
            {questions.length === 0 ? (
              <div className="text-muted-foreground">No questions yet for this project.</div>
            ) : (
              <ul className="space-y-4">
                {questions?.map((q: Question) => (
                  <li key={q.id} className="bg-background border-muted/30 rounded-xl border p-4 shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-primary" />
                          <h3 className="font-semibold text-primary">Q: {q.question}</h3>
                        </div>
                        <div className="text-muted-foreground text-sm line-clamp-3">
                          {q.answer}
                        </div>
                        {Array.isArray(q.fileReferences) && q.fileReferences.length > 0 && (
                          <div className="mt-2 flex items-center gap-1">
                            <span className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-semibold">
                              {q.fileReferences.length} file{q.fileReferences.length > 1 ? 's' : ''} referenced
                            </span>
                          </div>
                        )}
                        <div className="mt-2 text-xs text-muted-foreground">
                          {q.createdAt && q.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewQuestion(q)}
                        className="ml-4 flex-shrink-0"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* CodeReference Modal */}
      {selectedQuestion && (
        <CodeReference
          open={isCodeReferenceOpen}
          setOpen={setIsCodeReferenceOpen}
          question={selectedQuestion.question}
          response={selectedQuestion.answer}
          isStreaming={false}
          fileReferences={Array.isArray(selectedQuestion.fileReferences) ? selectedQuestion.fileReferences : []}
          handleNewQuestion={handleNewQuestion}
          handleClose={handleCloseCodeReference}
        />
      )}
    </div>
  );
};

export default Page;
