import { Octokit } from "octokit";
import type { ResponseType, Project } from "@/type";
import { db } from "@/server/db";
import { generateCommitSummary } from "./gemini";

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000; // 1 second between requests
const MAX_COMMITS_PER_REQUEST = 30;
const MAX_CONCURRENT_REQUESTS = 3;

export const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});
const TestgithubUrl = "https://github.com/Dharnesh67/NeuroHub";


// Utility function for rate limiting
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced error handling
class GitHubError extends Error {
  constructor(message: string, public status?: number, public code?: string) {
    super(message);
    this.name = 'GitHubError';
  }
}

interface CommitHash {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitDate: string;
  commitAuthorAvatar: string;
}

export interface CommitDetail {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitDate: string;
  commitAuthorAvatar: string;
  filesChanged?: string[];
  additions?: number;
  deletions?: number;
  summary?: string;
}

// Enhanced URL parsing with validation
export const parseGitHubUrl = (githubUrl: string): { owner: string; repo: string } => {
  try {
    const url = new URL(githubUrl);
    if (url.hostname !== 'github.com') {
      throw new Error('Invalid GitHub URL: must be from github.com');
    }
    
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length < 2) {
      throw new Error('Invalid GitHub URL: must include owner and repository');
    }
    
    const owner = parts[0] || '';
    const repo = (parts[1] || '').replace('.git', ''); // Remove .git suffix if present
    
    if (!owner || !repo) {
      throw new Error('Invalid GitHub URL: owner and repository cannot be empty');
    }
    
    return { owner, repo };
  } catch (error) {
    if (error instanceof Error) {
      throw new GitHubError(`Failed to parse GitHub URL: ${error.message}`);
    }
    throw new GitHubError('Invalid GitHub URL format');
  }
};

export const getCommitHash = async (
  githubUrl: string,
  maxCommits: number = MAX_COMMITS_PER_REQUEST
): Promise<CommitHash[]> => {
  try {
    const { owner, repo } = parseGitHubUrl(TestgithubUrl);
    
    console.log(`Fetching commits for ${owner}/${repo}`);
    
    const data = await github.rest.repos.listCommits({
      owner,
      repo,
      per_page: Math.min(maxCommits, 100), // GitHub API max is 100
    });

    if (!data.data || data.data.length === 0) {
      console.log(`No commits found for ${owner}/${repo}`);
      return [];
    }

    const sortedCommits = data.data.sort(
      (a, b) =>
        new Date(b.commit?.author?.date || "").getTime() -
        new Date(a.commit?.author?.date || "").getTime(),
    );

    return sortedCommits.slice(0, maxCommits).map((commit) => ({
      commitHash: commit.sha,
      commitMessage: commit.commit?.message || "",
      commitAuthorName: commit.commit?.author?.name || "",
      commitDate: commit.commit?.author?.date || "",
      commitAuthorAvatar: commit.author?.avatar_url || "",
    }));
  } catch (error) {
    console.error('Error fetching commits:', error);
    if (error instanceof Error) {
      throw new GitHubError(`Failed to fetch commits: ${error.message}`);
    }
    throw new GitHubError('Unknown error occurred while fetching commits');
  }
};

