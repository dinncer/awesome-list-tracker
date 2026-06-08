import type {
  GitHubCommit,
  GitHubCommitDetail,
  GitHubRepo,
} from "./types";

const API_BASE = "https://api.github.com";
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  ts: number;
}

function errorMessage(body: unknown, status: number): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }
  return `HTTP ${status}`;
}

async function apiFetch<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    throw new Error(errorMessage(body, response.status));
  }

  return response.json() as Promise<T>;
}

export async function getCommits(
  owner: string,
  repo: string,
  token: string,
  forceRefresh = false
): Promise<GitHubCommit[]> {
  const key = `commits_${owner}_${repo}`;

  if (!forceRefresh) {
    const cached = await browser.storage.local.get(key);
    const entry = cached[key] as CacheEntry<GitHubCommit[]> | undefined;
    if (entry && Date.now() - entry.ts < CACHE_TTL) {
      return entry.data;
    }
  }

  const data = await apiFetch<GitHubCommit[]>(
    `${API_BASE}/repos/${owner}/${repo}/commits?per_page=20`,
    token
  );
  await browser.storage.local.set({
    [key]: { data, ts: Date.now() } satisfies CacheEntry<GitHubCommit[]>,
  });
  return data;
}

export async function getCommitDetail(
  owner: string,
  repo: string,
  sha: string,
  token: string
): Promise<GitHubCommitDetail> {
  const key = `diff_${owner}_${repo}_${sha}`;
  const cached = await browser.storage.local.get(key);
  const detail = cached[key] as GitHubCommitDetail | undefined;
  if (detail) return detail;

  const data = await apiFetch<GitHubCommitDetail>(
    `${API_BASE}/repos/${owner}/${repo}/commits/${sha}`,
    token
  );
  await browser.storage.local.set({ [key]: data });
  return data;
}

function isAwesomeList(repo: GitHubRepo): boolean {
  const name = repo.name.toLowerCase();
  const description = (repo.description || "").toLowerCase();
  const topics = repo.topics || [];

  return (
    topics.includes("awesome-list") ||
    topics.includes("awesome") ||
    name.startsWith("awesome-") ||
    name === "awesome" ||
    description.startsWith("a curated list") ||
    description.includes(":sunglasses:")
  );
}

export async function fetchAllStarred(token: string): Promise<string[]> {
  const results: string[] = [];
  let page = 1;

  while (true) {
    const response = await fetch(
      `${API_BASE}/user/starred?per_page=100&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      throw new Error(errorMessage(body, response.status));
    }

    const repos = (await response.json()) as GitHubRepo[];
    if (repos.length === 0) break;

    repos.filter(isAwesomeList).forEach((repo) => {
      results.push(repo.full_name);
    });

    if (!(response.headers.get("Link") || "").includes('rel="next"')) break;
    page += 1;
  }

  return results;
}
