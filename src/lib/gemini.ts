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

// Enhanced prompt engineering
const createPrompt = (commitDetail: CommitDetail): string => {
  const {
    commitHash = "",
    commitMessage = "",
    commitAuthorName = "",
    commitDate = "",
    filesChanged = [],
    additions = 0,
    deletions = 0,
  } = commitDetail;

  const filesList = filesChanged.length > 0 
    ? filesChanged.map(f => `[${f}]`).join(", ")
    : "None";

  return `You are an expert software developer analyzing git commits. Your task is to create a concise, technical summary of the changes made in this commit.

COMMIT DETAILS:
- Hash: ${commitHash.substring(0, 8)}
- Author: ${commitAuthorName}
- Date: ${commitDate}
- Message: ${commitMessage}
- Files Changed: ${filesList}
- Additions: ${additions} lines
- Deletions: ${deletions} lines

INSTRUCTIONS:
1. Analyze the commit message and file changes
2. Create a clear, technical summary in bullet points
3. Focus on the main changes and their impact
4. Use technical terminology appropriate for developers
5. Keep each bullet point concise (max 100 characters)
6. If the commit message is clear, expand on it
7. If the commit message is unclear, infer the changes from file names and stats

OUTPUT FORMAT:
• [Summary of main change]
• [Additional changes if any]
• [Technical details if relevant]

EXAMPLE OUTPUT:
• Added user authentication middleware
• Implemented JWT token validation
• Updated API routes to require authentication

Please provide only the bullet points, no additional text.`;
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
    const fileTypes = new Set(filesChanged.map(f => f.split('.').pop() || 'unknown'));
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