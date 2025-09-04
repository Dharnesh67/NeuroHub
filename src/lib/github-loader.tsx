import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { generateEmbedding, summariseCode } from "./gemini";
import { db } from "@/server/db";

export const GithubLoader = async (repoUrl: string, githubToken: string) => {
  const loader = new GithubRepoLoader(repoUrl, {
    accessToken: githubToken || process.env.GITHUB_TOKEN,
    ignoreFiles: [
      "node_modules",
      "dist",
      "build",
      "coverage",
      "logs",
      "package-lock.json",
      "package.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
      "README.md",
      "LICENSE",
      "CHANGELOG.md",
      "CONTRIBUTING.md",
      "CODE_OF_CONDUCT.md",
      "SECURITY.md",
      "CODEOWNERS",
      ".gitignore",
      ".env",
      ".env.local",
      ".env.development",
      ".env.production",
      ".env.test",
      ".env.development.local",
      ".env.production.local",
      ".env.test.local",
      ".env.development.local.example",
      ".env.production.local.example",
      ".env.test.local.example",
      ".env.development.example",
      ".env.production.example",
      ".env.test.example",
      ".env.development.example.local",
      ".env.production.example.local",
      ".env.test.example.local",
      ".env.development.example.local.example",
      ".env.production.example.local.example",
      ".env.test.example.local.example",
      ".env.development.example.local.example.local",
      ".env.production.example.local.example.local",
      ".env.test.example.local.example.local",
      ".env.development.example.local.example.local.example",
      ".env.production.example.local.example.local.example",
      ".env.test.example.local.example.local.example",
      ".env.development.example.local.example.local.example.local",
    ],
    recursive: true,
    unknown: "warn",
    maxConcurrency: 5,
  });
  const docs = await loader.load();
  return docs;
};

const getEmbeddings = async (docs: Document[], projectId: string) => {
  const results = [];

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    if (!doc) {
      console.warn(`Document at index ${i} is undefined, skipping`);
      continue;
    }

    const fileName = doc.metadata?.source ?? "";
    
    // Check if embedding for this file already exists in the database
    const existingEmbedding = await db.sourceembedding.findFirst({
      where: {
        projectId,
        fileName: fileName,
      },
    });

    if (existingEmbedding) {
      console.log(`Skipping ${fileName} - already exists in database`);
      continue;
    }

    let summary = "";
    let embedding: any[] = [];
    try {
      console.log(
        `Processing document ${i + 1}/${docs.length}: ${fileName}`,
      );
      
      // Create a text splitter for large files
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1500,
        chunkOverlap: 150,
        separators: ["\n\n", "\n", " ", ""],
      });

      // Split the document content into chunks
      const chunks = await textSplitter.splitText(doc.pageContent);
      console.log(`Split ${fileName} into ${chunks.length} chunks`);

      // If only one chunk, process normally
      if (chunks.length === 1) {
        const singleSummary = await summariseCode(doc);
        summary = singleSummary || `File: ${fileName}\n• Code summary unavailable.`;
      } else {
        // Process each chunk and collect summaries
        const chunkSummaries = [];
        for (let j = 0; j < chunks.length; j++) {
          const chunkDoc = new Document({
            pageContent: chunks[j],
            metadata: { ...doc.metadata, chunkIndex: j, totalChunks: chunks.length }
          });
          
          const chunkSummary = await summariseCode(chunkDoc);
          if (chunkSummary) {
            chunkSummaries.push(chunkSummary);
          }
        }

        // Combine multiple summaries into a final summary
        if (chunkSummaries.length > 0) {
          const combinedSummary = await combineChunkSummaries(chunkSummaries, fileName);
          summary = combinedSummary || `File: ${fileName}\n• Code summary unavailable.`;
        } else {
          summary = `File: ${fileName}\n• Code summary unavailable.`;
        }
      }
    } catch (error) {
      console.error(`Error generating summary for document ${i + 1}:`, error);
      summary = `File: ${fileName}\n• Code summary unavailable (summary error).`;
    }

    try {
      // Generate embedding for the combined summary
      embedding = await generateEmbedding(summary);
    } catch (error) {
      console.error(`Error generating embedding for document ${i + 1}:`, error);
      embedding = [];
    }

    if (!summary.trim() && (!embedding || embedding.length === 0)) {
      console.warn(
        `Skipping document ${i + 1} - no summary and no embedding generated`,
      );
      continue;
    }

    results.push({
      summary,
      embedding,
      sourceCode: doc.pageContent,
      fileName: fileName,
    });
  }

  return results;
};

