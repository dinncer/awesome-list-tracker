import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getCommitDetail, getCommits } from "../lib/github";
import { getErrorMessage, timeAgo } from "../lib/format";
import { getLastChecked, getThreshold } from "../lib/storage";
import type { GitHubCommit, GitHubCommitFile } from "../lib/types";

interface CommitItemProps {
  commit: GitHubCommit;
  owner: string;
  repo: string;
  token: string;
}

interface CommitListProps {
  fullName: string;
  token: string;
  refreshKey: number;
}

function renderMarkdown(text: string): ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g;

  return text.split(pattern).map((part, index) => {
    const bold = part.match(/^\*\*([^*]+)\*\*$/);
    if (bold) return <strong key={index}>{bold[1]}</strong>;

    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) {
      return (
        <a
          key={index}
          href={link[2]}
          target="_blank"
          rel="noopener noreferrer"
        >
          {link[1]}
        </a>
      );
    }

    return part;
  });
}

function DiffLine({ line }: { line: string }) {
  const isAdd = line.startsWith("+");
  const isDelete = line.startsWith("-");
  const isHunk = line.startsWith("@@");
  const className = [
    "diff-line",
    isAdd ? "diff-add" : "",
    isDelete ? "diff-del dim" : "",
    isHunk ? "diff-hunk dim" : "",
    !isAdd && !isDelete && !isHunk ? "dim" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      {isAdd ? renderMarkdown(line) : line}
    </div>
  );
}

function Diff({ files }: { files?: GitHubCommitFile[] }) {
  if (!files?.length) {
    return <p className="empty">No file changes in this commit.</p>;
  }

  return files.map((file) => (
    <div className="diff-file" key={file.filename}>
      <div className="diff-file-header">
        <span className="diff-filename">{file.filename}</span>
        <span className="diff-stats">
          <span className="add">+{file.additions}</span>
          <span className="del">-{file.deletions}</span>
        </span>
      </div>
      <div className="diff-content">
        {file.patch ? (
          file.patch
            .split("\n")
            .map((line, index) => <DiffLine key={index} line={line} />)
        ) : (
          <div className="diff-line diff-meta">
            Binary or too large — no diff available.
          </div>
        )}
      </div>
    </div>
  ));
}

function CommitItem({ commit, owner, repo, token }: CommitItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [files, setFiles] = useState<GitHubCommitFile[]>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle(): Promise<void> {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);

    if (!nextOpen || isLoaded || isLoading) return;

    setIsLoading(true);
    setError("");
    try {
      const detail = await getCommitDetail(owner, repo, commit.sha, token);
      setFiles(detail.files);
      setIsLoaded(true);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={`commit-item${isOpen ? " open" : ""}`}>
      <button className="commit-header" type="button" onClick={toggle}>
        <span className="commit-sha">{commit.sha.slice(0, 7)}</span>
        <span className="commit-info">
          <span className="commit-msg">
            {commit.commit.message.split("\n")[0]}
          </span>
          <span className="commit-meta">
            {commit.commit.author.name} · {timeAgo(commit.commit.author.date)}
          </span>
        </span>
        <span className="commit-arrow">{isOpen ? "⌄" : "›"}</span>
      </button>
      {isOpen && (
        <div className="commit-diff">
          {isLoading && <div className="loading-diff">Loading diff…</div>}
          {error && <p className="error-msg diff-error">Error: {error}</p>}
          {!isLoading && !error && <Diff files={files} />}
        </div>
      )}
    </div>
  );
}

export function CommitList({
  fullName,
  token,
  refreshKey,
}: CommitListProps) {
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isCaughtUp, setIsCaughtUp] = useState(false);
  const [owner, repo] = useMemo(() => fullName.split("/"), [fullName]);

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      setIsLoading(true);
      setError("");
      setIsCaughtUp(false);

      try {
        const allCommits = await getCommits(
          owner,
          repo,
          token,
          refreshKey > 0
        );
        const lastChecked = await getLastChecked(owner, repo);
        const threshold = getThreshold(lastChecked);
        const unread = allCommits.filter(
          (commit) =>
            new Date(commit.commit.author.date).getTime() > threshold
        );

        if (!active) return;
        setCommits(unread);
        setIsCaughtUp(allCommits.length > 0 && unread.length === 0);
      } catch (loadError) {
        if (active) setError(getErrorMessage(loadError));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [owner, repo, token, refreshKey]);

  if (isLoading) return <div id="loading">Loading...</div>;
  if (error) return <div className="error-msg">Error: {error}</div>;
  if (isCaughtUp) return <div id="all-caught-up">✓ All caught up!</div>;
  if (commits.length === 0) return <p className="empty">No commits found.</p>;

  return commits.map((commit) => (
    <CommitItem
      key={commit.sha}
      commit={commit}
      owner={owner}
      repo={repo}
      token={token}
    />
  ));
}
