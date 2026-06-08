import { useEffect, useState } from "react";
import { getCommits } from "../lib/github";
import {
  getLastChecked,
  getSettings,
  getThreshold,
  setLastChecked,
} from "../lib/storage";
import type { RepoUpdate } from "../lib/types";
import { CommitList } from "./CommitList";

export function App() {
  const [token, setToken] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [updates, setUpdates] = useState<RepoUpdate[]>([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [isChecking, setIsChecking] = useState(true);
  const [refreshRequest, setRefreshRequest] = useState<{
    fullName: string;
    key: number;
  }>();

  useEffect(() => {
    let active = true;

    async function initialize(): Promise<void> {
      const settings = await getSettings();
      const githubToken = settings.githubToken || "";
      const repos = settings.trackedRepos || [];

      if (!active) return;
      setToken(githubToken);
      setIsConfigured(Boolean(githubToken && repos.length > 0));

      if (!githubToken || repos.length === 0) {
        setIsChecking(false);
        return;
      }

      const checks = await Promise.allSettled(
        repos.map(async (fullName) => {
          const [owner, repo] = fullName.split("/");
          const commits = await getCommits(owner, repo, githubToken);
          const lastChecked = await getLastChecked(owner, repo);
          const threshold = getThreshold(lastChecked);
          const newCount = commits.filter(
            (commit) =>
              new Date(commit.commit.author.date).getTime() > threshold
          ).length;
          return { fullName, newCount };
        })
      );

      if (!active) return;
      const nextUpdates = checks.flatMap((result) =>
        result.status === "fulfilled" && result.value.newCount > 0
          ? [result.value]
          : []
      );
      const totalNew = nextUpdates.reduce(
        (sum, update) => sum + update.newCount,
        0
      );

      setUpdates(nextUpdates);
      setSelectedRepo(nextUpdates[0]?.fullName || "");
      setIsChecking(false);
      await browser.browserAction.setBadgeText({
        text: totalNew > 0 ? String(totalNew) : "",
      });
      await browser.browserAction.setBadgeBackgroundColor({ color: "#238636" });
    }

    void initialize();
    return () => {
      active = false;
    };
  }, []);

  async function markAsRead(): Promise<void> {
    const [owner, repo] = selectedRepo.split("/");
    await setLastChecked(owner, repo);

    const remaining = updates.filter(
      (update) => update.fullName !== selectedRepo
    );
    const remainingCount = remaining.reduce(
      (sum, update) => sum + update.newCount,
      0
    );
    setUpdates(remaining);
    setSelectedRepo(remaining[0]?.fullName || "");
    await browser.browserAction.setBadgeText({
      text: remainingCount > 0 ? String(remainingCount) : "",
    });
  }

  return (
    <div id="app">
      <header>
        <span className="title">Awesome List Tracker</span>
        <div className="header-actions">
          <button
            type="button"
            title="Refresh"
            disabled={!selectedRepo}
            onClick={() =>
              setRefreshRequest((request) => ({
                fullName: selectedRepo,
                key: (request?.key || 0) + 1,
              }))
            }
          >
            ↻
          </button>
          <button
            type="button"
            title="Settings"
            onClick={() => browser.runtime.openOptionsPage()}
          >
            ⚙
          </button>
        </div>
      </header>

      {!isConfigured && !isChecking && (
        <div id="no-config">
          <p>No GitHub token or repos configured.</p>
          <button
            type="button"
            onClick={() => browser.runtime.openOptionsPage()}
          >
            Open Settings
          </button>
        </div>
      )}

      {isConfigured && (
        <div id="main">
          {updates.length > 0 && (
            <div className="repo-selector">
              <select
                value={selectedRepo}
                onChange={(event) => setSelectedRepo(event.target.value)}
              >
                {updates.map((update) => (
                  <option key={update.fullName} value={update.fullName}>
                    {update.fullName} ({update.newCount})
                  </option>
                ))}
              </select>
              <button
                id="btn-mark-read"
                type="button"
                title="Mark all as read"
                onClick={markAsRead}
              >
                ✓ Mark as read
              </button>
            </div>
          )}

          <div id="commits-container">
            {isChecking && <div id="loading">Checking for updates…</div>}
            {!isChecking && updates.length === 0 && (
              <div id="all-caught-up">✓ All caught up!</div>
            )}
            {!isChecking && selectedRepo && (
              <CommitList
                fullName={selectedRepo}
                token={token}
                refreshKey={
                  refreshRequest?.fullName === selectedRepo
                    ? refreshRequest.key
                    : 0
                }
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
