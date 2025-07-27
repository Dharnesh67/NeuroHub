import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CommitDetail } from "./github";

const Key = process.env.GEMINI_API_KEY;
const genAi = new GoogleGenerativeAI(Key || "");

const model = genAi.getGenerativeModel({
  model: "gemini-1.5-flash",
});

// Order from @file_context_0:
// commitHash, commitMessage, commitAuthorName, commitDate, commitAuthorAvatar, filesChanged, additions, deletions, summary

export const generateCommitSummary = async (
  commitDetail: CommitDetail
): Promise<string> => {
  // If the commitDetail object is empty (i.e., []), return a default message
  if (
    !commitDetail ||
    (Array.isArray(commitDetail) && commitDetail.length === 0)
  ) {
    return "No commit details provided.";
  }

  // Destructure commitDetail in the specified order
  const {
    commitHash = "",
    commitMessage = "",
    commitAuthorName = "",
    commitDate = "",
    commitAuthorAvatar = "",
    filesChanged = [],
    additions = 0,
    deletions = 0,
    summary = ""
  } = commitDetail as any;

  // Full previous prompt
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
Files Changed: ${Array.isArray(filesChanged) && filesChanged.length > 0 ? (filesChanged as string[]).map((f: string) => `[${f}]`).join(", ") : "None"}
Additions: ${additions}
Deletions: ${deletions}
Commit Message: ${commitMessage}

[If you have access to the diff, use it. Otherwise, summarize based on the above details.]

Output only the summary, in bullet points.
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text.trim();
  } catch (error) {
    console.error("Error generating commit summary:", error);
    return "Summary generation failed.";
  }
};

export default model;