import { Octokit } from "octokit";
import type { ResponseType,Project } from "@/type";
import { db } from "@/server/db";
export const github = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const TestgithubUrl = "https://github.com/Dharnesh67/NeuroHub";

export const getCommitHash = async (
  githubUrl: string,
): Promise<ResponseType[]> => {
  // Parse owner and repo from githubUrl
  let owner:string = "";
  let repo:string = "";
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

  const data = await github.rest.repos.listCommits({
    owner,
    repo,
    per_page: 10,
  });

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
  const { githubUrl } = await fetchGithubUrl(ProjectId);
  const commits = await getCommitHash(githubUrl || "");
  return commits;
};

async function fetchGithubUrl(ProjectId: string): Promise<{ githubUrl: string | null }> {
  const project = await db.project.findUnique({
    where: {
      id: ProjectId,
    },
  });
  return { githubUrl: project?.githubUrl ?? null };
}