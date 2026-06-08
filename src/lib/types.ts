export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
}

export interface GitHubCommitFile {
  filename: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface GitHubCommitDetail {
  files?: GitHubCommitFile[];
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  topics?: string[];
  full_name: string;
}

export interface Settings {
  githubToken?: string;
  trackedRepos?: string[];
}

export interface RepoUpdate {
  fullName: string;
  newCount: number;
}
