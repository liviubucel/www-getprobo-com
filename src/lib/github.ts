const defaultCount = 0; // Safe fallback if the GitHub API is unavailable
let count = -1; // Cached count; -1 means not loaded yet

// Mimics GitHub's star count formatting: 999, 1k, 1.1k, 10k, 1.1M
function formatStars(value: number): string {
  if (value < 1000) {
    return value.toString();
  }
  if (value < 1_000_000) {
    const k = value / 1000;
    const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
    return `${rounded}k`;
  }
  const m = value / 1_000_000;
  const rounded = m >= 10 ? Math.round(m) : Math.round(m * 10) / 10;
  return `${rounded}M`;
}

export async function getStarsCount(): Promise<string> {
  if (import.meta.env.DEV) {
    return formatStars(defaultCount);
  }

  if (count >= 0) {
    return formatStars(count);
  }

  try {
    const response = await fetch(
      "https://api.github.com/repos/liviubucel/www-getprobo-com",
    );
    if (!response.ok) {
      count = defaultCount;
      return formatStars(count);
    }

    const json: { stargazers_count?: unknown } = await response.json();
    if (typeof json.stargazers_count === "number") {
      count = json.stargazers_count;
      return formatStars(count);
    }
  } catch {
    count = defaultCount;
  }

  if (count < 0) {
    count = defaultCount;
  }

  return formatStars(count);
}
