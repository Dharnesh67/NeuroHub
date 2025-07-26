type Project ={
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  githubUrl: string;
  deletedAt?: Date | null;
}

type ResponseType = {
  commitHash: string;
  commitMessage: string;
  commitAuthorName: string;
  commitDate: string;
  commitAuthorAvatar: string;
  Summary?: string;
};

export type { Project, ResponseType };
