const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

export function timeAgo(date: string): string {
  const difference = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(difference / MS_PER_MINUTE);
  const hours = Math.floor(difference / MS_PER_HOUR);
  const days = Math.floor(difference / MS_PER_DAY);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
