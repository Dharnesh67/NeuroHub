import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CommitDetail } from "./github";

const Key = process.env.GEMINI_API_KEY;
const genAi = new GoogleGenerativeAI(Key || "");

const model = genAi.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// Configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const MAX_TOKENS = 1000;

// Simple in-memory cache (consider using Redis for production)
const summaryCache = new Map<string, string>();

// Utility function for delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced error handling
class GeminiError extends Error {
  constructor(message: string, public code?: string, public retryable?: boolean) {
    super(message);
    this.name = 'GeminiError';
  }
}

// Generate cache key for commit
const generateCacheKey = (commitDetail: CommitDetail): string => {
  return `${commitDetail.commitHash}-${(commitDetail.commitMessage || '').substring(0, 50)}`;
};

// Enhanced prompt engineering with comprehensive commit analysis
const createPrompt = (commitDetail: CommitDetail): string => {
  const {
    commitHash = "",
    commitMessage = "",
    commitAuthorName = "",
    commitDate = "",
    commitAuthorAvatar = "",
    filesChanged = [],
    additions = 0,
    deletions = 0
  } = commitDetail;

  const filesList = filesChanged && filesChanged.length > 0 
    ? filesChanged.map(f => `[${f}]`).join("\n  ")
    : "None";

  return `You are an expert software developer analyzing git commits with deep technical knowledge. Your task is to create a detailed, technical summary of the changes made in this commit.

COMMIT DETAILS:
- Hash: ${commitHash.substring(0, 8)}
- Author: ${commitAuthorName}
- Date: ${commitDate}
- Message: ${commitMessage}
- Files Changed:
  ${filesList}
- Total Changes: ${additions || 0} lines added, ${deletions || 0} lines deleted

ANALYSIS INSTRUCTIONS:
1. First, analyze the commit message for technical intent and clarity
2. Examine changed files and their paths for patterns/relationships
3. Review additions/deletions for change significance
4. Note any test files changed alongside implementation files
5. Detect if this is a merge commit, feature, bugfix, or refactor
6. Identify potential impacts on dependent code

SUMMARY REQUIREMENTS:
1. Start with the primary purpose of the commit
2. Include secondary changes in order of importance
3. Note any architectural or design pattern changes
4. Mention specific technologies/libraries affected
5. Highlight security implications if present
6. Call out test coverage changes
7. Flag any potential breaking changes
8. Keep each point technically precise but concise (max 120 chars)

OUTPUT FORMAT:
Provide a detailed, technical summary of the commit using the following bullet point structure. For each point, be specific and concise, focusing on the technical impact and intent of the change. Include as many relevant points as needed to fully capture the scope of the commit.

• [Main change] - Clearly state the primary technical modification or feature introduced in this commit.
• [Secondary changes] - List any additional significant changes, enhancements, or fixes.
• [Refactor] - Describe any code quality improvements, restructuring, or optimizations.
• [Tests] - Summarize changes to test coverage, new or updated test cases, and their impact.
• [Dependencies] - Note any updates, additions, or removals of libraries, packages, or dependencies.
• [BREAKING] - Explicitly call out any breaking changes or backward-incompatible modifications.
• [Security] - Highlight any security-related changes, fixes, or vulnerabilities addressed.
• [Docs] - Mention updates to documentation, comments, or code annotations.
• [Performance] - Describe any performance improvements or regressions.
• [Other] - Include any other relevant technical details not covered above.

EXAMPLE OUTPUT:
• Implemented OAuth2 authentication flow - Added /auth endpoints and middleware
• Added JWT token generation and validation for secure user sessions
• Refactored user service to support multiple authentication providers
• Added integration and unit tests for authentication scenarios (87% coverage)
• Updated axios dependency to v1.4.0 (security patch)
• [BREAKING] Changed user session storage format to encrypted JWT
• Fixed XSS vulnerability in login form input handling
• Updated API documentation for new authentication endpoints
• Improved login response time by optimizing database queries

Only provide the bullet points as output. Do not include any extra commentary, explanations, or section headers.`;
};

