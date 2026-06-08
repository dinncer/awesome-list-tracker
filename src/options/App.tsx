import { useEffect, useState } from "react";
import { fetchAllStarred } from "../lib/github";
import { getErrorMessage } from "../lib/format";
import { getSettings, saveSettings } from "../lib/storage";

type StatusType = "success" | "error" | "";

export function App() {
  const [token, setToken] = useState("");
  const [repos, setRepos] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [fetchStatus, setFetchStatus] = useState("");
  const [fetchStatusType, setFetchStatusType] = useState<StatusType>("");
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    void getSettings().then((settings) => {
      setToken(settings.githubToken || "");
      setRepos((settings.trackedRepos || []).join("\n"));
    });
  }, []);

  async function save(): Promise<void> {
    const trackedRepos = repos
      .split("\n")
      .map((repo) => repo.trim())
      .filter((repo) => /^[\w.-]+\/[\w.-]+$/.test(repo));

    try {
      await saveSettings({
        githubToken: token.trim(),
        trackedRepos,
      });
      setSaveStatus("Saved!");
      window.setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      setSaveStatus(`Save failed: ${getErrorMessage(error)}`);
    }
  }

  async function importStarred(): Promise<void> {
    const githubToken = token.trim();
    if (!githubToken) {
      setFetchStatus("Enter your token first.");
      setFetchStatusType("error");
      window.setTimeout(() => setFetchStatus(""), 2500);
      return;
    }

    setIsFetching(true);
    setFetchStatus("");
    setFetchStatusType("");

    try {
      const found = await fetchAllStarred(githubToken);
      const existing = repos
        .split("\n")
        .map((repo) => repo.trim())
        .filter(Boolean);
      const existingRepos = new Set(existing);
      const merged = [...new Set([...existing, ...found])];
      const added = found.filter((repo) => !existingRepos.has(repo)).length;

      setRepos(merged.join("\n"));
      setFetchStatus(
        added > 0
          ? `Found ${found.length} awesome lists, ${added} added.`
          : `Found ${found.length} awesome lists, nothing new.`
      );
      setFetchStatusType("success");
    } catch (error) {
      setFetchStatus(`Error: ${getErrorMessage(error)}`);
      setFetchStatusType("error");
    } finally {
      setIsFetching(false);
    }
  }

  return (
    <div className="container">
      <h1>Awesome List Tracker — Settings</h1>

      <section>
        <h2>GitHub Personal Access Token</h2>
        <p className="hint">
          <a
            href="https://github.com/settings/tokens/new?description=Awesome+List+Tracker&scopes=public_repo"
            target="_blank"
            rel="noopener noreferrer"
          >
            Create one here
          </a>
          . Only <code>public_repo</code> scope needed (or <code>repo</code> for
          private repos).
        </p>
        <div className="token-row">
          <input
            type={showToken ? "text" : "password"}
            value={token}
            placeholder="ghp_..."
            autoComplete="off"
            onChange={(event) => setToken(event.target.value)}
          />
          <button
            id="toggle-token"
            type="button"
            onClick={() => setShowToken((visible) => !visible)}
          >
            {showToken ? "Hide" : "Show"}
          </button>
        </div>
      </section>

      <section>
        <h2>Tracked Repositories</h2>
        <p className="hint">
          One repo per line in <code>owner/repo</code> format.
        </p>
        <div className="fetch-row">
          <button
            id="btn-fetch-starred"
            type="button"
            disabled={isFetching}
            onClick={importStarred}
          >
            {isFetching
              ? "Fetching…"
              : "⭐ Auto-import from starred repos"}
          </button>
          <span
            id="fetch-status"
            className={
              fetchStatusType === "success"
                ? "fetch-ok"
                : fetchStatusType === "error"
                  ? "fetch-error"
                  : ""
            }
          >
            {fetchStatus}
          </span>
        </div>
        <textarea
          rows={10}
          value={repos}
          placeholder={
            "user1/awesome-list\nuser2/awesome-rust\nuser3/awesome-engineer"
          }
          spellCheck={false}
          onChange={(event) => setRepos(event.target.value)}
        />
      </section>

      <div className="actions">
        <button id="btn-save" type="button" onClick={save}>
          Save
        </button>
        <span
          id="save-status"
          className={saveStatus.startsWith("Save failed") ? "save-error" : ""}
        >
          {saveStatus}
        </span>
      </div>
    </div>
  );
}
