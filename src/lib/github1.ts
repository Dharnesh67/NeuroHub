import { Octokit } from "octokit";
import type { ResponseType,Project } from "@/type";
import { db } from "@/server/db";
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

export const getCommitHash = async (
  githubUrl: string,
): Promise<CommitHash[]> => {
  // Parse owner and repo from githubUrl
  let owner:string = "";
  let repo:string = "";
  try {
    const url = new URL(githubUrl);
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




async function SummarizeCommit(githubUrl: string,commitHash: string) {
  const commit = await getCommitHash(githubUrl);
  console.log(commit);
  return commit;
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