export const generateCommitSummary = async (
  commitDetail: CommitDetail
): Promise<string> => {
  // Validate input
  if (!commitDetail || typeof commitDetail !== 'object') {
    return "No commit details provided.";
  }

  if (!commitDetail.commitHash || !commitDetail.commitMessage) {
    return "Insufficient commit information for summary.";
  }

  // Check cache first
  const cacheKey = generateCacheKey(commitDetail);
  if (summaryCache.has(cacheKey)) {
    console.log(`Cache hit for commit ${commitDetail.commitHash.substring(0, 8)}`);
    return summaryCache.get(cacheKey)!;
  }

  // Validate API key
  if (!Key) {
    console.error("GEMINI_API_KEY not configured");
    return "Summary generation failed: API key not configured.";
  }

  const prompt = createPrompt(commitDetail);
  let lastError: Error | null = null;

  // Retry logic
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Generating summary for commit ${commitDetail.commitHash.substring(0, 8)} (attempt ${attempt})`);

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: MAX_TOKENS,
          temperature: 0.3, // Lower temperature for more consistent results
          topP: 0.8,
          topK: 40,
        },
      });

      const response = await result.response;
      const text = response.text().trim();

      // Validate response
      if (!text || text.length < 10) {
        throw new GeminiError("Generated summary is too short or empty", "INVALID_RESPONSE", true);
      }

      // Cache the result
      summaryCache.set(cacheKey, text);
      
      // Limit cache size to prevent memory issues
      if (summaryCache.size > 1000) {
        const firstKey = summaryCache.keys().next().value;
        if (firstKey) {
          summaryCache.delete(firstKey);
        }
      }

      console.log(`Successfully generated summary for commit ${(commitDetail.commitHash || '').substring(0, 8)}`);
      return text;

    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed for commit ${(commitDetail.commitHash || '').substring(0, 8)}:`, error);

      // Check if error is retryable
      if (error instanceof GeminiError && !error.retryable) {
        break;
      }

      // Rate limiting or temporary errors
      if (attempt < MAX_RETRIES) {
        const waitTime = RETRY_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`Retrying in ${waitTime}ms...`);
        await delay(waitTime);
      }
    }
  }

  // All retries failed
  console.error(`All attempts failed for commit ${(commitDetail.commitHash || '').substring(0, 8)}:`, lastError);
  
  // Return a fallback summary based on commit message
  const fallbackSummary = generateFallbackSummary(commitDetail);
  summaryCache.set(cacheKey, fallbackSummary);
  
  return fallbackSummary;
};

// Fallback summary generation when AI fails
const generateFallbackSummary = (commitDetail: CommitDetail): string => {
  const { commitMessage, filesChanged, additions, deletions } = commitDetail;
  
  const summary: string[] = [];
  
  // Extract key information from commit message
  const message = (commitMessage || '').toLowerCase();
  
  if (message.includes('fix') || message.includes('bug')) {
    summary.push('• Fixed bug or issue');
  }
  
  if (message.includes('add') || message.includes('new')) {
    summary.push('• Added new feature or functionality');
  }
  
  if (message.includes('update') || message.includes('modify')) {
    summary.push('• Updated existing functionality');
  }
  
  if (message.includes('refactor')) {
    summary.push('• Refactored code structure');
  }
  
  if (message.includes('test')) {
    summary.push('• Added or updated tests');
  }
  
  if (message.includes('docs') || message.includes('readme')) {
    summary.push('• Updated documentation');
  }
  
  // Add file change information
  if (filesChanged && filesChanged.length > 0) {
    const fileTypes = new Set(filesChanged.map(f => {
      const parts = f.split('.');
      return parts.length > 1 ? parts.pop() || 'unknown' : 'unknown';
    }));
    if (fileTypes.size <= 3) {
      summary.push(`• Modified ${Array.from(fileTypes).join(', ')} files`);
    } else {
      summary.push(`• Modified ${filesChanged.length} files`);
    }
  }
  
  // Add stats information
  if ((additions && additions > 0) || (deletions && deletions > 0)) {
    summary.push(`• ${additions || 0} additions, ${deletions || 0} deletions`);
  }
  
  // If no meaningful summary could be generated
  if (summary.length === 0) {
    summary.push('• Code changes made');
  }
  
  return summary.join('\n');
};

// Utility function to clear cache (useful for testing or memory management)
export const clearSummaryCache = (): void => {
  summaryCache.clear();
  console.log('Summary cache cleared');
};

// Utility function to get cache statistics
export const getCacheStats = (): { size: number; hits: number } => {
  return {
    size: summaryCache.size,
    hits: 0, // Would need to implement hit tracking for production
  };
};

export default model;