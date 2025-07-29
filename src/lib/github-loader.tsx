import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";

export const GithubLoader = async (repoUrl: string,githubToken:string) => {
  const loader = new GithubRepoLoader(repoUrl,{
    accessToken: githubToken || 'process.env.GITHUB_TOKEN',
    ignoreFiles: [
      'node_modules',
      'dist',
      'build',
      'coverage',
      'logs',
      'package-lock.json',
      'package.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'pnpm-workspace.yaml',
    ],
    recursive: true,
    unknown: 'warn',
    maxConcurrency: 5,
  });
  const docs = await loader.load();
  return docs;
};

// Document{
//     pageContent: string,
//     metadata: {
//         source: string;
//         repository: string;
//         branch: string;
//     },
//     id: undefined;
// }


// console.log(await GithubLoader('https://github.com/langchain-ai/langchainjs', 'ghp_1234567890'));