// Helper function to combine multiple chunk summaries
const combineChunkSummaries = async (summaries: string[], fileName: string): Promise<string> => {
  try {
    // Use a simple approach to combine summaries
    // For now, we'll join them with a separator, but you could use AI to combine them
    if (summaries.length === 1) {
      return summaries[0];
    }
    
    // Create a combined summary that includes all parts
    const combinedSummary = `File: ${fileName}\n\nThis file contains multiple sections:\n\n${summaries.map((summary, index) => 
      `Section ${index + 1}:\n${summary}`
    ).join('\n\n')}`;
    
    return combinedSummary;
  } catch (error) {
    console.error("Error combining chunk summaries:", error);
    // Fallback to joining summaries
    return summaries.join("\n\n") || `File: ${fileName}\n• Code summary unavailable.`;
  }
};

export const indexGithubRepo = async (
  projectId: string,
  repoUrl: string,
  githubToken: string,
) => {
  try {
    console.log(`Starting to index GitHub repo: ${repoUrl}`);

    // Load documents from GitHub
    const docs = await GithubLoader(repoUrl, githubToken);
    console.log(`Loaded ${docs.length} documents from GitHub`);

    if (docs.length === 0) {
      console.warn("No documents found in the repository");
      return;
    }

    // Generate embeddings
    const allEmbeddings = await getEmbeddings(docs, projectId);
    console.log(`Generated embeddings for ${allEmbeddings.length} documents`);

    if (allEmbeddings.length === 0) {
      console.warn("No valid embeddings generated");
      return;
    }

    // Store embeddings in database
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < allEmbeddings.length; i++) {
      const embedding = allEmbeddings[i];
      if (!embedding) {
        console.warn(`Embedding at index ${i} is undefined, skipping`);
        continue;
      }

      try {
        console.log(`Storing embedding ${i + 1}/${allEmbeddings.length}: ${embedding.fileName}`);

        // Create the SourceCodeEmbedding row using the correct model name
        const sourceCodeEmbedding = await db.sourceembedding.create({
          data: {
            summary: embedding.summary,
            sourceCode: embedding.sourceCode,
            fileName: embedding.fileName,
            projectId,
          },
        });

        // Validate embedding before updating
        if (
          !embedding.embedding ||
          !Array.isArray(embedding.embedding) ||
          embedding.embedding.length !== 768
        ) {
          console.warn(
            `Invalid or missing embedding for file ${embedding.fileName}, skipping vector update.`,
          );
          continue;
        }

        // Update the summaryEmbedding vector using the correct table name (lowercase)
        try {
          await db.$executeRaw`
            UPDATE "sourceembedding"
            SET "summaryEmbedding" = ${embedding.embedding}::vector
            WHERE "id" = ${sourceCodeEmbedding.id};
          `;
        } catch (vectorError) {
          console.error(
            `Error updating vector for embedding ${i + 1}:`,
            vectorError,
          );
          errorCount++;
          continue;
        }

        successCount++;
      } catch (error) {
        console.error(`Error storing embedding ${i + 1}:`, error);
        errorCount++;
      }
    }

    console.log(
      `Indexing completed: ${successCount} successful, ${errorCount} failed`,
    );
  } catch (error) {
    console.error("Error in indexGithubRepo:", error);
    throw error;
  }
};

// RAG Query function to search through indexed code
export const queryCodebase = async (
  projectId: string,
  query: string,
  limit: number = 5,
) => {
  try {
    if (!query.trim()) {
      throw new Error("Query cannot be empty");
    }

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    if (!queryEmbedding || queryEmbedding.length === 0) {
      throw new Error("Failed to generate query embedding");
    }

    // Search for similar embeddings using cosine similarity
    const results = await db.$queryRaw`
      SELECT 
        id,
        summary,
        "sourceCode",
        "fileName",
        1 - ("summaryEmbedding" <=> ${queryEmbedding}::vector) as similarity
      FROM "SourceCodeEmbedding"
      WHERE "projectId" = ${projectId}
        AND "summaryEmbedding" IS NOT NULL
      ORDER BY similarity DESC
      LIMIT ${limit};
    `;

    return results as Array<{
      id: string;
      summary: string;
      sourceCode: string;
      fileName: string;
      similarity: number;
    }>;
  } catch (error) {
    console.error("Error in queryCodebase:", error);
    throw error;
  }
};

// Function to get codebase statistics
export const getCodebaseStats = async (projectId: string) => {
  try {
    const stats = await db.sourceembedding.aggregate({
      where: { projectId },
      _count: {
        id: true,
      },
    });

    return {
      totalFiles: stats._count.id,
    };
  } catch (error) {
    console.error("Error getting codebase stats:", error);
    throw error;
  }
};
