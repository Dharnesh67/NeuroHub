import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CommitDetail } from "./github";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const Key = process.env.GEMINI_API_KEY;
const genAi = new GoogleGenerativeAI(Key || "");

const model = genAi.getGenerativeModel({
  model: "gemini-1.5-flash",
});

/**
 * Generates a concise, bullet-point summary of a commit using Gemini.
 * - Handles empty/invalid input gracefully.
 * - Trims and sanitizes fields.
 * - Retries on transient API errors (rate limit, network).
 * - Returns a user-friendly error message on failure.
 */
export const generateCommitSummary = async (
  commitDetail: CommitDetail,
): Promise<string> => {
  if (
    !commitDetail ||
    (Array.isArray(commitDetail) && commitDetail.length === 0)
  ) {
    return "No commit details provided.";
  }

  // Destructure and sanitize fields
  const {
    commitHash = "",
    commitMessage = "",
    commitAuthorName = "",
    commitDate = "",
    filesChanged = [],
    additions = 0,
    deletions = 0,
    summary = "",
  } = commitDetail as any;

  // Compose files changed string
  const filesChangedStr =
    Array.isArray(filesChanged) && filesChanged.length > 0
      ? filesChanged.map((f: string) => `[${f}]`).join(", ")
      : "None";

  // Compose prompt
  const prompt = `You are an expert programmer, and you are trying to summarize a git diff.
Reminders about the git diff format:
For every file, there are a few metadata lines, like (for example):
\`\`\`
diff --git a/lib/index.js b/lib/index.js
index aadf691..bfef603 100644
--- a/lib/index.js
+++ b/lib/index.js
\`\`\`
This means that \`lib/index.js\` was modified in this commit. Note that this is only an example.
Then there is a specifier of the lines that were modified.
A line starting with \`+\` means it was added.
A line that starting with \`-\` means that line was deleted.
A line that starts with neither \`+\` nor \`-\` is code given for context and better understanding.
It is not part of the diff.
[...]
EXAMPLE SUMMARY COMMENTS:
\`\`\`
* Raised the amount of returned recordings from \`10\` to \`100\` [packages/server/recordings_api.ts], [packages/server/constants.ts]
* Fixed a typo in the github action name [.github/workflows/gpt-commit-summarizer.yml]
* Moved the \`octokit\` initialization to a separate file [src/octokit.ts], [src/index.ts]
* Added an OpenAI API for completions [packages/utils/apis/openai.ts]
* Lowered numeric tolerance for test files
\`\`\`
Most commits will have less comments than this examples list.
The last comment does not include the file names,
because there were more than two relevant files in the hypothetical commit.
Do not include parts of the example in your summary.
It is given only as an example of appropriate comments.

Please summarise the following commit details and diff:

Commit Hash: ${commitHash}
Author: ${commitAuthorName}
Date: ${commitDate}
Files Changed: ${filesChangedStr}
Additions: ${additions}
Deletions: ${deletions}
Commit Message: ${commitMessage}

[If you have access to the diff, use it. Otherwise, summarize based on the above details.]

Output only the summary, in bullet points.
`;

  // Retry logic for transient errors (rate limit, network)
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // ms

  let lastError: any = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text =
        typeof response.text === "function"
          ? await response.text()
          : response.text;
      if (!text || !text.trim()) {
        throw new Error("Empty summary returned");
      }
      return text.trim();
    } catch (error: any) {
      lastError = error;
      // Retry on rate limit, service unavailable, or network errors
      if (
        error?.status === 429 ||
        error?.status === 503 ||
        error?.statusText === "Too Many Requests" ||
        error?.statusText === "Service Unavailable" ||
        error?.code === "ECONNRESET" ||
        error?.code === "ETIMEDOUT"
      ) {
        if (attempt < MAX_RETRIES) {
          const waitTime = RETRY_DELAY * Math.pow(2, attempt - 1);
          console.warn(
            `Transient error in generateCommitSummary, retrying in ${waitTime}ms (attempt ${attempt})...`,
            error,
          );
          await new Promise((res) => setTimeout(res, waitTime));
          continue;
        }
      }
      // For other errors or last attempt, break and return error
      break;
    }
  }
  console.error("All attempts failed in generateCommitSummary:", lastError);
  return "Summary generation failed.";
};

export default model;

export async function generateEmbedding(summary: string) {
  try {
    if (!summary?.trim()) {
      console.warn("Empty summary provided for embedding generation");
      return [];
    }
    // const genAi = new GoogleGenerativeAI(Key || "");

    const model = genAi.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(summary.slice(0, 5000));
    return result.embedding.values;
  } catch (error) {
    console.error("Error in generateEmbedding:", error);
    return [];
  }
}

