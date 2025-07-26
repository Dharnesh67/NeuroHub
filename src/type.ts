type Project ={
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  githubUrl: string;
  deletedAt?: Date | null;
}

export type { Project };