// Enhanced commit fetching with detailed information
export const getCommitDetails = async (
  githubUrl: string,
  commitHash: string
): Promise<CommitDetail> => {
  try {
    const { owner, repo } = parseGitHubUrl(githubUrl);
    
    // Add rate limiting delay
    await delay(RATE_LIMIT_DELAY);
    
    const commitData = await github.rest.repos.getCommit({
      owner,
      repo,
      ref: commitHash,
    });

    const commit = commitData.data;
    const stats = commit.stats || { additions: 0, deletions: 0 };
    const filesChanged = commit.files?.map(file => file.filename || '').filter(Boolean) || [];

    return {
      commitHash: commit.sha,
      commitMessage: commit.commit?.message || "",
      commitAuthorName: commit.commit?.author?.name || "",
      commitDate: commit.commit?.author?.date || "",
      commitAuthorAvatar: commit.author?.avatar_url || "",
      filesChanged,
      additions: stats.additions,
      deletions: stats.deletions,
    };
  } catch (error) {
    console.error(`Error fetching commit details for ${commitHash}:`, error);
    throw new GitHubError(`Failed to fetch commit details: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Batch processing with concurrency control
const processBatch = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = MAX_CONCURRENT_REQUESTS
): Promise<R[]> => {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(
      batch.map(item => processor(item))
    );
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`Failed to process item ${i + index}:`, result.reason);
      }
    });
    
    // Add delay between batches to respect rate limits
    if (i + batchSize < items.length) {
      await delay(RATE_LIMIT_DELAY);
    }
  }
  
  return results;
};

export const PullCommits = async (ProjectId: string) => {
  console.log(`Starting PullCommits for project ${ProjectId}`);
  
  try {
    const { project, githubUrl } = await fetchGithubUrl(ProjectId);
    
    if (!githubUrl) {
      throw new Error("GitHub URL not found for project");
    }

    // Fetch commits
    const commitsHashes = await getCommitHash(githubUrl);
    console.log(`Found ${commitsHashes.length} commits`);

    // Filter unprocessed commits
    const unprocessedCommits = await filterUnprocessedCommits(commitsHashes, ProjectId);
    console.log(`Found ${unprocessedCommits.length} unprocessed commits`);

    if (unprocessedCommits.length === 0) {
      console.log('No new commits to process');
      return { processed: 0, total: commitsHashes.length };
    }

    // Process commits in batches with detailed information
    const commitDetails = await processBatch(
      unprocessedCommits,
      async (commit) => {
        const details = await getCommitDetails(githubUrl, commit.commitHash);
        return { ...commit, ...details };
      }
    );

    // Generate summaries in batches
    const summaries = await processBatch(
      commitDetails,
      async (commit) => {
        try {
          const summary = await generateCommitSummary(commit);
          return summary;
        } catch (error) {
          console.error(`Failed to generate summary for ${commit.commitHash}:`, error);
          return "Summary generation failed.";
        }
      }
    );

    // Batch insert into database
    const commitsToInsert = commitDetails.map((commit, index) => ({
      projectId: ProjectId,
      commitMessage: commit.commitMessage,
      commitHash: commit.commitHash,
      commitAuthorName: commit.commitAuthorName,
      commitDate: new Date(commit.commitDate),
      commitAuthorAvatar: commit.commitAuthorAvatar,
      Summary: summaries[index] || "",
    }));

    const result = await db.commit.createMany({
      data: commitsToInsert,
      skipDuplicates: true, // Prevent duplicate entries
    });

    console.log(`Successfully processed ${result.count} commits`);
    return { processed: result.count, total: commitsHashes.length };
    
  } catch (error) {
    console.error('Error in PullCommits:', error);
    throw error;
  }
};

async function fetchGithubUrl(ProjectId: string) {
  const project = await db.project.findUnique({
    where: { id: ProjectId },
    select: { githubUrl: true, name: true },
  });
  
  if (!project) {
    throw new Error("Project not found");
  }
  
  return { project, githubUrl: project.githubUrl };
}

// Enhanced commit summarization with better error handling
export async function SummarizeCommit(githubUrl: string, commitHash: string) {
  try {
    const { owner, repo } = parseGitHubUrl(githubUrl);
    
    // Fetch commit details instead of raw diff for better context
    const commitDetails = await getCommitDetails(githubUrl, commitHash);
    
    const summary = await generateCommitSummary(commitDetails);
    return summary;
  } catch (error) {
    console.error(`Error summarizing commit ${commitHash}:`, error);
    return "Summary generation failed.";
  }
}

async function filterUnprocessedCommits(commitsHashes: CommitHash[], ProjectId: string) {
  try {
    const processedCommits = await db.commit.findMany({
      where: { projectId: ProjectId },
      select: { commitHash: true },
    });

    const processedHashes = new Set(processedCommits.map(commit => commit.commitHash));
    const unprocessedCommits = commitsHashes.filter(
      (commit) => !processedHashes.has(commit.commitHash)
    );

    return unprocessedCommits;
  } catch (error) {
    console.error('Error filtering unprocessed commits:', error);
    throw error;
  }
}

// New function to get project statistics
export const getProjectStats = async (ProjectId: string) => {
  try {
    const stats = await db.commit.groupBy({
      by: ['projectId'],
      where: { projectId: ProjectId },
      _count: { commitHash: true },
    });

    return stats[0] || { _count: { commitHash: 0 } };
  } catch (error) {
    console.error('Error getting project stats:', error);
    throw error;
  }
};