export async function summariseCode(doc: Document) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second

  try {
    if (!doc?.metadata?.source) {
      console.warn("No source metadata found in document");
      return "";
    }

    const source = doc.metadata.source;
    console.log("getting summary for", source);
    const code = doc?.pageContent || "";

    if (!code.trim()) {
      console.warn("Empty or no content found in document");
      return "";
    }

    // Create a text splitter for code files
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000,
      chunkOverlap: 200,
      separators: ["\n\n", "\n", " ", ""],
    });

    // Split the code into chunks
    const chunks = await textSplitter.splitText(code);
    console.log(`Split code into ${chunks.length} chunks`);

    // If only one chunk, process normally
    if (chunks.length === 1) {
      return await processCodeChunk(chunks[0], source, MAX_RETRIES, RETRY_DELAY);
    }

    // Process each chunk and collect summaries
    const chunkSummaries = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkSummary = await processCodeChunk(
        chunks[i], 
        source, 
        MAX_RETRIES, 
        RETRY_DELAY,
        i + 1,
        chunks.length
      );
      if (chunkSummary) {
        chunkSummaries.push(chunkSummary);
      }
    }

    // If no summaries were generated, return empty
    if (chunkSummaries.length === 0) {
      return "";
    }

    // If only one summary, return it directly
    if (chunkSummaries.length === 1) {
      return chunkSummaries[0];
    }

    // Combine multiple summaries into a final summary
    return await combineSummaries(chunkSummaries, source, MAX_RETRIES, RETRY_DELAY);

  } catch (error) {
    console.error("Error in summariseCode:", error);
    return "";
  }
}

async function processCodeChunk(
  code: string, 
  source: string, 
  maxRetries: number, 
  retryDelay: number,
  chunkNumber?: number,
  totalChunks?: number
): Promise<string> {
  const chunkInfo = chunkNumber && totalChunks ? ` (Part ${chunkNumber}/${totalChunks})` : "";
  
  const prompt = `
You are an intelligent senior software engineer who specialises in onboarding junior software engineers onto projects.
You are onboarding a junior software engineer and explaining to them the purpose of the ${source} file${chunkInfo}.
Here is the code:
--
${code}
--
[ ] Give a summary no more than 100 words of the code above.
    `;

  let lastError: any = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await model.generateContent([prompt]);
      const text = response?.response?.text?.() || "";
      if (!text.trim()) {
        throw new Error("Empty summary returned");
      }
      return text;
    } catch (error: any) {
      lastError = error;
      // Check for rate limit (429), service unavailable (503), or retryable error
      if (
        error?.status === 429 ||
        error?.status === 503 ||
        error?.statusText === "Too Many Requests" ||
        error?.statusText === "Service Unavailable"
      ) {
        const waitTime = retryDelay * Math.pow(2, attempt - 1);
        console.warn(
          `Rate limited by Gemini API. Retrying in ${waitTime}ms (attempt ${attempt})...`,
        );
        await new Promise((res) => setTimeout(res, waitTime));
      } else {
        // For other errors, only retry if not the last attempt
        if (attempt < maxRetries) {
          const waitTime = retryDelay * Math.pow(2, attempt - 1);
          console.warn(
            `Error in processCodeChunk, retrying in ${waitTime}ms (attempt ${attempt})...`,
            error,
          );
          await new Promise((res) => setTimeout(res, waitTime));
        } else {
          break;
        }
      }
    }
  }
  // All retries failed
  console.error("All attempts failed in processCodeChunk:", lastError);
  return "";
}

async function combineSummaries(
  summaries: string[], 
  source: string, 
  maxRetries: number, 
  retryDelay: number
): Promise<string> {
  const combinedSummaries = summaries.join("\n\n");
  
  const prompt = `
You are an intelligent senior software engineer. You have been given multiple summaries of different parts of the ${source} file.
Please combine these summaries into a single, coherent summary that explains the overall purpose and functionality of the file.

Individual summaries:
${combinedSummaries}

[ ] Provide a unified summary no more than 150 words that explains the overall purpose and functionality of the ${source} file.
    `;

  let lastError: any = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await model.generateContent([prompt]);
      const text = response?.response?.text?.() || "";
      if (!text.trim()) {
        throw new Error("Empty summary returned");
      }
      return text;
    } catch (error: any) {
      lastError = error;
      // Check for rate limit (429), service unavailable (503), or retryable error
      if (
        error?.status === 429 ||
        error?.status === 503 ||
        error?.statusText === "Too Many Requests" ||
        error?.statusText === "Service Unavailable"
      ) {
        const waitTime = retryDelay * Math.pow(2, attempt - 1);
        console.warn(
          `Rate limited by Gemini API. Retrying in ${waitTime}ms (attempt ${attempt})...`,
        );
        await new Promise((res) => setTimeout(res, waitTime));
      } else {
        // For other errors, only retry if not the last attempt
        if (attempt < maxRetries) {
          const waitTime = retryDelay * Math.pow(2, attempt - 1);
          console.warn(
            `Error in combineSummaries, retrying in ${waitTime}ms (attempt ${attempt})...`,
            error,
          );
          await new Promise((res) => setTimeout(res, waitTime));
        } else {
          break;
        }
      }
    }
  }
  // All retries failed
  console.error("All attempts failed in combineSummaries:", lastError);
  return summaries.join(" ");
}

// const { text } = await generateText({
//   model: google('gemini-1.5-pro-latest'),
//   prompt: 'Write a vegetarian lasagna recipe for 4 people.',
// });
