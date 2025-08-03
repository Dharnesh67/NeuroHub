"use server";
import { generateEmbedding } from "@/lib/gemini";
import { db } from "@/server/db";
import { google, createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText } from "ai";

const Google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const AskQuestion = async (question: string, projectId: string) => {
  if (!question?.trim()) {
    throw new Error("Question cannot be empty");
  }
  if (!projectId?.trim()) {
    throw new Error("Project ID is required");
  }

  try {
    const queryEmbedding = await generateEmbedding(question);
    if (
      !queryEmbedding ||
      !Array.isArray(queryEmbedding) ||
      queryEmbedding.length !== 768
    ) {
      throw new Error(
        `Failed to generate embedding (expected 768 dimensions, got ${Array.isArray(queryEmbedding) ? queryEmbedding.length : "invalid"})`
      );
    }

    const embeddingLiteral = `[${queryEmbedding.join(",")}]`;

    const results = await db.$queryRawUnsafe(
      `
      SELECT 
        "fileName", 
        "sourceCode", 
        "summary",
        1 - ("summaryEmbedding" <=> CAST($1 AS vector(768))) AS similarity
      FROM "sourceembedding"
      WHERE 
        "projectId" = $2
        AND "summaryEmbedding" IS NOT NULL
      ORDER BY similarity DESC
      LIMIT 5;
      `,
      embeddingLiteral,
      projectId
    );

    const StructuredResults = results as Array<{
      fileName: string;
      sourceCode: string;
      summary: string;
      similarity: number;
    }>;

    let context = "";
    for (const doc of StructuredResults) {
      context += `File: ${doc.fileName}\nSummary: ${doc.summary}\nSource Code: ${doc.sourceCode}\n\n`;
    }

    const prompt = `You are an AI code assistant who answers questions about the codebase. Your target audience is a technical intern with some programming knowledge.

    AI assistant is a brand new, powerful, human-like artificial intelligence. The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
    
    AI is a well-behaved and well-mannered individual. AI is always friendly, kind, and inspiring, and is eager to provide vivid and thoughtful responses to the user.
    
    AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic. If the question is asking about code or a specific file, AI will provide detailed answers, giving step-by-step instructions.
    
    START CONTEXT BLOCK
    ${context}
    END OF CONTEXT BLOCK
    
    ---
    
    START QUESTION
    ${question}
    END OF QUESTION
    
    AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation. 
    
    If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't have enough context to answer that question." 
    
    AI assistant will not apologize for previous responses, but instead will indicate when new information is available. AI assistant will not invent anything that is not drawn directly from the context.
    
    Answer in markdown syntax, with code snippets if needed. Be as detailed as possible when answering.`;

    // Create a ReadableStream for streaming the response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await streamText({
            model: Google("gemini-1.5-flash"),
            prompt,
          });

          // Handle the streaming response
          for await (const chunk of result.textStream) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    // Return the stream and file references
    return {
      output: stream,
      fileReferences: StructuredResults,
    };
  } catch (error) {
    console.error("Error in AskQuestion:", error);
    throw error;
  }
};
