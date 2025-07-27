import { Octokit } from "octokit";
import type { ResponseType,Project } from "@/type";
import { db } from "@/server/db";
import { generateCommitSummary } from "./gemini";
export const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const TestgithubUrl = "https://github.com/Dharnesh67/NeuroHub";


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
  filesChanged: string[];
  additions: number;
  deletions: number;
  summary?: string;
}

export const getCommitHash = async (
  githubUrl: string,
): Promise<CommitHash[]> => {
  // Parse owner and repo from githubUrl
  let owner:string = "";
  let repo:string = "";
  try {
    const url = new URL(TestgithubUrl); // Fixed: use passed githubUrl instead of TestgithubUrl
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      owner = parts?.[0] || "";
      repo = parts?.[1] || "" ;
    } else {
      throw new Error("Invalid GitHub URL");
    }
  } catch (e) {
    throw new Error("Invalid GitHub URL");
  }

  const data = await github.rest.repos.listCommits({
    owner,
    repo,
    per_page: 10,
  });
  console.log("data",data);
  const SortedCommits = data.data.sort(
    (a, b) =>
      new Date(b.commit?.author?.date || "").getTime() -
      new Date(a.commit?.author?.date || "").getTime(),
  );

  return SortedCommits.slice(0, 10).map((commit) => {
    return {
      commitHash: commit.sha,
      commitMessage: commit.commit?.message || "",
      commitAuthorName: commit.commit?.author?.name || "",
      commitDate: commit.commit?.author?.date || "",
      commitAuthorAvatar: commit.author?.avatar_url || "",
    };
  });
};

export const PullCommits = async (ProjectId: string) => {
  console.log("Called PullCommits");
  const { project,githubUrl } = await fetchGithubUrl(ProjectId);
  const commitsHashes = await getCommitHash(githubUrl || "");
  const unprocessedCommits = await filterUnprocessedCommits(commitsHashes,ProjectId);
  console.log("unprocessedCommits",unprocessedCommits);
  return unprocessedCommits;
};

async function fetchGithubUrl(ProjectId: string) {
  const project = await db.project.findUnique({
    where: {
      id: ProjectId,  
    },
    select: {
      githubUrl: true,
    },
  });
  if(!project) {
    throw new Error("Project not found");
  }
  return { project, githubUrl: project.githubUrl };
}

export async function SummarizeCommit(githubUrl: string, commitHash: string): Promise<CommitDetail> {
  // Parse owner and repo from githubUrl
  let owner: string = "";
  let repo: string = "";
  try {
    const url = new URL(githubUrl);
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      owner = parts?.[0] || "";
      repo = parts?.[1] || "";
    } else {
      throw new Error("Invalid GitHub URL");
    }
  } catch (e) {
    throw new Error("Invalid GitHub URL");
  }

  // Get detailed commit information
  const commitData = await github.rest.repos.getCommit({
    owner,
    repo,
    ref: commitHash,
  });

  const commit = commitData.data;
  const filesChanged = commit.files?.map(file => file.filename) || [];
  const additions = commit.stats?.additions || 0;
  const deletions = commit.stats?.deletions || 0;

  // Generate a summary based on the commit message and changes
  const commitDetail: CommitDetail = {
    commitHash: commit.sha,
    commitMessage: commit.commit?.message || "",
    commitAuthorName: commit.commit?.author?.name || "",
    commitDate: commit.commit?.author?.date || "",
    commitAuthorAvatar: commit.author?.avatar_url || "",
    filesChanged,
    additions,
    deletions,
  }
  const summary = await generateCommitSummary(commitDetail);
  commitDetail.summary = summary;
  return commitDetail;
}


async function filterUnprocessedCommits(commitsHashes: CommitHash[], ProjectId: string) {
  const ProcessedCommits = await db.commit.findMany({
    where: {
      projectId: ProjectId,
    },
  });
  const unprocessedCommits = commitsHashes.filter((commitHash) => !ProcessedCommits.some((commit) => commit.commitHash === commitHash.commitHash));
  return unprocessedCommits;
}

export async function saveCommitToDatabase(commitDetail: CommitDetail, ProjectId: string) {
  try {
    const savedCommit = await db.commit.create({
      data: {
        projectId: ProjectId,
        commitMessage: commitDetail.commitMessage,
        commitHash: commitDetail.commitHash,
        commitAuthorName: commitDetail.commitAuthorName,
        commitDate: new Date(commitDetail.commitDate),
        commitAuthorAvatar: commitDetail.commitAuthorAvatar,
        Summary: commitDetail.summary,
      },
    });
    return savedCommit;
  } catch (error) {
    console.error("Error saving commit to database:", error);
    throw error;
  }
}

export async function processAndSaveCommits(ProjectId: string) {
  try {
    const { githubUrl } = await fetchGithubUrl(ProjectId);
    const commitsHashes = await getCommitHash(githubUrl || "");
    const unprocessedCommits = await filterUnprocessedCommits(commitsHashes, ProjectId);
    
    const processedCommits = [];
    
    for (const commit of unprocessedCommits) {
      const commitDetail = await SummarizeCommit(githubUrl || "", commit.commitHash);
      const savedCommit = await saveCommitToDatabase(commitDetail, ProjectId);
      processedCommits.push(savedCommit);
    }
    
    return processedCommits;
  } catch (error) {
    console.error("Error processing commits:", error);
    throw error;
  }
}




