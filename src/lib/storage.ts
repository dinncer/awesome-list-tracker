import type { Settings } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const LOOKBACK_DAYS = 5;

function lastCheckedKey(owner: string, repo: string): string {
  return `lastChecked_${owner}_${repo}`;
}

export async function getSettings(): Promise<Settings> {
  return browser.storage.local.get([
    "githubToken",
    "trackedRepos",
  ]) as Promise<Settings>;
}

export async function saveSettings(settings: Required<Settings>): Promise<void> {
  await browser.storage.local.set(settings);
}

export async function getLastChecked(
  owner: string,
  repo: string
): Promise<number> {
  const key = lastCheckedKey(owner, repo);
  const data = await browser.storage.local.get(key);
  return typeof data[key] === "number" ? data[key] : 0;
}

export async function setLastChecked(
  owner: string,
  repo: string
): Promise<void> {
  await browser.storage.local.set({
    [lastCheckedKey(owner, repo)]: Date.now(),
  });
}

export function getThreshold(lastChecked: number): number {
  return lastChecked === 0
    ? Date.now() - LOOKBACK_DAYS * MS_PER_DAY
    : lastChecked;
}
